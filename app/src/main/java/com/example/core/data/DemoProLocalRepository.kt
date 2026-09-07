package com.example.core.data

import com.example.core.model.AssociationInfo
import com.example.core.model.AuditLogEntry
import com.example.core.model.CouncilMember
import com.example.core.model.CouncilResolutionDemo
import com.example.core.model.CouncilRuleItem
import com.example.core.model.DefinitionState
import com.example.core.model.DocCategory
import com.example.core.model.DocSection
import com.example.core.model.InternalRole
import com.example.core.model.MemberCouncilStatus
import com.example.core.model.ModuleKey
import com.example.core.model.NonElettoCandidate
import com.example.core.model.ProjectDocument
import com.example.core.model.ProjectModule
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

/**
 * Implementazione dimostrativa del repository.
 * Utilizza dati rigorosamente fittizi e non contiene dati personali reali.
 * Predisposta per una transizione trasparente a database locale (Room) o backend remoto.
 */
class DemoProLocalRepository : ProLocalRepository {

    private val dateFormat = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.ITALY)

    private val _associationInfo = MutableStateFlow(
        AssociationInfo(
            denominazione = "Pro-Local (Associazione Dimostrativa)",
            naturaGiuridica = "Associazione non riconosciuta (art. 36 e ss. c.c.)",
            statoRunts = "In valutazione / Predisposizione statutaria per eventuale iscrizione futura",
            sedeLegale = "Piazza del Municipio, 1 - 00100 Roma (Indirizzo Dimostrativo)",
            codiceFiscaleDemo = "97000000000",
            annoCostituzione = 2024,
            numeroAssociatiDemo = 48,
            consiglieriAttivi = 7
        )
    )
    override val associationInfo: StateFlow<AssociationInfo> = _associationInfo.asStateFlow()

    private val _councilMembers = MutableStateFlow(
        listOf(
            CouncilMember(
                id = "cm-01",
                nomeCognome = "Dott. Mario Rossi (Demo)",
                carica = InternalRole.PRESIDENTE,
                elettoDallAssemblea = true,
                dataElezione = "15/03/2024",
                stato = MemberCouncilStatus.IN_CARICA,
                note = "Eletto direttamente dall'Assemblea come Presidente"
            ),
            CouncilMember(
                id = "cm-02",
                nomeCognome = "Ing. Laura Bianchi (Demo)",
                carica = InternalRole.VICE_PRESIDENTE,
                elettoDallAssemblea = true,
                dataElezione = "15/03/2024",
                stato = MemberCouncilStatus.IN_CARICA,
                note = "Eletta direttamente dall'Assemblea come Vicepresidente"
            ),
            CouncilMember(
                id = "cm-03",
                nomeCognome = "Avv. Giuseppe Verdi (Demo)",
                carica = InternalRole.SEGRETARIO,
                elettoDallAssemblea = true,
                dataElezione = "15/03/2024",
                stato = MemberCouncilStatus.IN_CARICA,
                note = "Eletto direttamente dall'Assemblea come Segretario"
            ),
            CouncilMember(
                id = "cm-04",
                nomeCognome = "Rag. Francesca Neri (Demo)",
                carica = InternalRole.TESORIERE,
                elettoDallAssemblea = true,
                dataElezione = "15/03/2024",
                stato = MemberCouncilStatus.IN_CARICA,
                note = "Eletta direttamente dall'Assemblea come Tesoriere"
            ),
            CouncilMember(
                id = "cm-05",
                nomeCognome = "Marco Ferrari (Demo)",
                carica = InternalRole.CONSIGLIERE,
                elettoDallAssemblea = true,
                dataElezione = "15/03/2024",
                stato = MemberCouncilStatus.IN_CARICA,
                note = "Consigliere eletto dall'Assemblea"
            ),
            CouncilMember(
                id = "cm-06",
                nomeCognome = "Elena Esposito (Demo)",
                carica = InternalRole.CONSIGLIERE,
                elettoDallAssemblea = true,
                dataElezione = "15/03/2024",
                stato = MemberCouncilStatus.IN_CARICA,
                note = "Consigliere eletta dall'Assemblea"
            ),
            CouncilMember(
                id = "cm-07",
                nomeCognome = "Antonio Romano (Demo)",
                carica = InternalRole.CONSIGLIERE,
                elettoDallAssemblea = true,
                dataElezione = "15/03/2024",
                stato = MemberCouncilStatus.IN_CARICA,
                note = "Consigliere eletto dall'Assemblea"
            )
        )
    )
    override val councilMembers: StateFlow<List<CouncilMember>> = _councilMembers.asStateFlow()

    private val _eligibleCandidates = MutableStateFlow(
        listOf(
            NonElettoCandidate(
                posizioneGraduatoria = 1,
                nomeCognome = "Giorgio De Luca (Demo)",
                votiRicevutiAssemblea = 28,
                disponibileSubentro = true,
                statoSubentro = "1° dei non eletti - Interpello favorevole registrato"
            ),
            NonElettoCandidate(
                posizioneGraduatoria = 2,
                nomeCognome = "Chiara Fontana (Demo)",
                votiRicevutiAssemblea = 24,
                disponibileSubentro = true,
                statoSubentro = "2° dei non eletti - In riserva"
            ),
            NonElettoCandidate(
                posizioneGraduatoria = 3,
                nomeCognome = "Davide Greco (Demo)",
                votiRicevutiAssemblea = 19,
                disponibileSubentro = false,
                statoSubentro = "Rinuncia preventiva comunicata"
            )
        )
    )
    override val eligibleCandidates: StateFlow<List<NonElettoCandidate>> = _eligibleCandidates.asStateFlow()

    private val _councilRules = MutableStateFlow(
        listOf(
            CouncilRuleItem(
                id = "rule-01",
                titolo = "Elezione Diretta delle 4 Cariche Interne",
                stato = DefinitionState.DEFINITO,
                descrizione = "Le quattro cariche interne del Consiglio (Presidente, Vicepresidente, Segretario, Tesoriere) vengono elette direttamente dall'Assemblea.",
                applicazioneSoftware = "Il modulo elezioni prevede votazioni e schede separate o espressione per carica dall'Assemblea generale.",
                notaLegale = "Requisito di progetto: ammissibile nel diritto associativo purché contemplato dallo Statuto. Da non intendersi come consulenza legale."
            ),
            CouncilRuleItem(
                id = "rule-02",
                titolo = "Approvazione a Maggioranza dei Presenti",
                stato = DefinitionState.DEFINITO,
                descrizione = "Le deliberazioni del Consiglio vengono approvate a maggioranza dei consiglieri presenti alla seduta.",
                applicazioneSoftware = "Il calcolo dell'esito della votazione considera il totale dei consiglieri presenti, richiedendo la maggioranza semplice dei votanti.",
                notaLegale = "Regola standard conforme ai principi civilistici per le adunanze collegiali consiliari."
            ),
            CouncilRuleItem(
                id = "rule-03",
                titolo = "Prevalenza del Voto del Presidente in Parità",
                stato = DefinitionState.DEFINITO,
                descrizione = "In caso di parità di voti nel Consiglio Direttivo, prevale il voto espresso dal Presidente (casting vote).",
                applicazioneSoftware = "Il motore di calcolo delle deliberazioni assegna efficacia dirimente al voto del Presidente qualora favorevoli e contrari siano pari.",
                notaLegale = "Prassi statutaria legittima se esplicitata nell'atto costitutivo/statuto dell'ente."
            ),
            CouncilRuleItem(
                id = "rule-04",
                titolo = "Subentro del Primo dei Non Eletti",
                stato = DefinitionState.DEFINITO,
                descrizione = "In caso di cessazione di un consigliere è previsto il subentro del primo dei non eletti, previa espressa approvazione dell'interessato.",
                applicazioneSoftware = "Il sistema mantiene la graduatoria assembleare e gestisce lo stato di accettazione formale del subentrante prima del conferimento della carica.",
                notaLegale = "Garantisce continuità all'organo consiliare nel rispetto della volontà espressa dall'Assemblea."
            ),
            CouncilRuleItem(
                id = "rule-05",
                titolo = "Disciplina per la Revoca del Singolo Consigliere",
                stato = DefinitionState.DEFINITO,
                descrizione = "È prevista una disciplina formale per la revoca del singolo consigliere.",
                applicazioneSoftware = "Predisposta procedura di mozione di revoca con registrazione a verbale e notifica all'interessato.",
                notaLegale = "Dovrà essere armonizzata con i quorum e le motivazioni di giusta causa previsti dallo Statuto formale."
            ),
            CouncilRuleItem(
                id = "rule-06",
                titolo = "Quorum Costitutivo e Maggioranze Qualificate",
                stato = DefinitionState.DA_DEFINIRE,
                descrizione = "Definizione del numero minimo di consiglieri presenti per la regolare costituzione del Consiglio (es. metà + 1).",
                applicazioneSoftware = "Attualmente impostato su presenza di almeno 4 consiglieri, in attesa di approvazione statutaria definitiva.",
                notaLegale = "Aspetto aperto [DA DEFINIRE] dall'Assemblea dei soci fondatori."
            )
        )
    )
    override val councilRules: StateFlow<List<CouncilRuleItem>> = _councilRules.asStateFlow()

    private val _councilResolutions = MutableStateFlow(
        listOf(
            CouncilResolutionDemo(
                id = "res-001",
                numeroProtocollo = "DEL-2024-01",
                data = "12/04/2024",
                oggetto = "Approvazione calendario iniziative locali primo semestre",
                presenti = 7,
                favorevoli = 6,
                contrari = 1,
                astenuti = 0,
                votoPresidenteFavorevole = true,
                approvata = true,
                notaDeliberazione = "Approvata a maggioranza dei presenti (6 su 7)."
            ),
            CouncilResolutionDemo(
                id = "res-002",
                numeroProtocollo = "DEL-2024-02",
                data = "28/05/2024",
                oggetto = "Acquisto materiale informatico e archivio digitale Pro-Local",
                presenti = 6,
                favorevoli = 3,
                contrari = 3,
                astenuti = 0,
                votoPresidenteFavorevole = true,
                approvata = true,
                notaDeliberazione = "Parità (3 favorevoli, 3 contrari). Approvata per prevalenza del voto del Presidente."
            )
        )
    )
    override val councilResolutions: StateFlow<List<CouncilResolutionDemo>> = _councilResolutions.asStateFlow()

    private val _projectModules = MutableStateFlow(
        listOf(
            ProjectModule(
                key = ModuleKey.DASHBOARD,
                titolo = "Dashboard Istituzionale",
                sottotitolo = "Panoramica dello stato dell'associazione e governance",
                iconName = "dashboard",
                statoDefinizione = DefinitionState.DEFINITO,
                elementiDefiniti = listOf(
                    "Stato dell'associazione non riconosciuta",
                    "Riepilogo consiglieri in carica",
                    "Monitoraggio requisiti definiti vs da definire",
                    "Registro audit attività dimostrative"
                ),
                elementiDaDefinire = emptyList(),
                descrizioneFunzionale = "Pannello di controllo principale per visualizzare rapidamente la vita associativa e lo stato dei moduli."
            ),
            ProjectModule(
                key = ModuleKey.CONSIGLIO,
                titolo = "Consiglio Direttivo",
                sottotitolo = "Cariche interne, deliberazioni, subentri e revoca",
                iconName = "groups",
                statoDefinizione = DefinitionState.DEFINITO,
                elementiDefiniti = listOf(
                    "4 cariche interne elette dall'Assemblea (Presidente, Vicepresidente, Segretario, Tesoriere)",
                    "Deliberazioni a maggioranza dei presenti",
                    "Voto prevalente del Presidente in parità",
                    "Subentro primo dei non eletti previa approvazione",
                    "Disciplina per la revoca del consigliere"
                ),
                elementiDaDefinire = listOf(
                    "Quorum costitutivo formale",
                    "Termine per l'accettazione del subentro"
                ),
                descrizioneFunzionale = "Gestione delle adunanze consiliari, delle cariche e dell'applicazione automatizzata delle regole di voto stabilite."
            ),
            ProjectModule(
                key = ModuleKey.ASSOCIATI,
                titolo = "Associati e Libro Soci",
                sottotitolo = "Anagrafica, quote e stati associativi",
                iconName = "people",
                statoDefinizione = DefinitionState.DA_DEFINIRE,
                elementiDefiniti = listOf(
                    "Predisposizione modello privacy-safe per soci",
                    "Stati socio: Richiedente, Attivo, Sospeso, Receduto"
                ),
                elementiDaDefinire = listOf(
                    "Criteri di ammissione nuovi soci",
                    "Organo deliberante per l'ammissione",
                    "Disciplina quote annuali e mora",
                    "Categorie di soci (ordinari, onorari, ecc.)"
                ),
                descrizioneFunzionale = "Predisposto per la tenuta sicura del libro soci conforme al GDPR e alle linee guida RUNTS."
            ),
            ProjectModule(
                key = ModuleKey.ASSEMBLEA,
                titolo = "Assemblea & Elezioni",
                sottotitolo = "Convocazioni, candidature e votazioni",
                iconName = "how_to_vote",
                statoDefinizione = DefinitionState.DA_DEFINIRE,
                elementiDefiniti = listOf(
                    "Elezione diretta delle 4 cariche del Consiglio dall'Assemblea [DEFINITO]"
                ),
                elementiDaDefinire = listOf(
                    "Modalità di convocazione e preavviso",
                    "Quorum assembleari di prima e seconda convocazione",
                    "Regole di presentazione candidature e liste",
                    "Disciplina del numero massimo di deleghe per socio"
                ),
                descrizioneFunzionale = "Modulo di futura implementazione per la gestione democratica delle assemblee ordinarie e straordinarie."
            ),
            ProjectModule(
                key = ModuleKey.DOCUMENTI,
                titolo = "Documenti & Verbali",
                sottotitolo = "Archivio digitale, verbali di Consiglio e Assemblea",
                iconName = "description",
                statoDefinizione = DefinitionState.DA_DEFINIRE,
                elementiDefiniti = listOf(
                    "Struttura protocollo deliberazioni e verbali"
                ),
                elementiDaDefinire = listOf(
                    "Modalità di firma (autografa/digitale/approvazione telematica)",
                    "Politica di conservazione e accesso ai soci",
                    "Categorie di riservatezza dei documenti"
                ),
                descrizioneFunzionale = "Archivio documentale protetto per statuto, bilanci, verbali e comunicazioni formali."
            ),
            ProjectModule(
                key = ModuleKey.COMUNICAZIONI,
                titolo = "Comunicazioni Istituzionali",
                sottotitolo = "Circolari, avvisi di convocazione e newsletter",
                iconName = "mail",
                statoDefinizione = DefinitionState.DA_DEFINIRE,
                elementiDefiniti = listOf(
                    "Tracciamento notifiche nel log di audit"
                ),
                elementiDaDefinire = listOf(
                    "Canali ufficiali di notifica (PEC, email, albo)",
                    "Valore legale delle comunicazioni interne"
                ),
                descrizioneFunzionale = "Canale di comunicazione sicuro e centralizzato tra l'associazione e gli iscritti."
            ),
            ProjectModule(
                key = ModuleKey.RUOLI,
                titolo = "Ruoli e Permessi",
                sottotitolo = "Controllo accessi RBAC e sicurezza",
                iconName = "admin_panel_settings",
                statoDefinizione = DefinitionState.DA_DEFINIRE,
                elementiDefiniti = listOf(
                    "Definizione dei ruoli statutari fondamentali",
                    "Predisposizione matrice di permessi granulari"
                ),
                elementiDaDefinire = listOf(
                    "Permessi specifici di accesso a documenti contabili",
                    "Criteri per la nomina di amministratori tecnici"
                ),
                descrizioneFunzionale = "Sistema di autorizzazione per garantire che solo gli utenti autorizzati possano accedere a dati riservati."
            ),
            ProjectModule(
                key = ModuleKey.DOCUMENTAZIONE,
                titolo = "Documentazione di Progetto",
                sottotitolo = "Specifiche, architettura, ADR e regole",
                iconName = "menu_book",
                statoDefinizione = DefinitionState.DEFINITO,
                elementiDefiniti = listOf(
                    "7 categorie complete di documentazione tecnica e funzionale",
                    "Trasparenza su requisiti definiti vs da definire",
                    "Predisposizione per repository GitHub"
                ),
                elementiDaDefinire = emptyList(),
                descrizioneFunzionale = "Visualizzatore integrato delle 7 sezioni di documentazione ufficiale del progetto Pro-Local."
            )
        )
    )
    override val projectModules: StateFlow<List<ProjectModule>> = _projectModules.asStateFlow()

    private val _projectDocuments = MutableStateFlow(
        listOf(
            ProjectDocument(
                categoria = DocCategory.DESCRIZIONE_GENERALE,
                fileMarkdownName = "docs/01_descrizione_generale.md",
                sintesi = "Visione, finalità, natura giuridica e principi guida del software Pro-Local.",
                sezioni = listOf(
                    DocSection(
                        "1.1 Visione e Obiettivo",
                        DefinitionState.DEFINITO,
                        "Pro-Local è una piattaforma digitale modulare per la gestione amministrativa, assembleare e documentale di un'associazione. Sviluppata per durare nel tempo, non come demo usa-e-getta."
                    ),
                    DocSection(
                        "1.2 Natura Giuridica dell'Ente",
                        DefinitionState.DEFINITO,
                        "Attualmente Associazione non riconosciuta (art. 36 e ss. c.c.). Predisposta per eventuale futura iscrizione al RUNTS (D.Lgs. 117/2017). Avviso: requisiti software, non consulenza legale."
                    ),
                    DocSection(
                        "1.3 Principi Guida",
                        DefinitionState.DEFINITO,
                        "Modularità rigorosa, nessun requisito inventato, distinzione visibile [DEFINITO] vs [DA DEFINIRE], privacy by design e predisposizione GitHub."
                    )
                )
            ),
            ProjectDocument(
                categoria = DocCategory.SPECIFICA_FUNZIONALE,
                fileMarkdownName = "docs/02_specifica_funzionale.md",
                sintesi = "Dettaglio dei requisiti consolidati e delle aree aperte per ciascun modulo applicativo.",
                sezioni = listOf(
                    DocSection(
                        "2.1 Organi e Consiglio Direttivo",
                        DefinitionState.DEFINITO,
                        "Definite le 4 cariche interne elette dall'Assemblea, approvazione a maggioranza dei presenti, voto prevalente del Presidente in parità, subentro primo non eletti previa approvazione, disciplina revoca."
                    ),
                    DocSection(
                        "2.2 Moduli da Definire Statutariamente",
                        DefinitionState.DA_DEFINIRE,
                        "Associati e tesseramento [DA DEFINIRE], Convocazione Assemblea [DA DEFINIRE], Sistema di voto elettronico [DA DEFINIRE], Archiviazione verbali [DA DEFINIRE]."
                    )
                )
            ),
            ProjectDocument(
                categoria = DocCategory.ARCHITETTURA_TECNICA,
                fileMarkdownName = "docs/03_architettura_tecnica.md",
                sintesi = "Separazione delle responsabilità, Clean Architecture e modello disaccoppiato.",
                sezioni = listOf(
                    DocSection(
                        "3.1 Pattern Architetturale",
                        DefinitionState.DEFINITO,
                        "Separazione Presentation (Compose) -> Domain (Kotlin puro) -> Data (Repository). Predisposto per database locale o remoto."
                    ),
                    DocSection(
                        "3.2 Sicurezza e Privacy",
                        DefinitionState.DEFINITO,
                        "Solo dati dimostrativi in Fase 1. Modello immutabile di Audit Log e matrice RBAC predisposta per il futuro."
                    )
                )
            ),
            ProjectDocument(
                categoria = DocCategory.INFRASTRUTTURA_RETE,
                fileMarkdownName = "docs/04_infrastruttura_rete.md",
                sintesi = "Ambiente attuale locale e requisiti per la futura pubblicazione online.",
                sezioni = listOf(
                    DocSection(
                        "4.1 Ambiente Fase 1",
                        DefinitionState.DEFINITO,
                        "Esecuzione client-side locale senza dipendenze di rete bloccanti. Persistenza in-memory dimostrativa."
                    ),
                    DocSection(
                        "4.2 Infrastruttura Online Futura",
                        DefinitionState.DA_DEFINIRE,
                        "Protocollo HTTPS/TLS 1.3 obbligatorio, API REST/gRPC [DA DEFINIRE], Database relazionale cifrato [DA DEFINIRE], Hosting cloud conforme GDPR [DA DEFINIRE]."
                    )
                )
            ),
            ProjectDocument(
                categoria = DocCategory.DECISIONI_PROGETTUALI,
                fileMarkdownName = "docs/05_decisioni_progettuali.md",
                sintesi = "Architecture Decision Records (ADR) per tracciare le scelte fondative.",
                sezioni = listOf(
                    DocSection(
                        "ADR-001: Requisiti Minimi Certi",
                        DefinitionState.DEFINITO,
                        "Non inventare funzionalità. Etichettatura trasparente [DEFINITO] vs [DA DEFINIRE]."
                    ),
                    DocSection(
                        "ADR-002: Separazione Rigorosa dei Livelli",
                        DefinitionState.DEFINITO,
                        "Interfaccia ProLocalRepository per consentire future integrazioni con Room o API esterne senza modificare la UI."
                    ),
                    DocSection(
                        "ADR-003: UI Responsive Multi-Device",
                        DefinitionState.DEFINITO,
                        "Layout adattivo per smartphone, tablet e desktop computer."
                    ),
                    DocSection(
                        "ADR-004: Versionamento GitHub",
                        DefinitionState.DEFINITO,
                        "Repository strutturato con documentazione markdown integrata e README."
                    )
                )
            ),
            ProjectDocument(
                categoria = DocCategory.REGOLE_ASSOCIAZIONE,
                fileMarkdownName = "docs/06_regole_associazione.md",
                sintesi = "Disciplina dettagliata del Consiglio Direttivo e aspetti statutari aperti.",
                sezioni = listOf(
                    DocSection(
                        "6.1 Regole Consolidate per il Consiglio",
                        DefinitionState.DEFINITO,
                        "1. Elezione diretta 4 cariche; 2. Maggioranza presenti; 3. Voto prevalente Presidente in parità; 4. Subentro primo non eletti con consenso; 5. Disciplina revoca singolo consigliere."
                    ),
                    DocSection(
                        "6.2 Aspetti Statutari da Definire",
                        DefinitionState.DA_DEFINIRE,
                        "Numero consiglieri totale [DA DEFINIRE], durata del mandato [DA DEFINIRE], quorum costitutivo formale [DA DEFINIRE]."
                    )
                )
            ),
            ProjectDocument(
                categoria = DocCategory.REGISTRO_MODIFICHE,
                fileMarkdownName = "docs/07_registro_modifiche.md",
                sintesi = "Changelog cronologico delle versioni di Pro-Local.",
                sezioni = listOf(
                    DocSection(
                        "Versione 0.1.0-alpha (Fase 1)",
                        DefinitionState.DEFINITO,
                        "Fondazione del progetto: configurazione architettura, 7 sezioni documentali, dashboard, modulo Consiglio con regole attive, layout responsive."
                    )
                )
            )
        )
    )
    override val projectDocuments: StateFlow<List<ProjectDocument>> = _projectDocuments.asStateFlow()

    private val _auditLogs = MutableStateFlow(
        listOf(
            AuditLogEntry(
                id = "log-001",
                timestamp = "07/09/2026 09:00",
                operatoreRuolo = "Sistema Pro-Local",
                azione = "Inizializzazione Piattaforma",
                moduloCoinvolto = "Core / Governance",
                dettagli = "Creata struttura modulare Fase 1 con regole del Consiglio consolidate",
                livello = "INFO"
            ),
            AuditLogEntry(
                id = "log-002",
                timestamp = "07/09/2026 09:30",
                operatoreRuolo = "Presidente (Demo)",
                azione = "Consultazione Regolamento",
                moduloCoinvolto = "Consiglio Direttivo",
                dettagli = "Verifica delle regole di voto (maggioranza presenti e voto prevalente)",
                livello = "INFO"
            ),
            AuditLogEntry(
                id = "log-003",
                timestamp = "07/09/2026 10:15",
                operatoreRuolo = "Segretario (Demo)",
                azione = "Simulazione Subentro",
                moduloCoinvolto = "Organi & Candidature",
                dettagli = "Verificato interpello primo dei non eletti (Giorgio De Luca)",
                livello = "ATTIVITÀ"
            )
        )
    )
    override val auditLogs: StateFlow<List<AuditLogEntry>> = _auditLogs.asStateFlow()

    override fun evaluateResolution(
        oggetto: String,
        presenti: Int,
        favorevoli: Int,
        contrari: Int,
        votoPresidenteFavorevole: Boolean
    ): CouncilResolutionDemo {
        val astenuti = (presenti - (favorevoli + contrari)).coerceAtLeast(0)
        val approvata: Boolean
        val nota: String

        if (favorevoli > contrari) {
            approvata = true
            nota = "Approvata a maggioranza dei presenti ($favorevoli favorevoli su $presenti presenti)."
        } else if (favorevoli < contrari) {
            approvata = false
            nota = "Respinta a maggioranza dei presenti ($contrari contrari su $presenti presenti)."
        } else {
            // Parità
            if (votoPresidenteFavorevole) {
                approvata = true
                nota = "Parità di voti ($favorevoli vs $contrari). Deliberazione approvata per voto prevalente del Presidente (favorevole)."
            } else {
                approvata = false
                nota = "Parità di voti ($favorevoli vs $contrari). Deliberazione respinta per voto prevalente del Presidente (contrario/non favorevole)."
            }
        }

        val count = _councilResolutions.value.size + 1
        val res = CouncilResolutionDemo(
            id = UUID.randomUUID().toString(),
            numeroProtocollo = "DEL-2024-${String.format(Locale.US, "%02d", count)}",
            data = SimpleDateFormat("dd/MM/yyyy", Locale.ITALY).format(Date()),
            oggetto = oggetto.ifBlank { "Deliberazione ordinaria n. $count" },
            presenti = presenti,
            favorevoli = favorevoli,
            contrari = contrari,
            astenuti = astenuti,
            votoPresidenteFavorevole = votoPresidenteFavorevole,
            approvata = approvata,
            notaDeliberazione = nota
        )

        _councilResolutions.value = listOf(res) + _councilResolutions.value
        addAuditEntry(
            operatore = "Consiglio Direttivo (Demo)",
            azione = "Nuova Deliberazione: ${res.numeroProtocollo}",
            modulo = "Consiglio",
            dettagli = "Esito: ${if (approvata) "APPROVATA" else "RESPINTA"}. $nota",
            livello = "ATTIVITÀ"
        )
        return res
    }

    override fun addAuditEntry(
        operatore: String,
        azione: String,
        modulo: String,
        dettagli: String,
        livello: String
    ) {
        val entry = AuditLogEntry(
            id = UUID.randomUUID().toString(),
            timestamp = dateFormat.format(Date()),
            operatoreRuolo = operatore,
            azione = azione,
            moduloCoinvolto = modulo,
            dettagli = dettagli,
            livello = livello
        )
        _auditLogs.value = listOf(entry) + _auditLogs.value
    }
}
