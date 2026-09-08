package com.example.core.security

import com.example.core.model.BusinessActivity
import com.example.core.model.MembershipStatus
import com.example.core.model.PublicationStatus

/**
 * Ruoli di governance e operativi del sistema Pro-Local.
 * Distinzione concettuale fondamentale:
 * - Organi statutari e soci: partecipano alla vita associativa democratica secondo lo Statuto.
 * - Amministratore Tecnico: ruolo ausiliario di gestione e manutenzione informatica del software,
 *   SENZA poteri decisionali né statutari. Non può in alcun caso scavalcare o sostituire gli organi associativi.
 */
enum class ProLocalRole(val label: String, val isAssociativeOrganOrMember: Boolean) {
    SOCIO("Socio Ordinario", true),
    PRESIDENTE("Presidente", true),
    CONSIGLIO_DIRETTIVO("Consiglio Direttivo", true),
    ASSEMBLEA("Assemblea dei Soci", true),
    AMMINISTRATORE_TECNICO("Amministratore Tecnico Software", false)
}

/**
 * Operazioni di sistema tracciate e soggette a controllo accessi (RBAC).
 */
enum class SystemAction(val label: String, val isAssociative: Boolean) {
    // Operazioni tecniche consentite all'Amministratore Tecnico
    GESTIONE_CONFIGURAZIONE_TECNICA("Gestione configurazione tecnica", false),
    DIAGNOSTICA_SISTEMA("Diagnostica e monitoraggio sistema", false),
    MANUTENZIONE_INFRASTRUTTURA("Manutenzione tecnica infrastruttura", false),
    CONSULTAZIONE_LOG_TECNICI("Consultazione log tecnici", false),

    // Operazioni associative e di governance statutaria (VIETATE all'Amministratore Tecnico)
    AMMISSIONE_SOCIO("Ammissione formale socio", true),
    SOSPENSIONE_SOCIO("Sospensione dello status di socio", true),
    ESCLUSIONE_SOCIO("Esclusione del socio", true),
    MODIFICA_STATUS_ASSOCIATIVO("Modifica status associativo socio", true),
    ELEZIONE_CONSIGLIERE("Elezione di consiglieri", true),
    REVOCA_CONSIGLIERE("Revoca di consiglieri", true),
    MODIFICA_DECISIONI_ASSOCIATIVE("Modifica deliberazioni associative", true),
    MODIFICA_STATUTO_REGOLE("Modifica dello statuto o regole associative", true),
    ATTRIBUZIONE_COMPETENZA_ASSOCIATIVA("Attribuzione competenza associativa", true),
    FORZATURA_PUBBLICAZIONE_VETRINA("Forzatura pubblicazione vetrina ignorando regole", true),

    // Operazioni su attività dei soci
    MODIFICA_ATTIVITA("Modifica scheda attività", false),
    RICHIESTA_PUBBLICAZIONE_ATTIVITA("Richiesta pubblicazione attività", false)
}

/**
 * Policy centrale per la gestione del controllo accessi (RBAC) e della sicurezza del dominio.
 * Garantisce il principio di subordinazione del software e impedisce all'Amministratore Tecnico
 * di acquisire poteri deliberativi o associativi.
 */
object AccessControlPolicy {

    /**
     * Valuta se un ruolo può eseguire una determinata azione di sistema.
     * PRINCIPIO NON NEGOZIABILE:
     * L'Amministratore Tecnico ha permessi ESCLUSIVAMENTE tecnici.
     * È tassativamente NEGATO per tutte le operazioni associative, di status, elettorali,
     * regolamentari o di forzatura vetrina.
     */
    fun canPerformAction(role: ProLocalRole, action: SystemAction): Boolean {
        if (role == ProLocalRole.AMMINISTRATORE_TECNICO) {
            return when (action) {
                SystemAction.GESTIONE_CONFIGURAZIONE_TECNICA,
                SystemAction.DIAGNOSTICA_SISTEMA,
                SystemAction.MANUTENZIONE_INFRASTRUTTURA,
                SystemAction.CONSULTAZIONE_LOG_TECNICI -> true

                SystemAction.AMMISSIONE_SOCIO,
                SystemAction.SOSPENSIONE_SOCIO,
                SystemAction.ESCLUSIONE_SOCIO,
                SystemAction.MODIFICA_STATUS_ASSOCIATIVO,
                SystemAction.ELEZIONE_CONSIGLIERE,
                SystemAction.REVOCA_CONSIGLIERE,
                SystemAction.MODIFICA_DECISIONI_ASSOCIATIVE,
                SystemAction.MODIFICA_STATUTO_REGOLE,
                SystemAction.ATTRIBUZIONE_COMPETENZA_ASSOCIATIVA,
                SystemAction.FORZATURA_PUBBLICAZIONE_VETRINA,
                SystemAction.MODIFICA_ATTIVITA,
                SystemAction.RICHIESTA_PUBBLICAZIONE_ATTIVITA -> false
            }
        }

        // Per i ruoli associativi, le operazioni tecniche di basso livello sono riservate al supporto
        if (action == SystemAction.MANUTENZIONE_INFRASTRUTTURA || action == SystemAction.GESTIONE_CONFIGURAZIONE_TECNICA) {
            return false
        }

        // Le singole competenze positive degli organi associativi derivano dallo statuto
        return true
    }

    /**
     * Regola di Ownership dell'Attività:
     * SOCIO A può modificare solo la PROPRIA attività (activity.memberId == actorMemberId).
     * SOCIO A NON può modificare l'attività del SOCIO B.
     * AMMINISTRATORE_TECNICO NON può modificare l'attività di alcun socio.
     */
    fun canEditActivity(actorMemberId: String, actorRole: ProLocalRole, activity: BusinessActivity): Boolean {
        if (actorRole == ProLocalRole.AMMINISTRATORE_TECNICO) {
            return false
        }
        if (actorRole == ProLocalRole.SOCIO) {
            return activity.memberId == actorMemberId
        }
        return false
    }

    /**
     * Regola fondamentale di visibilità pubblica nella vetrina:
     * Un'attività è visibile SOLO ed ESCLUSIVAMENTE se:
     * 1) Lo stato di pubblicazione è PUBBLICATA
     * 2) Il socio titolare ha stato associativo ATTIVO
     * 
     * Qualsiasi altro stato (IN_ATTESA, SOSPESO, RECEDUTO, ESCLUSO) rende l'attività non visibile.
     */
    fun isActivityPubliclyVisible(activity: BusinessActivity, memberStatus: MembershipStatus): Boolean {
        return activity.statoPubblicazione == PublicationStatus.PUBBLICATA && memberStatus == MembershipStatus.ATTIVO
    }
}
