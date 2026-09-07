package com.example.core.model

enum class DocCategory(val id: Int, val codice: String, val titolo: String) {
    DESCRIZIONE_GENERALE(1, "DOC-01", "Descrizione Generale del Progetto"),
    SPECIFICA_FUNZIONALE(2, "DOC-02", "Specifica Funzionale"),
    ARCHITETTURA_TECNICA(3, "DOC-03", "Architettura Tecnica"),
    INFRASTRUTTURA_RETE(4, "DOC-04", "Infrastruttura e Rete"),
    DECISIONI_PROGETTUALI(5, "DOC-05", "Decisioni Progettuali (ADR)"),
    REGOLE_ASSOCIAZIONE(6, "DOC-06", "Regole dell'Associazione"),
    REGISTRO_MODIFICHE(7, "DOC-07", "Registro delle Modifiche (Changelog)")
}

data class DocSection(
    val sottotitolo: String,
    val stato: DefinitionState,
    val testo: String
)

data class ProjectDocument(
    val categoria: DocCategory,
    val fileMarkdownName: String,
    val sintesi: String,
    val sezioni: List<DocSection>,
    val ultimoAggiornamento: String = "2026-09-07"
)
