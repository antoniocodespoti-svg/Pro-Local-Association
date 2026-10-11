import type { BusinessActivity, ProLocalRole, ActivityRevision } from '../domain/models.ts';
import { PublicationStatus, RevisionStatus, SystemAction } from '../domain/models.ts';
import { AccessControlPolicy } from '../domain/policies/AccessControlPolicy.ts';
import type { IBusinessActivityRepository } from '../repositories/BusinessActivityRepository.ts';
import type { IActivityRevisionRepository } from '../repositories/ActivityRevisionRepository.ts';
import { InMemoryActivityRevisionRepository } from '../repositories/ActivityRevisionRepository.ts';
import type { IAuditLogRepository } from '../repositories/AuditLogRepository.ts';
import type { Queryable } from '../db/migrator.ts';
import { PostgresActivityRevisionRepository } from '../repositories/PostgresActivityRevisionRepository.ts';
import { PostgresBusinessActivityRepository } from '../repositories/PostgresBusinessActivityRepository.ts';
import { PostgresAuditLogRepository } from '../repositories/PostgresAuditLogRepository.ts';

export class ActivityManagementService {
  private activityRepo: IBusinessActivityRepository;
  private revisionRepo: IActivityRevisionRepository;
  private auditRepo?: IAuditLogRepository;
  private client?: Queryable;

  constructor(
    activityRepo: IBusinessActivityRepository,
    revisionRepoOrAuditRepo?: IActivityRevisionRepository | IAuditLogRepository,
    auditRepo?: IAuditLogRepository,
    client?: Queryable
  ) {
    this.activityRepo = activityRepo;

    // Preserva retrocompatibilità con new ActivityManagementService(activityRepo, auditRepo)
    if (
      revisionRepoOrAuditRepo &&
      'create' in revisionRepoOrAuditRepo &&
      'findPending' in revisionRepoOrAuditRepo
    ) {
      this.revisionRepo = revisionRepoOrAuditRepo as IActivityRevisionRepository;
      this.auditRepo = auditRepo;
      this.client = client;
    } else {
      this.revisionRepo = new InMemoryActivityRevisionRepository();
      this.auditRepo = revisionRepoOrAuditRepo as IAuditLogRepository | undefined;
      this.client = client;
    }
  }

  /**
   * Modifica i dati dell'attività in modo NON DISTRUTTIVO:
   * Non sovrascrive mai direttamente la scheda pubblicata in business_activities.
   * Crea o aggiorna una revisione in stato IN_ATTESA_APPROVAZIONE.
   * La scheda live originaria rimane intatta in vetrina fino all'approvazione.
   */
  async updateActivity(
    actorMemberId: string,
    actorRole: ProLocalRole,
    activityId: string,
    updates: Partial<BusinessActivity>
  ): Promise<BusinessActivity> {
    const existing = await this.activityRepo.findById(activityId);
    if (!existing) {
      throw new Error('Attività non trovata');
    }

    const canEdit = AccessControlPolicy.canEditActivity(actorMemberId, actorRole, existing);
    if (!canEdit) {
      throw new Error(
        `Accesso negato: il soggetto (${actorRole}, id=${actorMemberId}) non ha i permessi di ownership per modificare l'attività (${activityId})`
      );
    }

    // Cerca se esiste già una revisione pendente per questa attività
    const pendingRevision = await this.revisionRepo.findPendingByActivityId(activityId);
    let savedRevision: ActivityRevision;

    if (pendingRevision) {
      // Aggiorna la revisione pendente esistente senza creare duplicati
      const updatedRevision: ActivityRevision = {
        ...pendingRevision,
        nomeAttivita: updates.nomeAttivita ?? pendingRevision.nomeAttivita,
        categoria: updates.categoria ?? pendingRevision.categoria,
        descrizioneBreve: updates.descrizioneBreve ?? pendingRevision.descrizioneBreve,
        descrizioneCompleta: updates.descrizioneCompleta ?? pendingRevision.descrizioneCompleta,
        serviziOfferti: updates.serviziOfferti ?? pendingRevision.serviziOfferti,
        localita: updates.localita ?? pendingRevision.localita,
        indirizzoPubblico: updates.indirizzoPubblico !== undefined ? updates.indirizzoPubblico : pendingRevision.indirizzoPubblico,
        telefonoPubblico: updates.telefonoPubblico !== undefined ? updates.telefonoPubblico : pendingRevision.telefonoPubblico,
        emailPubblica: updates.emailPubblica !== undefined ? updates.emailPubblica : pendingRevision.emailPubblica,
        sitoWeb: updates.sitoWeb !== undefined ? updates.sitoWeb : pendingRevision.sitoWeb,
        socialInstagram: updates.socialInstagram !== undefined ? updates.socialInstagram : pendingRevision.socialInstagram,
        socialLinkedin: updates.socialLinkedin !== undefined ? updates.socialLinkedin : pendingRevision.socialLinkedin,
        orariApertura: updates.orariApertura !== undefined ? updates.orariApertura : pendingRevision.orariApertura,
        revisionStatus: RevisionStatus.IN_ATTESA_APPROVAZIONE,
        submittedAt: new Date().toISOString()
      };
      savedRevision = await this.revisionRepo.update(updatedRevision);
    } else {
      // Crea una nuova revisione pendente (anche nel caso in cui la precedente fosse RIFIUTATA)
      const newRevision: ActivityRevision = {
        id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        activityId: existing.id,
        memberId: existing.memberId,
        nomeAttivita: updates.nomeAttivita ?? existing.nomeAttivita,
        categoria: updates.categoria ?? existing.categoria,
        descrizioneBreve: updates.descrizioneBreve ?? existing.descrizioneBreve,
        descrizioneCompleta: updates.descrizioneCompleta ?? existing.descrizioneCompleta,
        serviziOfferti: updates.serviziOfferti ?? existing.serviziOfferti,
        localita: updates.localita ?? existing.localita,
        indirizzoPubblico: updates.indirizzoPubblico !== undefined ? updates.indirizzoPubblico : existing.indirizzoPubblico,
        telefonoPubblico: updates.telefonoPubblico !== undefined ? updates.telefonoPubblico : existing.telefonoPubblico,
        emailPubblica: updates.emailPubblica !== undefined ? updates.emailPubblica : existing.emailPubblica,
        sitoWeb: updates.sitoWeb !== undefined ? updates.sitoWeb : existing.sitoWeb,
        socialInstagram: updates.socialInstagram !== undefined ? updates.socialInstagram : existing.socialInstagram,
        socialLinkedin: updates.socialLinkedin !== undefined ? updates.socialLinkedin : existing.socialLinkedin,
        orariApertura: updates.orariApertura !== undefined ? updates.orariApertura : existing.orariApertura,
        revisionStatus: RevisionStatus.IN_ATTESA_APPROVAZIONE,
        submittedAt: new Date().toISOString()
      };
      savedRevision = await this.revisionRepo.create(newRevision);
    }

    // La scheda live in business_activities rimane INVARIATA.
    // Registrazione audit trail immutabile
    if (this.auditRepo) {
      const auditEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        actorId: actorMemberId,
        action: SystemAction.MODIFICA_ATTIVITA,
        resourceType: 'BUSINESS_ACTIVITY',
        resourceId: existing.id,
        timestamp: new Date().toISOString(),
        metadata: {
          revisionId: savedRevision.id,
          isDraft: true,
          liveActivityPreserved: existing.statoPubblicazione === PublicationStatus.PUBBLICATA,
          modifiedFields: Object.keys(updates)
        }
      };
      await this.auditRepo.log(auditEntry);
    }

    // Restituisce la scheda originaria preservata
    return existing;
  }

  /**
   * Approva una revisione pendente in modo atomico e transazionale.
   * Riservato esclusivamente al Presidente, con divieto di auto-approvazione.
   */
  async approveRevision(
    presidentMemberId: string,
    presidentRole: ProLocalRole,
    revisionId: string
  ): Promise<{ activity: BusinessActivity; revision: ActivityRevision }> {
    if (!AccessControlPolicy.canViewPendingRevisions(presidentRole)) {
      throw new Error('Accesso negato: solo il Presidente può approvare revisioni');
    }

    // 1. ESECUZIONE TRANSAZIONALE SU POSTGRESQL (se client presente)
    if (this.client) {
      const dedicatedClient =
        typeof this.client.connect === 'function' ? await this.client.connect() : null;
      const txClient = dedicatedClient || this.client;

      let originalRevision: ActivityRevision | undefined;
      let originalActivity: BusinessActivity | undefined;

      const txRevisionRepo = new PostgresActivityRevisionRepository(txClient);
      const txActivityRepo = new PostgresBusinessActivityRepository(txClient);
      const txAuditRepo =
        this.auditRepo instanceof PostgresAuditLogRepository
          ? new PostgresAuditLogRepository(txClient)
          : this.auditRepo;

      try {
        await txClient.query('BEGIN');

        // Lock FOR UPDATE per serializzare richieste concorrenti
        const revision = await txRevisionRepo.findByIdForUpdate(revisionId);
        if (!revision) {
          throw new Error(`Revisione non trovata: ${revisionId}`);
        }

        if (revision.revisionStatus !== RevisionStatus.IN_ATTESA_APPROVAZIONE) {
          throw new Error(
            `Impossibile approvare: la revisione non è in attesa di approvazione (stato attuale: ${revision.revisionStatus})`
          );
        }

        if (!AccessControlPolicy.canApproveRevision(presidentMemberId, presidentRole, revision)) {
          throw new Error(
            'Accesso negato: il Presidente non può approvare la propria scheda attività (conflitto di interessi)'
          );
        }

        const activity = await txActivityRepo.findById(revision.activityId);
        if (!activity) {
          throw new Error(`Attività collegata non trovata: ${revision.activityId}`);
        }

        originalRevision = { ...revision };
        originalActivity = { ...activity };

        // Aggiornamento stato revisione
        const approvedAt = new Date().toISOString();
        const approvedRevision: ActivityRevision = {
          ...revision,
          revisionStatus: RevisionStatus.PUBBLICATA,
          reviewedAt: approvedAt,
          reviewedBy: presidentMemberId
        };
        const savedRevision = await txRevisionRepo.update(approvedRevision);

        // Aggiornamento scheda principale
        const today = new Date().toISOString().split('T')[0];
        const updatedActivity: BusinessActivity = {
          ...activity,
          nomeAttivita: revision.nomeAttivita,
          categoria: revision.categoria,
          descrizioneBreve: revision.descrizioneBreve,
          descrizioneCompleta: revision.descrizioneCompleta,
          serviziOfferti: revision.serviziOfferti,
          localita: revision.localita,
          indirizzoPubblico: revision.indirizzoPubblico,
          telefonoPubblico: revision.telefonoPubblico,
          emailPubblica: revision.emailPubblica,
          sitoWeb: revision.sitoWeb,
          socialInstagram: revision.socialInstagram,
          socialLinkedin: revision.socialLinkedin,
          orariApertura: revision.orariApertura,
          statoPubblicazione: PublicationStatus.PUBBLICATA,
          dataUltimoAggiornamento: today
        };
        const savedActivity = await txActivityRepo.update(updatedActivity);

        // Scrittura audit log PRIMA del COMMIT
        if (txAuditRepo) {
          await txAuditRepo.log({
            id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            actorId: presidentMemberId,
            action: SystemAction.APPROVAZIONE_REVISIONE_ATTIVITA,
            resourceType: 'BUSINESS_ACTIVITY',
            resourceId: savedActivity.id,
            timestamp: approvedAt,
            metadata: {
              revisionId: savedRevision.id,
              activityName: savedRevision.nomeAttivita,
              approvedAt
            }
          });
        }

        await txClient.query('COMMIT');
        return { activity: savedActivity, revision: savedRevision };
      } catch (error) {
        try {
          await txClient.query('ROLLBACK');
        } catch {
          // ignore rollback error
        }
        if (originalRevision && originalActivity) {
          try {
            await txRevisionRepo.update(originalRevision);
            await txActivityRepo.update(originalActivity);
          } catch {
            // ignore
          }
        }
        throw error;
      } finally {
        if (dedicatedClient && typeof dedicatedClient.release === 'function') {
          dedicatedClient.release();
        }
      }
    }

    // 2. ESECUZIONE IN-MEMORY CON SNAPSHOT DETERMINISTICO
    const revision = await this.revisionRepo.findByIdForUpdate(revisionId);
    if (!revision) {
      throw new Error(`Revisione non trovata: ${revisionId}`);
    }

    if (revision.revisionStatus !== RevisionStatus.IN_ATTESA_APPROVAZIONE) {
      throw new Error(
        `Impossibile approvare: la revisione non è in attesa di approvazione (stato attuale: ${revision.revisionStatus})`
      );
    }

    if (!AccessControlPolicy.canApproveRevision(presidentMemberId, presidentRole, revision)) {
      throw new Error(
        'Accesso negato: il Presidente non può approvare la propria scheda attività (conflitto di interessi)'
      );
    }

    const activity = await this.activityRepo.findById(revision.activityId);
    if (!activity) {
      throw new Error(`Attività collegata non trovata: ${revision.activityId}`);
    }

    // Snapshot per rollback in-memory
    const revisionSnapshot = { ...revision };
    const activitySnapshot = { ...activity };

    try {
      const approvedAt = new Date().toISOString();
      const approvedRevision: ActivityRevision = {
        ...revision,
        revisionStatus: RevisionStatus.PUBBLICATA,
        reviewedAt: approvedAt,
        reviewedBy: presidentMemberId
      };
      const savedRevision = await this.revisionRepo.update(approvedRevision);

      const today = new Date().toISOString().split('T')[0];
      const updatedActivity: BusinessActivity = {
        ...activity,
        nomeAttivita: revision.nomeAttivita,
        categoria: revision.categoria,
        descrizioneBreve: revision.descrizioneBreve,
        descrizioneCompleta: revision.descrizioneCompleta,
        serviziOfferti: revision.serviziOfferti,
        localita: revision.localita,
        indirizzoPubblico: revision.indirizzoPubblico,
        telefonoPubblico: revision.telefonoPubblico,
        emailPubblica: revision.emailPubblica,
        sitoWeb: revision.sitoWeb,
        socialInstagram: revision.socialInstagram,
        socialLinkedin: revision.socialLinkedin,
        orariApertura: revision.orariApertura,
        statoPubblicazione: PublicationStatus.PUBBLICATA,
        dataUltimoAggiornamento: today
      };
      const savedActivity = await this.activityRepo.update(updatedActivity);

      if (this.auditRepo) {
        await this.auditRepo.log({
          id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          actorId: presidentMemberId,
          action: SystemAction.APPROVAZIONE_REVISIONE_ATTIVITA,
          resourceType: 'BUSINESS_ACTIVITY',
          resourceId: savedActivity.id,
          timestamp: approvedAt,
          metadata: {
            revisionId: savedRevision.id,
            activityName: savedRevision.nomeAttivita,
            approvedAt
          }
        });
      }

      return { activity: savedActivity, revision: savedRevision };
    } catch (error) {
      // Ripristino atomico snapshot in-memory
      await this.revisionRepo.update(revisionSnapshot);
      await this.activityRepo.update(activitySnapshot);
      throw error;
    }
  }

  /**
   * Rifiuta una revisione pendente con motivazione obbligatoria.
   * La scheda live originaria in business_activities NON viene modificata.
   */
  async rejectRevision(
    presidentMemberId: string,
    presidentRole: ProLocalRole,
    revisionId: string,
    reason: string
  ): Promise<ActivityRevision> {
    if (!AccessControlPolicy.canViewPendingRevisions(presidentRole)) {
      throw new Error('Accesso negato: solo il Presidente può rifiutare revisioni');
    }

    if (typeof reason !== 'string' || reason.trim().length < 10) {
      throw new Error('La motivazione del rifiuto è obbligatoria (almeno 10 caratteri)');
    }

    const trimmedReason = reason.trim();

    // 1. ESECUZIONE TRANSAZIONALE SU POSTGRESQL (se client presente)
    if (this.client) {
      const dedicatedClient =
        typeof this.client.connect === 'function' ? await this.client.connect() : null;
      const txClient = dedicatedClient || this.client;

      let originalRevision: ActivityRevision | undefined;

      const txRevisionRepo = new PostgresActivityRevisionRepository(txClient);
      const txAuditRepo =
        this.auditRepo instanceof PostgresAuditLogRepository
          ? new PostgresAuditLogRepository(txClient)
          : this.auditRepo;

      try {
        await txClient.query('BEGIN');

        // Lock FOR UPDATE
        const revision = await txRevisionRepo.findByIdForUpdate(revisionId);
        if (!revision) {
          throw new Error(`Revisione non trovata: ${revisionId}`);
        }

        if (revision.revisionStatus !== RevisionStatus.IN_ATTESA_APPROVAZIONE) {
          throw new Error(
            `Impossibile rifiutare: la revisione non è in attesa di approvazione (stato attuale: ${revision.revisionStatus})`
          );
        }

        if (!AccessControlPolicy.canRejectRevision(presidentMemberId, presidentRole, revision)) {
          throw new Error(
            'Accesso negato: il Presidente non può rifiutare la propria scheda attività'
          );
        }

        originalRevision = { ...revision };
        const rejectedAt = new Date().toISOString();
        const rejectedRevision: ActivityRevision = {
          ...revision,
          revisionStatus: RevisionStatus.RIFIUTATA,
          reviewNotes: trimmedReason,
          reviewedAt: rejectedAt,
          reviewedBy: presidentMemberId
        };
        const savedRevision = await txRevisionRepo.update(rejectedRevision);

        // La scheda live in business_activities NON viene modificata

        if (txAuditRepo) {
          await txAuditRepo.log({
            id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            actorId: presidentMemberId,
            action: SystemAction.RIFIUTO_REVISIONE_ATTIVITA,
            resourceType: 'BUSINESS_ACTIVITY',
            resourceId: revision.activityId,
            timestamp: rejectedAt,
            metadata: {
              revisionId: savedRevision.id,
              motivazione: trimmedReason,
              rejectedAt
            }
          });
        }

        await txClient.query('COMMIT');
        return savedRevision;
      } catch (error) {
        try {
          await txClient.query('ROLLBACK');
        } catch {
          // ignore rollback error
        }
        if (originalRevision) {
          try {
            await txRevisionRepo.update(originalRevision);
          } catch {
            // ignore
          }
        }
        throw error;
      } finally {
        if (dedicatedClient && typeof dedicatedClient.release === 'function') {
          dedicatedClient.release();
        }
      }
    }

    // 2. ESECUZIONE IN-MEMORY CON SNAPSHOT DETERMINISTICO
    const revision = await this.revisionRepo.findByIdForUpdate(revisionId);
    if (!revision) {
      throw new Error(`Revisione non trovata: ${revisionId}`);
    }

    if (revision.revisionStatus !== RevisionStatus.IN_ATTESA_APPROVAZIONE) {
      throw new Error(
        `Impossibile rifiutare: la revisione non è in attesa di approvazione (stato attuale: ${revision.revisionStatus})`
      );
    }

    if (!AccessControlPolicy.canRejectRevision(presidentMemberId, presidentRole, revision)) {
      throw new Error(
        'Accesso negato: il Presidente non può rifiutare la propria scheda attività'
      );
    }

    const revisionSnapshot = { ...revision };

    try {
      const rejectedAt = new Date().toISOString();
      const rejectedRevision: ActivityRevision = {
        ...revision,
        revisionStatus: RevisionStatus.RIFIUTATA,
        reviewNotes: trimmedReason,
        reviewedAt: rejectedAt,
        reviewedBy: presidentMemberId
      };
      const savedRevision = await this.revisionRepo.update(rejectedRevision);

      if (this.auditRepo) {
        await this.auditRepo.log({
          id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          actorId: presidentMemberId,
          action: SystemAction.RIFIUTO_REVISIONE_ATTIVITA,
          resourceType: 'BUSINESS_ACTIVITY',
          resourceId: revision.activityId,
          timestamp: rejectedAt,
          metadata: {
            revisionId: savedRevision.id,
            motivazione: trimmedReason,
            rejectedAt
          }
        });
      }

      return savedRevision;
    } catch (error) {
      await this.revisionRepo.update(revisionSnapshot);
      throw error;
    }
  }

  /**
   * Restituisce la coda delle revisioni in attesa di approvazione.
   * Riservato esclusivamente al Presidente.
   */
  async getPendingRevisions(presidentRole: ProLocalRole): Promise<ActivityRevision[]> {
    if (!AccessControlPolicy.canViewPendingRevisions(presidentRole)) {
      throw new Error('Accesso negato: solo il Presidente può consultare la coda delle revisioni');
    }
    return this.revisionRepo.findPending();
  }

  /**
   * Recupera una specifica revisione per ID.
   */
  async getRevisionById(revisionId: string): Promise<ActivityRevision | null> {
    return this.revisionRepo.findById(revisionId);
  }
}
