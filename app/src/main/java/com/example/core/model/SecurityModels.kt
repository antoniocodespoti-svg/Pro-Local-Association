package com.example.core.model

/**
 * Predisposizione per la futura gestione di ruoli e permessi (RBAC).
 * Solo definizioni dimostrative e strutturali per la Fase 1.
 */
enum class AppRole(val label: String, val descrizione: String) {
    PRESIDENTE("Presidente", "Rappresentanza legale, firma verbali, convocazione organi"),
    VICE_PRESIDENTE("Vicepresidente", "Sostituzione del Presidente in caso di assenza o impedimento"),
    SEGRETARIO("Segretario", "Redazione verbali, tenuta libro soci, comunicazioni"),
    TESORIERE("Tesoriere", "Tenuta cassa, contabilità, rendiconto finanziario"),
    CONSIGLIERE("Consigliere", "Partecipazione alle adunanze e voto nelle deliberazioni del Consiglio"),
    SOCIO_ORDINARIO("Socio Ordinario", "Partecipazione all'Assemblea, elettorato attivo e passivo"),
    AMMINISTRATORE("Amministratore Sistema", "Gestione tecnica, configurazione ruoli, audit log")
}

enum class PermissionType(val codice: String, val descrizione: String) {
    VISUALIZZA_DOCUMENTI_PUBBLICI("DOC_READ_PUBLIC", "Accesso a statuto e avvisi pubblici"),
    VISUALIZZA_VERBALI_RISERVATI("VERB_READ_CONFIDENTIAL", "Accesso ai verbali riservati del Consiglio"),
    GESTIONE_ANAGRAFICA_SOCI("MEMB_MANAGE", "Inserimento e modifica anagrafica associati"),
    CONVOCAZIONE_ASSEMBLEA("ASSM_CALL", "Emissione formale avvisi di convocazione Assemblea"),
    VOTO_ASSEMBLEA("VOTE_ASSEMBLY", "Espressione del voto in adunanza assembleare"),
    VOTO_CONSIGLIO("VOTE_COUNCIL", "Espressione del voto sulle deliberazioni del Consiglio"),
    GESTIONE_TESORERIA("FIN_MANAGE", "Registrazione entrate/uscite e quote sociali"),
    CONSULTA_AUDIT_LOG("AUDIT_VIEW", "Ispezione del registro delle operazioni di sistema")
}

data class AuditLogEntry(
    val id: String,
    val timestamp: String,
    val operatoreRuolo: String,
    val azione: String,
    val moduloCoinvolto: String,
    val dettagli: String,
    val livello: String // "INFO", "ATTIVITÀ", "SICUREZZA"
)
