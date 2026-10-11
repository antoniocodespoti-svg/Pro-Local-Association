import type { IActivityRevisionRepository } from './ActivityRevisionRepository.ts';
import type { ActivityRevision, ActivityCategory, RevisionStatus } from '../domain/models.ts';
import type { Queryable } from '../db/migrator.ts';

export class PostgresActivityRevisionRepository implements IActivityRevisionRepository {
  private client: Queryable;

  constructor(client: Queryable) {
    this.client = client;
  }

  private mapRowToRevision(row: any): ActivityRevision {
    let parsedServices: string[] = [];
    try {
      parsedServices = typeof row.servizi_offerti === 'string' ? JSON.parse(row.servizi_offerti) : row.servizi_offerti;
      if (!Array.isArray(parsedServices)) {
        parsedServices = [String(row.servizi_offerti)];
      }
    } catch {
      parsedServices = [row.servizi_offerti];
    }

    const submittedAtStr =
      row.submitted_at instanceof Date
        ? row.submitted_at.toISOString()
        : String(row.submitted_at || '');

    const reviewedAtStr =
      row.reviewed_at instanceof Date
        ? row.reviewed_at.toISOString()
        : row.reviewed_at
        ? String(row.reviewed_at)
        : undefined;

    return {
      id: row.id,
      activityId: row.activity_id,
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
      revisionStatus: row.revision_status as RevisionStatus,
      submittedAt: submittedAtStr,
      reviewedAt: reviewedAtStr,
      reviewedBy: row.reviewed_by || undefined,
      reviewNotes: row.review_notes || undefined
    };
  }

  async create(revision: ActivityRevision): Promise<ActivityRevision> {
    const res = await this.client.query(
      `INSERT INTO activity_revisions (
        id, activity_id, member_id, nome_attivita, categoria,
        descrizione_breve, descrizione_completa, servizi_offerti,
        localita, indirizzo_pubblico, telefono_pubblico, email_pubblica,
        sito_web, social_instagram, social_linkedin, orari_apertura,
        revision_status, submitted_at, reviewed_at, reviewed_by, review_notes
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, $16,
        $17, $18, $19, $20, $21
      )
      RETURNING id, activity_id, member_id, nome_attivita, categoria,
                descrizione_breve, descrizione_completa, servizi_offerti,
                localita, indirizzo_pubblico, telefono_pubblico, email_pubblica,
                sito_web, social_instagram, social_linkedin, orari_apertura,
                revision_status, submitted_at, reviewed_at, reviewed_by, review_notes;`,
      [
        revision.id,
        revision.activityId,
        revision.memberId,
        revision.nomeAttivita,
        revision.categoria,
        revision.descrizioneBreve,
        revision.descrizioneCompleta,
        JSON.stringify(revision.serviziOfferti || []),
        revision.localita,
        revision.indirizzoPubblico || null,
        revision.telefonoPubblico || null,
        revision.emailPubblica || null,
        revision.sitoWeb || null,
        revision.socialInstagram || null,
        revision.socialLinkedin || null,
        revision.orariApertura || null,
        revision.revisionStatus,
        revision.submittedAt || new Date().toISOString(),
        revision.reviewedAt || null,
        revision.reviewedBy || null,
        revision.reviewNotes || null
      ]
    );

    return this.mapRowToRevision(res.rows[0]);
  }

  async findById(id: string): Promise<ActivityRevision | null> {
    const res = await this.client.query(
      `SELECT id, activity_id, member_id, nome_attivita, categoria,
              descrizione_breve, descrizione_completa, servizi_offerti,
              localita, indirizzo_pubblico, telefono_pubblico, email_pubblica,
              sito_web, social_instagram, social_linkedin, orari_apertura,
              revision_status, submitted_at, reviewed_at, reviewed_by, review_notes
       FROM activity_revisions
       WHERE id = $1;`,
      [id]
    );

    if (res.rows.length === 0) return null;
    return this.mapRowToRevision(res.rows[0]);
  }

  async findByIdForUpdate(id: string): Promise<ActivityRevision | null> {
    const res = await this.client.query(
      `SELECT id, activity_id, member_id, nome_attivita, categoria,
              descrizione_breve, descrizione_completa, servizi_offerti,
              localita, indirizzo_pubblico, telefono_pubblico, email_pubblica,
              sito_web, social_instagram, social_linkedin, orari_apertura,
              revision_status, submitted_at, reviewed_at, reviewed_by, review_notes
       FROM activity_revisions
       WHERE id = $1
       FOR UPDATE;`,
      [id]
    );

    if (res.rows.length === 0) return null;
    return this.mapRowToRevision(res.rows[0]);
  }

  async findByActivityId(activityId: string): Promise<ActivityRevision[]> {
    const res = await this.client.query(
      `SELECT id, activity_id, member_id, nome_attivita, categoria,
              descrizione_breve, descrizione_completa, servizi_offerti,
              localita, indirizzo_pubblico, telefono_pubblico, email_pubblica,
              sito_web, social_instagram, social_linkedin, orari_apertura,
              revision_status, submitted_at, reviewed_at, reviewed_by, review_notes
       FROM activity_revisions
       WHERE activity_id = $1
       ORDER BY submitted_at DESC;`,
      [activityId]
    );

    return res.rows.map((r: any) => this.mapRowToRevision(r));
  }

  async findPendingByActivityId(activityId: string): Promise<ActivityRevision | null> {
    const res = await this.client.query(
      `SELECT id, activity_id, member_id, nome_attivita, categoria,
              descrizione_breve, descrizione_completa, servizi_offerti,
              localita, indirizzo_pubblico, telefono_pubblico, email_pubblica,
              sito_web, social_instagram, social_linkedin, orari_apertura,
              revision_status, submitted_at, reviewed_at, reviewed_by, review_notes
       FROM activity_revisions
       WHERE activity_id = $1 AND revision_status = 'IN_ATTESA_APPROVAZIONE'
       ORDER BY submitted_at DESC
       LIMIT 1;`,
      [activityId]
    );

    if (res.rows.length === 0) return null;
    return this.mapRowToRevision(res.rows[0]);
  }

  async findPending(): Promise<ActivityRevision[]> {
    const res = await this.client.query(
      `SELECT id, activity_id, member_id, nome_attivita, categoria,
              descrizione_breve, descrizione_completa, servizi_offerti,
              localita, indirizzo_pubblico, telefono_pubblico, email_pubblica,
              sito_web, social_instagram, social_linkedin, orari_apertura,
              revision_status, submitted_at, reviewed_at, reviewed_by, review_notes
       FROM activity_revisions
       WHERE revision_status = 'IN_ATTESA_APPROVAZIONE'
       ORDER BY submitted_at ASC;`
    );

    return res.rows.map((r: any) => this.mapRowToRevision(r));
  }

  async update(revision: ActivityRevision): Promise<ActivityRevision> {
    const res = await this.client.query(
      `UPDATE activity_revisions
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
           revision_status = $14,
           submitted_at = $15,
           reviewed_at = $16,
           reviewed_by = $17,
           review_notes = $18,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $19
       RETURNING id, activity_id, member_id, nome_attivita, categoria,
                 descrizione_breve, descrizione_completa, servizi_offerti,
                 localita, indirizzo_pubblico, telefono_pubblico, email_pubblica,
                 sito_web, social_instagram, social_linkedin, orari_apertura,
                 revision_status, submitted_at, reviewed_at, reviewed_by, review_notes;`,
      [
        revision.nomeAttivita,
        revision.categoria,
        revision.descrizioneBreve,
        revision.descrizioneCompleta,
        JSON.stringify(revision.serviziOfferti || []),
        revision.localita,
        revision.indirizzoPubblico || null,
        revision.telefonoPubblico || null,
        revision.emailPubblica || null,
        revision.sitoWeb || null,
        revision.socialInstagram || null,
        revision.socialLinkedin || null,
        revision.orariApertura || null,
        revision.revisionStatus,
        revision.submittedAt,
        revision.reviewedAt || null,
        revision.reviewedBy || null,
        revision.reviewNotes || null,
        revision.id
      ]
    );

    if (res.rows.length === 0) {
      throw new Error(`Revisione non trovata per l'aggiornamento: ${revision.id}`);
    }
    return this.mapRowToRevision(res.rows[0]);
  }
}
