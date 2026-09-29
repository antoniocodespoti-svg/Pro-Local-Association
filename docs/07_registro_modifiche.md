# Pro-Local - Documentazione di Progetto
## 07. Registro delle Modifiche (Changelog)

Tutte le modifiche al codice e alla documentazione di Pro-Local sono annotate in questo registro per garantire tracciabilità e continuità.

---

### Consolidamento Tecnico — Session Cleanup & File Migrazione 004 (Stato Attuale del Codice)
* **Data di Rilascio:** [Data non disponibile nel repository locale]
* **Tipologia:** Consolidamento DDL Relazionale, Manutenzione Automatica Sessioni & Estensione Test Suite

#### Modifiche e Risultati Implementati:
1. **File Migrazione SQL 004 (`backend/src/db/migrations/004_create_auth_tables.sql`):**
   - Creato il file fisico DDL per la migrazione 004, allineandolo strutturalmente a `001`, `002` e `003`.
   - Contiene la definizione identica delle tabelle `user_accounts` e `sessions`, con indici, foreign key in cascade e vincolo CHECK di separazione ontologica `chk_actor_type_member`.
   - Aggiunto test automatizzato di coerenza che verifica l'equivalenza semantica tra il file su disco e la stringa registrata nell'array `MIGRATIONS` in `backend/src/db/migrator.ts`.
2. **Servizio di Pulizia Sessioni Scadute (`backend/src/services/SessionCleanupService.ts`):**
   - Implementato il servizio schedulato che invoca periodicamente `sessionRepo.deleteExpired()` a intervalli di 60 minuti.
   - Failure isolation: errori temporanei del database vengono catturati e registrati nei log senza causare il crash del server HTTP né interrompere i cicli successivi.
   - Lifecycle controllabile: metodi `start()` e `stop()` con gestione del graceful shutdown su segnali di terminazione `SIGTERM` e `SIGINT` in `backend/src/index.ts`.
3. **Suite di Test e Risultati:**
   - La suite di test raggiunge **151 test complessivi, tutti verificati e superati**:
     - 122 test Backend (`governance_security`, `api_http`, `postgres_repositories`, `auth_core`, `auth_service`, `auth_http`, `session_cleanup`).
     - 29 test Frontend (`frontend_components`, `auth_integration`, `api_client`).
     - 0 errori di typecheck TypeScript in backend e frontend.

---

### Fase 3 — Autenticazione a Sessioni Server-Side, Cookie HttpOnly, CSRF & Rimozione Demo Auth
* **Data di Rilascio:** [Data non disponibile nel repository locale]
* **Tipologia:** Autenticazione Reale OWASP-Compliant, Session Management, Protezione CSRF & Frontend Auth

#### Modifiche e Risultati Implementati:
1. **Core Autenticazione e Crittografia (`backend/src/auth/`):**
   - Hashing delle password con algoritmo Scrypt (`node:crypto.scrypt`, salt CSPRNG a 16 byte, parametri N=32768, r=8, p=1, keyLen=64, formato versionabile PHC) e verifica con comparazione timing-safe.
   - Prevenzione dell'account enumeration con risposte neutre 401 su login non valido.
   - Account lockout: blocco di sicurezza di 15 minuti (`423 Locked`) dopo 5 tentativi consecutivi falliti.
   - Generazione di token di sessione raw a 32 byte via CSPRNG (64 caratteri hex); memorizzazione nel database unicamente tramite hash SHA-256.
   - Gestione dei timeout: timeout per inattività di 30 minuti e timeout assoluto di 8 ore.
2. **Trasporto HTTP & Sicurezza Cookie:**
   - Rilascio del cookie di sessione `prolocal_session` con flag `HttpOnly: true`, `SameSite: 'lax'`, `Path: '/'`, `Max-Age: 28800` (8 ore) e `Secure: true` in produzione.
   - Protezione CSRF: verifica dell'header personalizzato `X-Requested-With: ProLocalApp` su tutte le richieste mutative (`POST`, `PUT`, `PATCH`, `DELETE`) effettuate con cookie di sessione; restituzione di 403 Forbidden in caso di violazione.
   - Controller REST attivi: `POST /api/auth/login`, `POST /api/auth/logout` (revoca immediata), `GET /api/auth/me`.
   - Rimozione completa e definitiva della precedente Demo Auth basata su header (`X-Demo-Member-Id`, `X-Demo-Role`).
3. **Frontend Integration (`frontend/src/`):**
   - Gestione autenticazione reattiva con `AuthContext` e hook `useAuth`.
   - Viste `LoginView` e `TechnicalAdminView` con gestione chiara degli stati di errore.
   - Configurazione di `apiClient.ts` con `credentials: 'include'` e header CSRF automatico.
   - Intercettazione centralizzata della sessione scaduta (401) e ripristino automatico dello stato non autenticato.

---

### Fase 2.4 — Consolidamento PostgreSQL, Transazioni, Audit Logging & Modelli Relazionali
* **Data di Rilascio:** [Data non disponibile nel repository locale]
* **Tipologia:** Persistenza Relazionale, Transazioni ACID, Migrazioni DDL & Audit Trail

#### Modifiche e Risultati Implementati:
1. **Driver PostgreSQL e Connection Pool:**
   - Supporto per PostgreSQL relazionale configurabile tramite `DB_DRIVER=postgres`, preservando il driver in-memory (`DB_DRIVER=memory`) per i test.
   - Inizializzazione pool di connessioni nativo `pg.Pool` con supporto a configurazione tramite URL o singole variabili d'ambiente.
2. **Migrazioni DDL Transazionali:**
   - `DatabaseMigrator` con esecuzione transazionale, rollback automatico e tracciamento in `schema_migrations`.
   - Migrazioni create: `001_create_members`, `002_create_business_activities`, `003_create_audit_logs`, `004_create_auth_tables`.
3. **Separazione Ontologica UserAccount / Member:**
   - Tabella `user_accounts` collegata a `members` tramite foreign key con vincolo CHECK che impone `member_id IS NULL` per `TECHNICAL_ADMIN` e `member_id` obbligatorio e univoco per `MEMBER`.
   - Tabella `sessions` con foreign key in cascata (`ON DELETE CASCADE`) verso `user_accounts`.
4. **Repository PostgreSQL:**
   - Implementati `PostgresMemberRepository`, `PostgresBusinessActivityRepository`, `PostgresAuditLogRepository`, `PostgresUserAccountRepository`, `PostgresSessionRepository`.
   - Test di integrazione del layer relazionale eseguiti con `pg-mem`.

---

### Versione 0.2.4-beta (Fase 2.2 — REST API + Prima Web App Pubblica + Area Socio Demo)
* **Data di Rilascio:** 2026-09-08
* **Tipologia:** REST API Server, Web App React End-to-End, Area Socio & Ownership Enforcement

#### Modifiche e Risultati Implementati:
1. **REST API Server (`backend/src/app.ts`, `backend/src/index.ts`):**
   - Implementato server HTTP REST con Express e CORS per ambiente di sviluppo locale.
   - Endpoint minimi attivi e verificati:
     - `GET /api/showcase`: vetrina pubblica neutrale, restituisce solo attività con `PublicationStatus == PUBBLICATA` e socio con `MembershipStatus == ATTIVO`.
     - `GET /api/activities/:id`: scheda dettaglio pubblica; restituisce 404 per attività non pubbliche per impedire bypass tramite URL diretto.
     - `GET /api/members/me`: area socio demo con header esplicito `X-Demo-Member-Id` e nota di collaudo trasparente (autenticazione reale demandata a fasi successive).
     - `PUT /api/activities/:id`: aggiornamento scheda attività con validazione input rigorosa (`ActivityValidator`) e vincolo di ownership (`activity.memberId == actorMemberId`). Blocco categorico con 403 Forbidden sia per tentativi di modifica tra soci diversi, sia per tentativi da parte dell'Amministratore Tecnico.
     - Ritorno automatico allo stato `IN_ATTESA_APPROVAZIONE` in seguito a modifica da parte del socio.
2. **Web App Frontend (`frontend/src/`):**
   - Routing browser leggero per `/`, `/attivita/:id`, `/socio`, `/socio/attivita`.
   - `ShowcaseView`: renderizza la lista attività con barra di ricerca, filtro categoria e banner permanente `LegalNotice`.
   - `ActivityDetailView`: vista dettaglio con contatti e note di autonomia, nessun badge o bollino commerciale.
   - `MemberDashboardView`: dashboard demo con visualizzazione stato associativo e selettore di identità demo.
   - `ActivityEditView`: modulo di aggiornamento dati attività del socio accessibile da tastiera, con label semantiche e gestione errori.
3. **Astrazione Repository Preservata:**
   - Confermata l'architettura `InMemoryMemberRepository` e `InMemoryBusinessActivityRepository`; nessun database PostgreSQL introdotto prematuramente.
4. **Test Suite Automatizzata:**
   - 31 test nel Backend (16 di governance & RBAC e 15 end-to-end REST API HTTP con server in ascolto su porta effimera).
   - 12 test nel Frontend (6 di SSR rendering e verifica assenza badge promozionali, 6 di integrazione API Client con gestione errori e ownership).
   - Prototipo Android (`:app:testDebugUnitTest`) intatto con 33 test eseguiti con successo.

---

### Versione 0.2.3-beta (Fase 2.1 — Hardening Governance & Domain + Preparazione Web App)
* **Data di Rilascio:** 2026-09-08
* **Tipologia:** Hardening Governance, Separazione Amministratore Tecnico, RBAC & Scaffolding Web App (Frontend/Backend)

#### Modifiche e Risultati Implementati:
1. **Hardening Governance & Dominio (Kotlin + TypeScript):**
   - Introduzione formale dello stato `ESCLUSO` in `MembershipStatus` (accanto a `IN_ATTESA`, `ATTIVO`, `SOSPESO`, `RECEDUTO`).
   - Conferma che lo stato `ESCLUSO` inibisce istantaneamente e totalmente la visibilità nella vetrina pubblica.
   - Quorum, maggioranze e procedure formali di esclusione permangono rigorosamente non definite (`[DA DEFINIRE]`).
   - Rimosso qualsiasi `badgeColorType` residuo legato allo status per evitare commistioni con badge commerciali o di garanzia.
2. **Access Control Policy & RBAC:**
   - Creata policy centralizzata (`ProLocalRBAC.kt` in Android e `AccessControlPolicy.ts` in Backend).
   - Separazione netta tra organi associativi sovrani/collegiali (`SOCIO`, `PRESIDENTE`, `CONSIGLIO_DIRETTIVO`, `ASSEMBLEA`) e il ruolo tecnico ausiliario (`AMMINISTRATORE_TECNICO`).
   - All'Amministratore Tecnico è **esplicitamente e tassativamente negata** qualsiasi azione associativa (ammissione, sospensione, esclusione soci, modifiche statutarie, deliberazioni, elezioni, forzatura vetrina, modifica schede soci). Sono permesse solo operazioni tecniche di manutenzione, log e diagnostica.
   - Ownership rigorosa: un socio può modificare solo ed esclusivamente la propria attività (`canEditActivity`); vietata la modifica di attività di altri soci.
3. **Scaffolding Web App (`backend/` e `frontend/`):**
   - **Backend (`backend/`):** Strutturato in TypeScript moderno (ESM, compatibile Node.js v22). Include layer `domain` (modelli e policy), `repositories` e `services` (`ShowcaseService`, `ActivityManagementService`). Suite di 16 test unitari di sicurezza eseguiti con successo.
   - **Frontend (`frontend/`):** Strutturato in React + TypeScript con tipi allineati al backend REST, componenti `ShowcaseView`, `ActivityCard` (senza alcun badge o attestato promozionale) e `LegalNotice` permanente.
4. **Preservazione Integrale del Prototipo Android:**
   - Il codice Kotlin/Jetpack Compose è rimasto intatto e pienamente funzionante.
   - Aggiunta suite di test unitari `ProLocalGovernanceSecurityTest.kt` eseguita con successo via Gradle (`:app:testDebugUnitTest`).

---

### Versione 0.2.2-beta (Consolidamento Fase 2: Democraticità e Separazione Assoluta Attività)
* **Data di Rilascio:** 2026-09-08
* **Tipologia:** Consolidamento Principi di Governance, Neutralità Vetrina & Disaccoppiamento di Responsabilità

#### Modifiche e Principi Introdotti:
1. **Riaffermazione del Principio di Democraticità Associativa:**
   - L'associazione è e rimane rigorosamente democratica.
   - Il software è formalmente e tecnicamente uno strumento ausiliario e subordinato alle regole associative, non un'autorità sopra gli organi statutari.
   - L'Assemblea dei Soci è sovrana; il Consiglio Direttivo è organo collegiale esecutivo; nessun amministratore tecnico del software può scavalcare le delibere degli organi associativi.
2. **Separazione Assoluta tra Associazione e Attività Professionali:**
   - Separazione netta tra la vita democratica interna dell'associazione e l'esercizio autonomo dell'attività economica o professionale del socio.
   - La piattaforma fornisce uno spazio informativo neutrale; il professionista/attività rimane autonomo nella gestione della propria prestazione o impresa; il visitatore sceglie in piena autonomia se contattare l'attività.
   - L'associazione **NON è garante né intermediario commerciale o contrattuale**: non verifica la perizia professionale, non garantisce la qualità dei servizi, non certifica le attività né assume responsabilità per le prestazioni.
3. **Neutralità Assoluta dell'Interfaccia Pubblica (Vetrina):**
   - Rimozione completa di badge, sigilli, bollini ("Attività Verificata", "Socio Certificato", icone di scudo/garanzia) e di qualsiasi attestazione commerciale dalla vetrina e dalle schede.
   - Inserimento in ogni scheda di una chiara nota informativa di trasparenza e autonomia.
   - La regola del socio attivo rimane pienamente operativa quale condizione interna di ammissibilità associativa, senza trasformarsi in una certificazione per il pubblico.
4. **Allineamento Documentale e Coerenza Codice:**
   - Aggiornati tutti i documenti di progetto (`01_descrizione_generale.md`, `02_specifica_funzionale.md`, `03_architettura_tecnica.md`, `04_infrastruttura_rete.md`, `05_decisioni_progettuali.md` con ADR-008 e ADR-009, `06_regole_associazione.md`, `07_registro_modifiche.md`).
   - Invarianza delle regole del Consiglio Direttivo e rigoroso mantenimento della distinzione tra `[DEFINITO]` e `[DA DEFINIRE]`.

---

### Versione 0.2.1-beta (Consolidamento & Verifica Rigorosa Fase 2)
* **Data di Verifica:** 2026-09-07
* **Tipologia:** Verifica di Conformità, Test di Validazione & Consolidamento Regole

#### Esiti della Verifica:
- **Vetrina Pubblica:** Verificata la ricerca per parole chiave e servizi, i filtri merceologici e territoriali, la navigazione responsive e l'apertura/chiusura della scheda dettaglio attività.
- **Regola Fondamentale del Socio Attivo:**
  - Confermata l'esistenza di una singola regola di dominio coerente (`BusinessActivity.isVisibileInVetrina(MembershipStatus)`).
  - Verificato che la sospensione del socio oscuri immediatamente l'attività sia dalla vetrina che dai risultati di ricerca, nonché reattivamente dalla vista di dettaglio aperta.
- **Area Socio:**
  - Verificata la gestione autonoma della scheda, la visualizzazione dello stato (`BOZZA`, `IN_ATTESA_APPROVAZIONE`, `PUBBLICATA`, `SOSPESA`).
  - Verificato e testato il blocco perentorio della richiesta di pubblicazione se il socio collegato non possiede lo stato `ATTIVO`.
- **Area Amministrativa & Audit:**
  - Verificate le operazioni di approvazione, sospensione e richiesta di integrazioni/bozza, con collegamento esplicito attività-socio.
  - Verificata la registrazione degli audit log con livello di severità e modello predisposto per la persistenza su database relazionale.
- **Invarianza Governance del Consiglio Direttivo:**
  - Verificata la totale integrità delle regole del Consiglio: quattro cariche apicali elette dall'Assemblea, maggioranza dei presenti, voto prevalente del Presidente in parità, subentro del primo dei non eletti, disciplina di revoca.
- **Allineamento [DEFINITO] vs [DA DEFINIRE]:**
  - Confermato che i punti non deliberati (numero attività per socio, obbligatorietà campi, modalità definitive di approvazione, categorie definitive, recensioni, geolocalizzazione, messaggistica, pagamenti, abbonamenti e altre funzioni commerciali) restano esplicitamente marcati come `[DA DEFINIRE]`.
- **Suite di Test:**
  - Eseguiti con successo tutti i test unitari Robolectric/JVM (`ProLocalCouncilTest` e `ProLocalShowcaseTest`), inclusi nuovi test sul blocco sottomissione socio sospeso e tracciamento audit log.

---

### Versione 0.2.0-beta (Fase 2 - Vetrina Digitale delle Attività dei Soci)
* **Data di Rilascio:** 2026-09-07
* **Tipologia:** Evoluzione Funzionale Maggiore / Vetrina Pubblica & Area Soci

#### Nuove Funzionalità Implementate:
- **Integrazione delle Due Dimensioni Pro-Local:**
  - Piena coesistenza tra la dimensione istituzionale/amministrativa dell'associazione e la dimensione pubblica di vetrina territoriale.
- **Vetrina Digitale Pubblica (`ShowcaseScreen`):**
  - Ricerca libera per parola chiave o servizio; filtri per categorie merceologiche (Artigianato, Consulenza, Enogastronomia, Digitale, Benessere, Casa & Verde, ecc.); filtri territoriali/quartiere.
  - Elenco attività con contatti veloci (telefono, email, sito), badge di categoria e tag servizi.
  - Banner esplicativo della Regola Fondamentale e della natura istituzionale no-profit della rete.
- **Scheda Dettaglio Attività (`ActivityDetailSheet`):**
  - Finestra modale / foglio esteso di dettaglio con descrizione approfondita, tutti i recapiti ufficiali, orari di apertura, elenco puntuale dei servizi offerti e canali social.
  - Badge di garanzia "Attività Verificata - Socio Pro-Local Attivo" con identificativo tessera socio.
- **Applicazione Rigorosa della Regola Fondamentale:**
  - Incapsulata a livello di dominio (`BusinessActivity.isVisibileInVetrina(MembershipStatus)`).
  - Un'attività compare nella vetrina **esclusivamente se il socio collegato risulta in stato ATTIVO**.
  - Se il socio viene sospeso o decade, l'attività viene istantaneamente e reattivamente oscurata.
- **Area Riservata Socio (`MemberAreaScreen`):**
  - Visualizzazione del profilo associativo personale (codice tessera, data di ammissione, stato quota annuale).
  - Gestione autonoma della propria scheda attività (nome, categoria, recapiti, orari, servizi, descrizione).
  - Tracciamento visivo dello stato di pubblicazione (`BOZZA`, `IN_ATTESA_APPROVAZIONE`, `PUBBLICATA`, `SOSPESA`).
  - Pulsante formale di richiesta pubblicazione (con blocco automatico preventivo se il socio è sospeso).
  - Selettore persone demo per testare l'esperienza di soci attivi o sospesi.
- **Pannello di Amministrazione e Vigilanza (`ShowcaseAdminScreen`):**
  - Coda di revisione delle schede sottomesse dai soci (approvazione, sospensione o richiesta chiarimenti).
  - Gestione in tempo reale del Libro Soci (attivazione/sospensione con effetto immediato sulla vetrina).
  - Registro delle attività con stato editoriale e motivazioni di sospensione.
  - Matrice RBAC dimostrativa e registro di audit delle operazioni.
- **Suite di Test Automatizzati:**
  - Aggiunti test Robolectric/JVM dedicati (`ProLocalShowcaseTest`) che certificano formalmente la regola fondamentale, la reattività della sospensione/riattivazione e la sottomissione delle schede.
- **Documentazione Allineata:**
  - Aggiornati tutti i 7 documenti in `/docs` e la documentazione in-app per riflettere le nuove funzionalità e le decisioni architetturali.

---

### Versione 0.1.0-alpha (Fase 1 - Fondazione del Progetto)
* **Data di Rilascio:** 2026-09-07
* **Tipologia:** Release Iniziale / Architettura Base

#### Nuove Funzionalità & Struttura Implementate:
- **Identità di Piattaforma:** Configurazione del progetto come **Pro-Local**, con icone vettoriali adattive civiche, tema con palette blu istituzionale/ardesia e metadata allineati.
- **Layout Responsive Multi-Dispositivo:** Supporto adattivo per smartphone (navigazione inferiore/drawer), tablet e desktop/computer (NavigationRail e griglie flessibili).
- **Dashboard Iniziale:** Panoramica dello stato associativo, conteggio sintetico dei moduli, monitoraggio dei requisiti definiti vs da definire, log delle attività recenti e promemoria delle regole del Consiglio.
- **Modulo Consiglio & Organi:**
  - Esposizione formale delle 4 cariche interne elette dall'Assemblea (Presidente, Vicepresidente, Segretario, Tesoriere).
  - Motore di simulazione e consultazione delle 5 regole consiliari definite: maggioranza presenti, parità con voto prevalente del Presidente, subentro primo non eletti con approvazione, disciplina revoca.
  - Disclaimer normativo esplicito per la conformità con l'ordinamento italiano.
- **Moduli Futuri Predisposti (con etichetta esplicita `[DA DEFINIRE]`):**
  - Sezioni predisposte per: Associati, Assemblea & Votazioni, Documenti & Verbali, Comunicazioni, Ruoli e Permessi.
  - Per ciascun modulo sono elencati gli elementi già predisposti a livello architetturale e le decisioni statutarie da definire prima dell'implementazione.
- **Visualizzatore Integrato della Documentazione:**
  - Navigazione e lettura diretta in-app di tutte le 7 categorie di documentazione di progetto, con filtro per categoria e indicatori di completezza.
- **Separazione dei Livelli:** Struttura `core.model` e `core.data.ProLocalRepository` completamente disaccoppiata dalla UI, con dati rigorosamente dimostrativi.
- **Predisposizione GitHub:** Documentazione completa in formato Markdown nella directory `/docs` e file `README.md` principale.
