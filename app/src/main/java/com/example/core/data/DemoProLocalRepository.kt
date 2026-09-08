package com.example.core.data

import com.example.core.model.ActivityCategory
import com.example.core.model.AssociationInfo
import com.example.core.model.AuditLogEntry
import com.example.core.model.BusinessActivity
import com.example.core.model.CouncilMember
import com.example.core.model.CouncilResolutionDemo
import com.example.core.model.CouncilRuleItem
import com.example.core.model.DefinitionState
import com.example.core.model.DocCategory
import com.example.core.model.DocSection
import com.example.core.model.InternalRole
import com.example.core.model.Member
import com.example.core.model.MemberCouncilStatus
import com.example.core.model.MembershipStatus
import com.example.core.model.ModuleKey
import com.example.core.model.NonElettoCandidate
import com.example.core.model.ProjectDocument
import com.example.core.model.ProjectModule
import com.example.core.model.PublicationStatus
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
                key = ModuleKey.VETRINA,
                titolo = "Vetrina Attività Soci",
                sottotitolo = "Portale pubblico di ricerca e consultazione attività della rete Pro-Local",
                iconName = "storefront",
                statoDefinizione = DefinitionState.DEFINITO,
                elementiDefiniti = listOf(
                    "Ricerca per servizio, categoria e località",
                    "Regola fondamentale: pubblicazione riservata esclusivamente ai soci attivi",
                    "Scheda pubblica dettagliata con contatti e servizi",
                    "Principio di separazione: consultazione neutrale senza attestazioni o certificazioni commerciali"
                ),
                elementiDaDefinire = listOf(
                    "Geolocalizzazione interattiva su mappa [DA DEFINIRE]",
                    "Attività multiple per singolo socio (1 -> N esteso) [DA DEFINIRE]"
                ),
                descrizioneFunzionale = "Portale pubblico per la consultazione delle attività e dei servizi offerti dai soci secondo le regole associative, nella reciproca autonomia professionale."
            ),
            ProjectModule(
                key = ModuleKey.AREA_SOCIO,
                titolo = "Area Riservata Socio",
                sottotitolo = "Gestione profilo socio, stato associativo e scheda attività",
                iconName = "badge",
                statoDefinizione = DefinitionState.DEFINITO,
                elementiDefiniti = listOf(
                    "Visualizzazione anagrafica e stato associativo dimostrativo",
                    "Compilazione e modifica scheda attività",
                    "Richiesta formale di pubblicazione nella vetrina",
                    "Blocco automatico se lo stato socio non è attivo"
                ),
                elementiDaDefinire = listOf(
                    "Rinnovo telematico quota sociale [DA DEFINIRE]",
                    "Upload autonomo file multimediali e loghi [DA DEFINIRE]"
                ),
                descrizioneFunzionale = "Sezione self-service per gli associati: controllo della propria posizione e manutenzione della propria presenza pubblica."
            ),
            ProjectModule(
                key = ModuleKey.AMMINISTRAZIONE,
                titolo = "Amministrazione & Controllo",
                sottotitolo = "Validazione pubblicazioni, registro soci e vigilanza conformità",
                iconName = "admin_panel_settings",
                statoDefinizione = DefinitionState.DEFINITO,
                elementiDefiniti = listOf(
                    "Elenco soci e monitoraggio stato associativo",
                    "Approvazione, sospensione o disattivazione pubblicazione attività",
                    "Tracciamento completo nel registro di audit",
                    "Applicazione in tempo reale della revoca visibilità pubblica per soci sospesi"
                ),
                elementiDaDefinire = listOf(
                    "Workflow multi-livello con parere del Consiglio [DA DEFINIRE]",
                    "Notifiche automatiche via email/PEC ai soci [DA DEFINIRE]"
                ),
                descrizioneFunzionale = "Pannello per gli organi associativi preposti al controllo e all'ammissione delle schede nella vetrina pubblica."
            ),
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
                        "Modularità rigorosa, nessun requisito inventato, distinzione visibile [DEFINITO] vs [DA DEFINIRE], democraticità associativa, separazione assoluta tra associazione e attività professionali dei soci (nessun badge o garanzia commerciale)."
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
                        "2.2 Vetrina Pubblica e Separazione Attività",
                        DefinitionState.DEFINITO,
                        "Vetrina neutrale: pubblicazione riservata ai soci attivi, ma divieto assoluto di badge, sigilli, bollini o attestazioni di garanzia commerciale. Piena autonomia professionale del socio."
                    ),
                    DocSection(
                        "2.3 Moduli da Definire Statutariamente",
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
                        "Solo dati dimostrativi in Fase 1. Modello immutabile di Audit Log e matrice RBAC con distinzione netta tra organi associativi e ruoli tecnici."
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
                    ),
                    DocSection(
                        "ADR-008: Democraticità Associativa",
                        DefinitionState.DEFINITO,
                        "Il software è subordinato alle regole associative e agli organi democratici (Assemblea sovrana e Consiglio Direttivo collegiale)."
                    ),
                    DocSection(
                        "ADR-009: Separazione tra Associazione e Attività",
                        DefinitionState.DEFINITO,
                        "Separazione assoluta: l'associazione non garantisce né certifica le attività dei soci. Divieto di badge o sigilli nella vetrina."
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
                        "6.2 Principio di Democraticità e Separazione Attività",
                        DefinitionState.DEFINITO,
                        "L'associazione gestisce la vita associativa; la piattaforma gestisce la pubblicazione; l'attività professionale rimane autonoma; l'associazione non garantisce prestazioni né rilascia badge o sigilli."
                    ),
                    DocSection(
                        "6.3 Aspetti Statutari da Definire",
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
                    ),
                    DocSection(
                        "Versione 0.2.2-beta (Consolidamento Fase 2)",
                        DefinitionState.DEFINITO,
                        "Separazione assoluta tra associazione e attività professionali, neutralità della vetrina pubblica senza badge o sigilli di garanzia, rispetto rigoroso della democraticità associativa."
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

    // ==========================================
    // DIMENSIONE VETRINA DELLE ATTIVITÀ DEI SOCI
    // ==========================================

    private val _members = MutableStateFlow<List<Member>>(
        listOf(
            Member(
                id = "mem-01",
                codiceSocio = "SOC-2024-001",
                nomeCognome = "Marco Rossi (Demo)",
                emailDemo = "m.rossi.socio@demo-prolocal.it",
                dataIscrizione = "10/01/2024",
                statoAssociativo = MembershipStatus.ATTIVO,
                quotaSocialeInRegola = true,
                noteAmministrativeInterne = "Socio fondatore, quota 2024 regolarizzata"
            ),
            Member(
                id = "mem-02",
                codiceSocio = "SOC-2024-002",
                nomeCognome = "Elena Esposito (Demo)",
                emailDemo = "e.esposito.socio@demo-prolocal.it",
                dataIscrizione = "15/01/2024",
                statoAssociativo = MembershipStatus.ATTIVO,
                quotaSocialeInRegola = true,
                noteAmministrativeInterne = "Consulente iscritta all'albo, quota versata"
            ),
            Member(
                id = "mem-03",
                codiceSocio = "SOC-2024-003",
                nomeCognome = "Antonio Romano (Demo)",
                emailDemo = "a.romano.socio@demo-prolocal.it",
                dataIscrizione = "02/02/2024",
                statoAssociativo = MembershipStatus.ATTIVO,
                quotaSocialeInRegola = true,
                noteAmministrativeInterne = "Azienda agricola e agriturismo locale"
            ),
            Member(
                id = "mem-04",
                codiceSocio = "SOC-2024-004",
                nomeCognome = "Chiara Fontana (Demo)",
                emailDemo = "c.fontana.socio@demo-prolocal.it",
                dataIscrizione = "20/02/2024",
                statoAssociativo = MembershipStatus.ATTIVO,
                quotaSocialeInRegola = true,
                noteAmministrativeInterne = "Sviluppatrice web, quota sociale attiva"
            ),
            Member(
                id = "mem-05",
                codiceSocio = "SOC-2024-005",
                nomeCognome = "Davide Greco (Demo)",
                emailDemo = "d.greco.socio@demo-prolocal.it",
                dataIscrizione = "05/03/2024",
                statoAssociativo = MembershipStatus.ATTIVO,
                quotaSocialeInRegola = true,
                noteAmministrativeInterne = "Operatore olistico e posturale"
            ),
            Member(
                id = "mem-06",
                codiceSocio = "SOC-2024-006",
                nomeCognome = "Francesca Neri (Demo)",
                emailDemo = "f.neri.socio@demo-prolocal.it",
                dataIscrizione = "18/03/2024",
                statoAssociativo = MembershipStatus.SOSPESO,
                quotaSocialeInRegola = false,
                noteAmministrativeInterne = "In sospensione per rinnovo quota associativa annuale"
            ),
            Member(
                id = "mem-07",
                codiceSocio = "SOC-2024-007",
                nomeCognome = "Giuseppe Verdi (Demo)",
                emailDemo = "g.verdi.socio@demo-prolocal.it",
                dataIscrizione = "12/04/2024",
                statoAssociativo = MembershipStatus.ATTIVO,
                quotaSocialeInRegola = true,
                noteAmministrativeInterne = "Manutenzioni civili e verde"
            )
        )
    )
    override val members: StateFlow<List<Member>> = _members.asStateFlow()

    private val _activities = MutableStateFlow<List<BusinessActivity>>(
        listOf(
            BusinessActivity(
                id = "act-01",
                memberId = "mem-01",
                nomeAttivita = "Bottega d'Arte & Restauro Lignea",
                categoria = ActivityCategory.ARTIGIANATO_RESTAURO,
                descrizioneBreve = "Restauro specialistico di arredi d'epoca, doratura a foglia e intaglio artigianale tradizionale.",
                descrizioneCompleta = "La Bottega d'Arte nasce dalla passione per la conservazione del patrimonio ligneo storico. Eseguiamo interventi di restauro conservativo, lucidatura a tampone con gommalacca, trattamenti antitarlo eco-compatibili e ricostruzione artistica parti mancanti.",
                serviziOfferti = listOf(
                    "Restauro conservativo mobili antichi",
                    "Lucidatura a tampone gommalacca",
                    "Doratura a foglia d'oro",
                    "Trattamenti antitarlo atossici",
                    "Falegnameria artigianale su misura"
                ),
                localita = "Roma - Rione Monti",
                indirizzoPubblico = "Via dei Serpenti, 48 - Roma",
                telefonoPubblico = "+39 06 4829100",
                emailPubblica = "bottega.lignea@prolocal-demo.it",
                sitoWeb = "https://bottegalignea.demo-prolocal.it",
                socialInstagram = "@bottega_lignea_roma",
                socialLinkedin = "linkedin.com/company/bottega-lignea-demo",
                orariApertura = "Lun - Ven: 09:00 - 13:00 / 15:30 - 19:00",
                statoPubblicazione = PublicationStatus.PUBBLICATA,
                dataUltimoAggiornamento = "01/09/2026",
                noteRevisioneAdmin = "Scheda conforme ai criteri di pubblicazione della piattaforma"
            ),
            BusinessActivity(
                id = "act-02",
                memberId = "mem-02",
                nomeAttivita = "Studio Fiscale & Terzo Settore",
                categoria = ActivityCategory.CONSULENZA_PROFESSIONALE,
                descrizioneBreve = "Consulenza contabile, tributaria e statutaria specializzata per ETS, ODV, APS e professionisti.",
                descrizioneCompleta = "Supportiamo associazioni, enti del terzo settore e liberi professionisti nell'adempimento delle normative fiscali e amministrative. Assistenza per pratiche RUNTS, bilanci d'esercizio, rendicontazione cinque per mille e consulenza contabile.",
                serviziOfferti = listOf(
                    "Iscrizione e gestione adempimenti RUNTS",
                    "Bilanci di esercizio per ETS e associazioni",
                    "Consulenza contabile e fiscale ordinaria",
                    "Rendicontazione contributi pubblici e 5x1000",
                    "Redazione e adeguamento statuti sociali"
                ),
                localita = "Roma - Quartiere San Giovanni",
                indirizzoPubblico = "Via Appia Nuova, 120 - Roma",
                telefonoPubblico = "+39 06 7045120",
                emailPubblica = "studio.terzosettore@prolocal-demo.it",
                sitoWeb = "https://studioterzosettore.demo-prolocal.it",
                socialInstagram = "@studio_ets_roma",
                socialLinkedin = "linkedin.com/in/elena-esposito-ets-demo",
                orariApertura = "Lun - Gio: 09:00 - 18:00 | Ven: 09:00 - 14:00",
                statoPubblicazione = PublicationStatus.PUBBLICATA,
                dataUltimoAggiornamento = "03/09/2026",
                noteRevisioneAdmin = "Scheda conforme ai criteri di pubblicazione della piattaforma"
            ),
            BusinessActivity(
                id = "act-03",
                memberId = "mem-03",
                nomeAttivita = "Sapori del Borgo - Frascati Tipica",
                categoria = ActivityCategory.ENOGASTRONOMIA_LOCALE,
                descrizioneBreve = "Azienda agricola biologica, degustazioni guidate, oli extravergini e vini DOC dei Castelli.",
                descrizioneCompleta = "Coltiviamo la terra con metodi biologici certificati per valorizzare le cultivar tradizionali dei Castelli Romani. Proponiamo degustazioni guidate in vigneto, vendita diretta di olio extravergine spremuto a freddo e conserve tipiche.",
                serviziOfferti = listOf(
                    "Vendita diretta olio EVO bio e vini tipici",
                    "Degustazioni guidate per gruppi e soci",
                    "Laboratori di raccolta olive e vendemmia",
                    "Confezioni regalo e cesti enogastronomici",
                    "Forniture a km zero per eventi"
                ),
                localita = "Castelli Romani - Frascati",
                indirizzoPubblico = "Via dei Vigneti, 14 - Frascati (RM)",
                telefonoPubblico = "+39 06 9421880",
                emailPubblica = "saporidelborgo@prolocal-demo.it",
                sitoWeb = "https://saporidelborgo.demo-prolocal.it",
                socialInstagram = "@saporidelborgo_frascati",
                socialLinkedin = "",
                orariApertura = "Mar - Dom: 10:00 - 19:30",
                statoPubblicazione = PublicationStatus.PUBBLICATA,
                dataUltimoAggiornamento = "28/08/2026",
                noteRevisioneAdmin = "Scheda conforme ai criteri di pubblicazione della piattaforma"
            ),
            BusinessActivity(
                id = "act-04",
                memberId = "mem-04",
                nomeAttivita = "Officina Digitale & Soluzioni Web",
                categoria = ActivityCategory.INFORMATICA_DIGITALE,
                descrizioneBreve = "Progettazione siti web accessibili, identità visiva, SEO etico e supporto IT per enti e PMI.",
                descrizioneCompleta = "Ci occupiamo di sviluppo web moderno (React, Compose, Kotlin), accessibilità WCAG, identità visiva coordinata e supporto tecnologico etico per piccole realtà e associazioni territoriali.",
                serviziOfferti = listOf(
                    "Sviluppo siti web e portali vetrina responsive",
                    "Ottimizzazione accessibilità e conformità GDPR",
                    "Brand identity, grafica per stampa e social",
                    "Supporto tecnico hardware e sicurezza reti",
                    "Formazione digitale per volontari e operatori"
                ),
                localita = "Roma - EUR / Laurentina",
                indirizzoPubblico = "Viale Europa, 85 - Roma",
                telefonoPubblico = "+39 06 5912300",
                emailPubblica = "officinadigitale@prolocal-demo.it",
                sitoWeb = "https://officinadigitale.demo-prolocal.it",
                socialInstagram = "@officina_digitale_web",
                socialLinkedin = "linkedin.com/company/officina-digitale-demo",
                orariApertura = "Lun - Ven: 09:30 - 18:30",
                statoPubblicazione = PublicationStatus.PUBBLICATA,
                dataUltimoAggiornamento = "02/09/2026",
                noteRevisioneAdmin = "Scheda conforme ai criteri di pubblicazione della piattaforma"
            ),
            BusinessActivity(
                id = "act-05",
                memberId = "mem-05",
                nomeAttivita = "Spazio Olistico Armonia & Respiro",
                categoria = ActivityCategory.BENESSERE_PERSONA,
                descrizioneBreve = "Percorsi di rieducazione posturale dolce, mindfulness, massaggio decontratturante e benessere naturale.",
                descrizioneCompleta = "Uno spazio rigenerante nel cuore di Monteverde dedicato al riequilibrio psicofisico. Proponiamo sessioni individuali di ginnastica posturale, rilassamento guidato e trattamenti personalizzati.",
                serviziOfferti = listOf(
                    "Ginnastica posturale dolce individuale",
                    "Trattamenti benessere e decontratturanti",
                    "Sessioni guidate di meditazione e rilassamento",
                    "Consulenza naturopatica e stile di vita sano",
                    "Workshop di igiene posturale per il lavoro"
                ),
                localita = "Roma - Monteverde",
                indirizzoPubblico = "Via Carini, 32 - Roma",
                telefonoPubblico = "+39 06 5894120",
                emailPubblica = "armonia.respiro@prolocal-demo.it",
                sitoWeb = "https://armoniaerespiro.demo-prolocal.it",
                socialInstagram = "@armonia_respiro_monteverde",
                socialLinkedin = "",
                orariApertura = "Lun - Sab: 09:00 - 20:00 (Solo su appuntamento)",
                statoPubblicazione = PublicationStatus.IN_ATTESA_APPROVAZIONE,
                dataUltimoAggiornamento = "06/09/2026",
                noteRevisioneAdmin = "In attesa di verifica conformità dati da parte dell'amministrazione"
            ),
            BusinessActivity(
                id = "act-06",
                memberId = "mem-06", // Francesca Neri - SOSPESA
                nomeAttivita = "Bottega Creativa Ceramiche Trastevere",
                categoria = ActivityCategory.CULTURA_FORMAZIONE,
                descrizioneBreve = "Laboratori di tornio e modellazione dell'argilla, corsi di ceramica Raku per adulti e bambini.",
                descrizioneCompleta = "Laboratorio artigianale nel cuore di Trastevere dedicato alla creazione di manufatti unici in ceramica smaltata e alla diffusione dell'arte fittile.",
                serviziOfferti = listOf(
                    "Corsi di tornio manuale e modellazione argilla",
                    "Workshop esperienziali di ceramica Raku",
                    "Creazione bomboniere solidali per eventi",
                    "Laboratori creativi per bambini e famiglie",
                    "Pezzi unici di design per arredo interni"
                ),
                localita = "Roma - Trastevere",
                indirizzoPubblico = "Via della Lungaretta, 65 - Roma",
                telefonoPubblico = "+39 06 5810234",
                emailPubblica = "ceramiche.trastevere@prolocal-demo.it",
                sitoWeb = "https://ceramicheditrastevere.demo-prolocal.it",
                socialInstagram = "@ceramiche_trastevere",
                socialLinkedin = "",
                orariApertura = "Mar - Sab: 10:30 - 19:00",
                statoPubblicazione = PublicationStatus.PUBBLICATA,
                dataUltimoAggiornamento = "20/07/2026",
                noteRevisioneAdmin = "Non visibile nella vetrina pubblica: socio collegato non attivo (quota non in regola)."
            ),
            BusinessActivity(
                id = "act-07",
                memberId = "mem-07",
                nomeAttivita = "Verde & Dimora Manutenzioni Ecologiche",
                categoria = ActivityCategory.SERVIZI_CASA,
                descrizioneBreve = "Cura del verde, potature aeree certificate, impianti di micro-irrigazione e bioedilizia leggera.",
                descrizioneCompleta = "Offriamo servizi di manutenzione sostenibile per parchi condominiali, terrazzi e giardini privati con attrezzature elettriche a zero emissioni dirette.",
                serviziOfferti = listOf(
                    "Manutenzione ordinaria e straordinaria giardini",
                    "Impianti irrigazione a risparmio idrico",
                    "Potatura siepi e alberature a basso fusto",
                    "Piccoli risanamenti edili e tinteggiature minerali",
                    "Consulenza per allestimento terrazzi verdi"
                ),
                localita = "Roma - Montesacro / Talenti",
                indirizzoPubblico = "Via Nomentana, 310 - Roma",
                telefonoPubblico = "+39 06 8200145",
                emailPubblica = "verdedimora@prolocal-demo.it",
                sitoWeb = "https://verdedimora.demo-prolocal.it",
                socialInstagram = "@verdedimora_roma",
                socialLinkedin = "linkedin.com/company/verdedimora-manutenzioni",
                orariApertura = "Lun - Ven: 08:00 - 18:00 | Sab: 08:00 - 13:00",
                statoPubblicazione = PublicationStatus.PUBBLICATA,
                dataUltimoAggiornamento = "04/09/2026",
                noteRevisioneAdmin = "Scheda conforme ai criteri di pubblicazione della piattaforma"
            )
        )
    )
    override val activities: StateFlow<List<BusinessActivity>> = _activities.asStateFlow()

    private val _currentSelectedMemberId = MutableStateFlow("mem-01")
    override val currentSelectedMemberId: StateFlow<String> = _currentSelectedMemberId.asStateFlow()

    override fun selectMember(memberId: String) {
        _currentSelectedMemberId.value = memberId
        val member = getMemberById(memberId)
        addAuditEntry(
            operatore = member?.nomeCognome ?: "Utente",
            azione = "Accesso Area Socio",
            modulo = "Area Socio",
            dettagli = "Sessione attiva come ${member?.nomeCognome} (${member?.statoAssociativo?.label})",
            livello = "INFO"
        )
    }

    override fun getActivityById(id: String): BusinessActivity? {
        return _activities.value.find { it.id == id }
    }

    override fun getMemberById(id: String): Member? {
        return _members.value.find { it.id == id }
    }

    override fun updateActivity(activity: BusinessActivity) {
        val currentList = _activities.value.toMutableList()
        val index = currentList.indexOfFirst { it.id == activity.id }
        val updatedActivity = activity.copy(
            dataUltimoAggiornamento = SimpleDateFormat("dd/MM/yyyy", Locale.ITALY).format(Date())
        )
        if (index >= 0) {
            currentList[index] = updatedActivity
        } else {
            currentList.add(updatedActivity)
        }
        _activities.value = currentList
        addAuditEntry(
            operatore = getMemberById(activity.memberId)?.nomeCognome ?: "Socio",
            azione = "Aggiornamento Scheda Attività",
            modulo = "Vetrina / Area Socio",
            dettagli = "Modificata scheda '${activity.nomeAttivita}' (Stato: ${activity.statoPubblicazione.label})",
            livello = "ATTIVITÀ"
        )
    }

    override fun requestPublication(activityId: String) {
        val currentList = _activities.value.toMutableList()
        val index = currentList.indexOfFirst { it.id == activityId }
        if (index >= 0) {
            val act = currentList[index]
            val member = getMemberById(act.memberId)

            if (member == null || !member.statoAssociativo.canPublishActivity) {
                addAuditEntry(
                    operatore = member?.nomeCognome ?: "Socio",
                    azione = "Richiesta Pubblicazione Respinta",
                    modulo = "Vetrina",
                    dettagli = "Impossibile pubblicare: il socio non risulta ATTIVO (${member?.statoAssociativo?.label})",
                    livello = "SICUREZZA"
                )
                return
            }

            val updated = act.copy(
                statoPubblicazione = PublicationStatus.IN_ATTESA_APPROVAZIONE,
                dataUltimoAggiornamento = SimpleDateFormat("dd/MM/yyyy", Locale.ITALY).format(Date()),
                noteRevisioneAdmin = "Richiesta formale di pubblicazione inviata il ${dateFormat.format(Date())}."
            )
            currentList[index] = updated
            _activities.value = currentList
            addAuditEntry(
                operatore = member.nomeCognome,
                azione = "Richiesta Pubblicazione Vetrina",
                modulo = "Vetrina",
                dettagli = "Attività '${act.nomeAttivita}' sottomessa alla verifica dell'amministrazione",
                livello = "ATTIVITÀ"
            )
        }
    }

    override fun updatePublicationStatus(activityId: String, newStatus: PublicationStatus, adminNotes: String) {
        val currentList = _activities.value.toMutableList()
        val index = currentList.indexOfFirst { it.id == activityId }
        if (index >= 0) {
            val act = currentList[index]
            val updated = act.copy(
                statoPubblicazione = newStatus,
                noteRevisioneAdmin = adminNotes.ifBlank { "Stato aggiornato a ${newStatus.label} da Amministrazione" },
                dataUltimoAggiornamento = SimpleDateFormat("dd/MM/yyyy", Locale.ITALY).format(Date())
            )
            currentList[index] = updated
            _activities.value = currentList
            addAuditEntry(
                operatore = "Amministrazione Pro-Local",
                azione = "Modifica Stato Pubblicazione",
                modulo = "Amministrazione Vetrina",
                dettagli = "Attività '${act.nomeAttivita}' impostata a '${newStatus.label}'. Note: $adminNotes",
                livello = "ATTIVITÀ"
            )
        }
    }

    override fun updateMemberStatus(memberId: String, newStatus: MembershipStatus) {
        val currentMemberList = _members.value.toMutableList()
        val memberIndex = currentMemberList.indexOfFirst { it.id == memberId }
        if (memberIndex >= 0) {
            val oldMember = currentMemberList[memberIndex]
            val updatedMember = oldMember.copy(
                statoAssociativo = newStatus,
                quotaSocialeInRegola = (newStatus == MembershipStatus.ATTIVO)
            )
            currentMemberList[memberIndex] = updatedMember
            _members.value = currentMemberList

            addAuditEntry(
                operatore = "Amministrazione Pro-Local",
                azione = "Variazione Stato Associativo",
                modulo = "Libro Soci",
                dettagli = "Socio ${oldMember.nomeCognome} (${oldMember.codiceSocio}) modificato in ${newStatus.label}",
                livello = "SICUREZZA"
            )
        }
    }
}
