import type { BusinessActivity, ProLocalRole } from '../domain/models.ts';
import { PublicationStatus, SystemAction } from '../domain/models.ts';
import { AccessControlPolicy } from '../domain/policies/AccessControlPolicy.ts';
import type { IBusinessActivityRepository } from '../repositories/BusinessActivityRepository.ts';
import type { IAuditLogRepository } from '../repositories/AuditLogRepository.ts';

export class ActivityManagementService {
  private activityRepo: IBusinessActivityRepository;
  private auditRepo?: IAuditLogRepository;

  constructor(
    activityRepo: IBusinessActivityRepository,
    auditRepo?: IAuditLogRepository
  ) {
    this.activityRepo = activityRepo;
    this.auditRepo = auditRepo;
  }

  /**
   * Modifica i dati dell'attività verificando sia il Ruolo che l'Ownership della risorsa.
   * Lancia un errore se il socio tenta di modificare un'attività non sua
   * o se l'amministratore tecnico tenta di modificare l'attività.
   * 
   * Se presente un auditRepo, registra un AuditLogEntry immutabile associato all'attore autenticato.
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

    const updated: BusinessActivity = {
      ...existing,
      ...updates,
      id: existing.id,
      memberId: existing.memberId, // Protezione: non può cambiare l'owner
      // La modifica riavvia il workflow di approvazione
      statoPubblicazione: PublicationStatus.IN_ATTESA_APPROVAZIONE,
      dataUltimoAggiornamento: new Date().toISOString().split('T')[0]
    };

    const saved = await this.activityRepo.update(updated);

    // Registrazione audit trail post-persistenza (senza esporre credenziali o dati personali non necessari)
    if (this.auditRepo) {
      const auditEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        actorId: actorMemberId,
        action: SystemAction.MODIFICA_ATTIVITA,
        resourceType: 'BUSINESS_ACTIVITY',
        resourceId: saved.id,
        timestamp: new Date().toISOString(),
        metadata: {
          previousPublicationStatus: existing.statoPubblicazione,
          newPublicationStatus: saved.statoPubblicazione,
          modifiedFields: Object.keys(updates)
        }
      };
      await this.auditRepo.log(auditEntry);
    }

    return saved;
  }
}
