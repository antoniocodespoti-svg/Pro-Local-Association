package com.example.core.model

/**
 * Informazioni generali di governance dell'associazione.
 * Dati strettamente dimostrativi per la Fase 1.
 */
data class AssociationInfo(
    val denominazione: String = "Associazione Pro-Local (Dimostrativa)",
    val naturaGiuridica: String = "Associazione non riconosciuta (art. 36 e ss. c.c.)",
    val statoRunts: String = "In valutazione per futura iscrizione (D.Lgs. 117/2017)",
    val sedeLegale: String = "Via Roma, 1 - 00100 Roma (Dimostrativa)",
    val codiceFiscaleDemo: String = "97000000000",
    val annoCostituzione: Int = 2024,
    val numeroAssociatiDemo: Int = 42,
    val consiglieriAttivi: Int = 7
)
