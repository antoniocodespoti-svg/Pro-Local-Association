import { ProLocalRole, SystemAction, MembershipStatus, PublicationStatus } from '../models.ts';
import type { BusinessActivity } from '../models.ts';

/**
 * Policy centrale per la gestione del controllo accessi (RBAC) e della sicurezza del dominio.
 * 
 * Regola di Subordinazione del Software:
 * L'Amministratore Tecnico ha permessi ESCLUSIVAMENTE tecnici (diagnostica, manutenzione, configurazione tecnica, log).
 * È categoricamente NEGATO per qualsiasi operazione associativa, disciplinare, statutaria o di forzatura vetrina.
 */
export class AccessControlPolicy {
  /**
   * Verifica se un determinato ruolo può eseguire una data azione di sistema.
   */
  public static canPerformAction(role: ProLocalRole, action: SystemAction): boolean {
    if (role === ProLocalRole.AMMINISTRATORE_TECNICO) {
      switch (action) {
        case SystemAction.GESTIONE_CONFIGURAZIONE_TECNICA:
        case SystemAction.DIAGNOSTICA_SISTEMA:
        case SystemAction.MANUTENZIONE_INFRASTRUTTURA:
        case SystemAction.CONSULTAZIONE_LOG_TECNICI:
          return true;

        case SystemAction.AMMISSIONE_SOCIO:
        case SystemAction.SOSPENSIONE_SOCIO:
        case SystemAction.ESCLUSIONE_SOCIO:
        case SystemAction.MODIFICA_STATUS_ASSOCIATIVO:
        case SystemAction.ELEZIONE_CONSIGLIERE:
        case SystemAction.REVOCA_CONSIGLIERE:
        case SystemAction.MODIFICA_DECISIONI_ASSOCIATIVE:
        case SystemAction.MODIFICA_STATUTO_REGOLE:
        case SystemAction.ATTRIBUZIONE_COMPETENZA_ASSOCIATIVA:
        case SystemAction.FORZATURA_PUBBLICAZIONE_VETRINA:
        case SystemAction.MODIFICA_ATTIVITA:
        case SystemAction.RICHIESTA_PUBBLICAZIONE_ATTIVITA:
          return false;

        default:
          return false;
      }
    }

    // Le operazioni tecniche pure non sono svolte dagli organi ordinari
    if (
      action === SystemAction.MANUTENZIONE_INFRASTRUTTURA ||
      action === SystemAction.GESTIONE_CONFIGURAZIONE_TECNICA
    ) {
      return false;
    }

    return true;
  }

  /**
   * Verifica se un attore può modificare una specifica attività.
   * Regola di Ownership:
   * - Un socio può modificare solo ed esclusivamente la propria attività.
   * - Un socio non può mai modificare l'attività di un altro socio.
   * - L'amministratore tecnico non può mai modificare schede commerciali dei soci.
   */
  public static canEditActivity(
    actorMemberId: string,
    actorRole: ProLocalRole,
    activity: BusinessActivity
  ): boolean {
    if (actorRole === ProLocalRole.AMMINISTRATORE_TECNICO) {
      return false;
    }

    if (actorRole === ProLocalRole.SOCIO) {
      return activity.memberId === actorMemberId;
    }

    return false;
  }

  /**
   * Regola di Visibilità della Vetrina:
   * Un'attività è pubblicamente visibile solo se:
   * 1. La scheda è in stato PUBBLICATA
   * 2. Il socio titolare è in stato ATTIVO
   * Qualsiasi altro stato del socio (IN_ATTESA, SOSPESO, RECEDUTO, ESCLUSO) comporta l'oscuramento immediato.
   */
  public static isActivityPubliclyVisible(
    activity: BusinessActivity,
    memberStatus: MembershipStatus
  ): boolean {
    return (
      activity.statoPubblicazione === PublicationStatus.PUBBLICATA &&
      memberStatus === MembershipStatus.ATTIVO
    );
  }
}
