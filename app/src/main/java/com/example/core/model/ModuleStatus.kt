package com.example.core.model

enum class ModuleKey(val slug: String, val title: String) {
    DASHBOARD("dashboard", "Dashboard"),
    CONSIGLIO("consiglio", "Organi & Consiglio"),
    ASSOCIATI("associati", "Associati"),
    ASSEMBLEA("assemblea", "Assemblea & Voto"),
    DOCUMENTI("documenti", "Documenti & Verbali"),
    COMUNICAZIONI("comunicazioni", "Comunicazioni"),
    RUOLI("ruoli", "Ruoli & Permessi"),
    DOCUMENTAZIONE("documentazione", "Documentazione")
}

data class ProjectModule(
    val key: ModuleKey,
    val titolo: String,
    val sottotitolo: String,
    val iconName: String,
    val statoDefinizione: DefinitionState,
    val elementiDefiniti: List<String>,
    val elementiDaDefinire: List<String>,
    val descrizioneFunzionale: String
)
