package com.example.core.model

/**
 * Cariche interne del Consiglio Direttivo.
 * Le quattro cariche apicali sono elette direttamente dall'Assemblea dei soci.
 */
enum class InternalRole(val displayName: String, val isApicalRole: Boolean) {
    PRESIDENTE("Presidente", true),
    VICE_PRESIDENTE("Vicepresidente", true),
    SEGRETARIO("Segretario", true),
    TESORIERE("Tesoriere", true),
    CONSIGLIERE("Consigliere", false)
}

enum class MemberCouncilStatus(val label: String) {
    IN_CARICA("In Carica"),
    DIMESSO("Dimesso"),
    REVOCATO("Revocato"),
    SUBENTRATO("Subentrato")
}

data class CouncilMember(
    val id: String,
    val nomeCognome: String,
    val carica: InternalRole,
    val elettoDallAssemblea: Boolean = true,
    val dataElezione: String,
    val stato: MemberCouncilStatus = MemberCouncilStatus.IN_CARICA,
    val note: String = ""
)

/**
 * Candidato nella graduatoria assembleare dei non eletti, per l'eventuale subentro.
 */
data class NonElettoCandidate(
    val posizioneGraduatoria: Int,
    val nomeCognome: String,
    val votiRicevutiAssemblea: Int,
    val disponibileSubentro: Boolean,
    val statoSubentro: String // "In attesa interpello", "Disponibile", "Rinunciatario"
)

enum class DefinitionState {
    DEFINITO,
    DA_DEFINIRE
}

data class CouncilRuleItem(
    val id: String,
    val titolo: String,
    val stato: DefinitionState,
    val descrizione: String,
    val applicazioneSoftware: String,
    val notaLegale: String
)

data class CouncilResolutionDemo(
    val id: String,
    val numeroProtocollo: String,
    val data: String,
    val oggetto: String,
    val presenti: Int,
    val favorevoli: Int,
    val contrari: Int,
    val astenuti: Int,
    val votoPresidenteFavorevole: Boolean,
    val approvata: Boolean,
    val notaDeliberazione: String
)
