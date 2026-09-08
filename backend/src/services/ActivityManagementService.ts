import type { BusinessActivity, ProLocalRole } from '../domain/models.ts';
import { PublicationStatus } from '../domain/models.ts';
import { AccessControlPolicy } from '../domain/policies/AccessControlPolicy.ts';
import type { IBusinessActivityRepository } from '../repositories/BusinessActivityRepository.ts';

export class ActivityManagementService {
  private activityRepo: IBusinessActivityRepository;

  constructor(activityRepo: IBusinessActivityRepository) {
    this.activityRepo = activityRepo;
  }

  /**
   * Modifica i dati dell'attività verificando sia il Ruolo che l'Ownership della risorsa.
   * Lancia un errore se il socio tenta di modificare un'attività non sua
   * o se l'amministratore tecnico tenta di modificare l'attività.
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

    return await this.activityRepo.update(updated);
  }
}
