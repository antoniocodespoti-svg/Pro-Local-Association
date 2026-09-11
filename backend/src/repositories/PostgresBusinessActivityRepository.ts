import type { IBusinessActivityRepository } from './BusinessActivityRepository.ts';
import type { BusinessActivity, ActivityCategory, PublicationStatus } from '../domain/models.ts';
import type { Queryable } from '../db/migrator.ts';

export class PostgresBusinessActivityRepository implements IBusinessActivityRepository {
  private client: Queryable;

  constructor(client: Queryable) {
    this.client = client;
  }

  private mapRowToActivity(row: any): BusinessActivity {
    let parsedServices: string[] = [];
    try {
      if (Array.isArray(row.servizi_offerti)) {
        parsedServices = row.servizi_offerti;
      } else if (typeof row.servizi_offerti === 'string') {
        parsedServices = JSON.parse(row.servizi_offerti);
      }
    } catch {
      parsedServices = [row.servizi_offerti];
    }

    const dataAggiornamentoStr =
      row.data_ultimo_aggiornamento instanceof Date
        ? row.data_ultimo_aggiornamento.toISOString().split('T')[0]
        : String(row.data_ultimo_aggiornamento || '');

    return {
      id: row.id,
      memberId: row.member_id,
      nomeAttivita: row.nome_attivita,
      categoria: row.categoria as ActivityCategory,
      descrizioneBreve: row.descrizione_breve,
      descrizioneCompleta: row.descrizione_completa,
      serviziOfferti: parsedServices,
      localita: row.localita,
      indirizzoPubblico: row.indirizzo_pubblico || undefined,
      telefonoPubblico: row.telefono_pubblico || undefined,
      emailPubblica: row.email_pubblica || undefined,
      sitoWeb: row.sito_web || undefined,
      socialInstagram: row.social_instagram || undefined,
      socialLinkedin: row.social_linkedin || undefined,
      orariApertura: row.orari_apertura || undefined,
      statoPubblicazione: row.publication_status as PublicationStatus,
      dataUltimoAggiornamento: dataAggiornamentoStr,
      noteRevisioneAdmin: row.note_revisione_admin || undefined
    };
  }

  async findById(id: string): Promise<BusinessActivity | null> {
    const res = await this.client.query(
      `SELECT id, member_id, nome_attivita, categoria, descrizione_breve, descrizione_completa,
              servizi_offerti, localita, indirizzo_pubblico, telefono_pubblico, email_pubblica,
              sito_web, social_instagram, social_linkedin, orari_apertura, publication_status,
              data_ultimo_aggiornamento, note_revisione_admin
       FROM business_activities
       WHERE id = $1;`,
      [id]
    );

    if (res.rows.length === 0) {
      return null;
    }
    return this.mapRowToActivity(res.rows[0]);
  }

  async findByMemberId(memberId: string): Promise<BusinessActivity[]> {
    const res = await this.client.query(
      `SELECT id, member_id, nome_attivita, categoria, descrizione_breve, descrizione_completa,
              servizi_offerti, localita, indirizzo_pubblico, telefono_pubblico, email_pubblica,
              sito_web, social_instagram, social_linkedin, orari_apertura, publication_status,
              data_ultimo_aggiornamento, note_revisione_admin
       FROM business_activities
       WHERE member_id = $1
       ORDER BY id ASC;`,
      [memberId]
    );
    return res.rows.map((r: any) => this.mapRowToActivity(r));
  }

  async findAll(): Promise<BusinessActivity[]> {
    const res = await this.client.query(
      `SELECT id, member_id, nome_attivita, categoria, descrizione_breve, descrizione_completa,
              servizi_offerti, localita, indirizzo_pubblico, telefono_pubblico, email_pubblica,
              sito_web, social_instagram, social_linkedin, orari_apertura, publication_status,
              data_ultimo_aggiornamento, note_revisione_admin
       FROM business_activities
       ORDER BY id ASC;`
    );
    return res.rows.map((r: any) => this.mapRowToActivity(r));
  }

  async update(activity: BusinessActivity): Promise<BusinessActivity> {
    const today = new Date().toISOString().split('T')[0];
    const res = await this.client.query(
      `UPDATE business_activities
       SET nome_attivita = $1,
           categoria = $2,
           descrizione_breve = $3,
           descrizione_completa = $4,
           servizi_offerti = $5,
           localita = $6,
           indirizzo_pubblico = $7,
           telefono_pubblico = $8,
           email_pubblica = $9,
           sito_web = $10,
           social_instagram = $11,
           social_linkedin = $12,
           orari_apertura = $13,
           publication_status = $14,
           data_ultimo_aggiornamento = $15,
           note_revisione_admin = $16,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $17
       RETURNING id, member_id, nome_attivita, categoria, descrizione_breve, descrizione_completa,
                 servizi_offerti, localita, indirizzo_pubblico, telefono_pubblico, email_pubblica,
                 sito_web, social_instagram, social_linkedin, orari_apertura, publication_status,
                 data_ultimo_aggiornamento, note_revisione_admin;`,
      [
        activity.nomeAttivita,
        activity.categoria,
        activity.descrizioneBreve,
        activity.descrizioneCompleta,
        JSON.stringify(activity.serviziOfferti),
        activity.localita,
        activity.indirizzoPubblico || null,
        activity.telefonoPubblico || null,
        activity.emailPubblica || null,
        activity.sitoWeb || null,
        activity.socialInstagram || null,
        activity.socialLinkedin || null,
        activity.orariApertura || null,
        activity.statoPubblicazione,
        today,
        activity.noteRevisioneAdmin || null,
        activity.id
      ]
    );

    if (res.rows.length === 0) {
      throw new Error(`Attività non trovata per l'aggiornamento: ${activity.id}`);
    }
    return this.mapRowToActivity(res.rows[0]);
  }

  async updatePublicationStatus(id: string, status: PublicationStatus): Promise<BusinessActivity | null> {
    const today = new Date().toISOString().split('T')[0];
    const res = await this.client.query(
      `UPDATE business_activities
       SET publication_status = $1,
           data_ultimo_aggiornamento = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, member_id, nome_attivita, categoria, descrizione_breve, descrizione_completa,
                 servizi_offerti, localita, indirizzo_pubblico, telefono_pubblico, email_pubblica,
                 sito_web, social_instagram, social_linkedin, orari_apertura, publication_status,
                 data_ultimo_aggiornamento, note_revisione_admin;`,
      [status, today, id]
    );

    if (res.rows.length === 0) {
      return null;
    }
    return this.mapRowToActivity(res.rows[0]);
  }

  async create(activity: BusinessActivity): Promise<BusinessActivity> {
    const today = activity.dataUltimoAggiornamento || new Date().toISOString().split('T')[0];
    const res = await this.client.query(
      `INSERT INTO business_activities (
        id, member_id, nome_attivita, categoria, descrizione_breve,
        descrizione_completa, servizi_offerti, localita, indirizzo_pubblico,
        telefono_pubblico, email_pubblica, sito_web, social_instagram,
        social_linkedin, orari_apertura, publication_status,
        data_ultimo_aggiornamento, note_revisione_admin
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id, member_id, nome_attivita, categoria, descrizione_breve, descrizione_completa,
                servizi_offerti, localita, indirizzo_pubblico, telefono_pubblico, email_pubblica,
                sito_web, social_instagram, social_linkedin, orari_apertura, publication_status,
                data_ultimo_aggiornamento, note_revisione_admin;`,
      [
        activity.id,
        activity.memberId,
        activity.nomeAttivita,
        activity.categoria,
        activity.descrizioneBreve,
        activity.descrizioneCompleta,
        JSON.stringify(activity.serviziOfferti),
        activity.localita,
        activity.indirizzoPubblico || null,
        activity.telefonoPubblico || null,
        activity.emailPubblica || null,
        activity.sitoWeb || null,
        activity.socialInstagram || null,
        activity.socialLinkedin || null,
        activity.orariApertura || null,
        activity.statoPubblicazione,
        today,
        activity.noteRevisioneAdmin || null
      ]
    );
    return this.mapRowToActivity(res.rows[0]);
  }
}
