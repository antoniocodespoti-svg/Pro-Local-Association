import type { IMemberRepository } from './MemberRepository.ts';
import type { Member, MembershipStatus } from '../domain/models.ts';
import { MembershipStatus as MembershipStatusConst } from '../domain/models.ts';
import type { Queryable } from '../db/migrator.ts';

export class PostgresMemberRepository implements IMemberRepository {
  private client: Queryable;

  constructor(client: Queryable) {
    this.client = client;
  }

  private mapRowToMember(row: any): Member {
    const dataIscrizioneStr =
      row.data_iscrizione instanceof Date
        ? row.data_iscrizione.toISOString().split('T')[0]
        : String(row.data_iscrizione || '');

    return {
      id: row.id,
      codiceSocio: row.codice_socio,
      nomeCognome: row.nome_cognome,
      emailDemo: row.email_demo,
      dataIscrizione: dataIscrizioneStr,
      statoAssociativo: row.membership_status as MembershipStatus,
      quotaSocialeInRegola: Boolean(row.quota_sociale_in_regola),
      noteAmministrativeInterne: row.note_amministrative_interne || undefined
    };
  }

  async findById(id: string): Promise<Member | null> {
    const res = await this.client.query(
      `SELECT id, codice_socio, nome_cognome, email_demo, data_iscrizione,
              membership_status, quota_sociale_in_regola, note_amministrative_interne
       FROM members
       WHERE id = $1;`,
      [id]
    );

    if (res.rows.length === 0) {
      return null;
    }
    return this.mapRowToMember(res.rows[0]);
  }

  async findAll(): Promise<Member[]> {
    const res = await this.client.query(
      `SELECT id, codice_socio, nome_cognome, email_demo, data_iscrizione,
              membership_status, quota_sociale_in_regola, note_amministrative_interne
       FROM members
       ORDER BY id ASC;`
    );
    return res.rows.map((r: any) => this.mapRowToMember(r));
  }

  async updateStatus(id: string, newStatus: MembershipStatus): Promise<Member | null> {
    const quotaInRegola = newStatus === MembershipStatusConst.ATTIVO;
    const res = await this.client.query(
      `UPDATE members
       SET membership_status = $1,
           quota_sociale_in_regola = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, codice_socio, nome_cognome, email_demo, data_iscrizione,
                 membership_status, quota_sociale_in_regola, note_amministrative_interne;`,
      [newStatus, quotaInRegola, id]
    );

    if (res.rows.length === 0) {
      return null;
    }
    return this.mapRowToMember(res.rows[0]);
  }

  async create(member: Member): Promise<Member> {
    const res = await this.client.query(
      `INSERT INTO members (
        id, codice_socio, nome_cognome, email_demo, data_iscrizione,
        membership_status, quota_sociale_in_regola, note_amministrative_interne
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, codice_socio, nome_cognome, email_demo, data_iscrizione,
                membership_status, quota_sociale_in_regola, note_amministrative_interne;`,
      [
        member.id,
        member.codiceSocio,
        member.nomeCognome,
        member.emailDemo,
        member.dataIscrizione,
        member.statoAssociativo,
        member.quotaSocialeInRegola,
        member.noteAmministrativeInterne || null
      ]
    );
    return this.mapRowToMember(res.rows[0]);
  }
}
