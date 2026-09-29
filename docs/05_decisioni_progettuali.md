# Pro-Local - Documentazione di Progetto
## 05. Decisioni Progettuali (Architecture Decision Records - ADR)

### ADR-001: Adozione del Principio di Requisiti Minimi Certi
* **Data:** 2026-09-07
* **Contesto:** Il progetto si trova nella prima fase di sviluppo. Molte regole associative non sono ancora state deliberate dai fondatori.
* **Decisione:** Non inventare alcuna regola o flusso non esplicitamente richiesto. Mantenere l'etichettatura visibile `[DEFINITO]` per i requisiti espressi e `[DA DEFINIRE]` per quelli aperti.
* **Conseguenze:** Si evitano rifacimenti costosi e fraintendimenti con lo Statuto ufficiale dell'ente.

### ADR-002: Separazione Rigorosa dei Livelli Architetturali
* **Data:** 2026-09-07
* **Contesto:** L'applicazione deve evolvere da una base iniziale a un sistema completo connesso a database e servizi cloud.
* **Decisione:** Definire un'interfaccia `ProLocalRepository` isolata. La UI interagisce solo tramite ViewModel/Repository contract.
* **Conseguenze:** L'introduzione di Room, SQLite, o API backend REST avverrà sostituendo o estendendo l'implementazione del repository senza toccare i componenti visivi.

### ADR-003: UI Responsive Multi-Device (Mobile, Tablet, Desktop)
* **Data:** 2026-09-07
* **Contesto:** Gli associati e i membri del Consiglio accederanno sia da smartphone sia da tablet o computer.
* **Decisione:** Implementare un layout responsive a classi dimensionali. Su schermi compatti (smartphone) si utilizza la barra inferiore e drawer; su schermi medi ed estesi (tablet e computer) una barra laterale (NavigationRail) e layout a griglia.
* **Conseguenze:** Esperienza d'uso uniforme e professionale su qualsiasi fattore di forma.

### ADR-004: Versionamento Integrato con GitHub
* **Data:** 2026-09-07
* **Contesto:** Necessità di conservazione permanente del codice, tracciabilità e collaborazione tra sviluppatori e soci tecnici.
* **Decisione:** Strutturazione del repository conforme agli standard Git, con documentazione in Markdown (`/docs`) consultabile sia su GitHub sia direttamente dall'applicazione.

### ADR-005: Vincolo di Visibilità Vetrina Ancorato allo Status di Socio Attivo
* **Data:** 2026-09-07
* **Contesto:** La vetrina pubblica deve valorizzare le attività economiche e professionali dei membri dell'associazione, costituendo un beneficio riservato a chi partecipa attivamente alla vita associativa ed è in regola con la quota.
* **Decisione:** Incapsulare nel modello di dominio (`BusinessActivity.isVisibileInVetrina(MembershipStatus)`) la regola di visibilità come singola sorgente di verità. Se lo stato associativo del socio collegato non è `ATTIVO`, l'attività è esclusa dalle query e dalle schermate pubbliche, a prescindere dal suo stato redazionale.
* **Conseguenze:** Totale aderenza al mandato statutario. Nessun disallineamento possibile tra libro soci e vetrina pubblica.

### ADR-006: Esclusione Funzionalità Commerciali E-commerce e Recensioni Libere
* **Data:** 2026-09-07
* **Contesto:** Pro-Local non è un marketplace o un intermediario d'affari a scopo di lucro, ma una piattaforma istituzionale di rete territoriale.
* **Decisione:** Non implementare carrelli acquisti, gateway di pagamento transazionali o recensioni commerciali non verificate. La piattaforma offre contatto diretto (telefono, email, sede fisica, link web istituzionali).
* **Conseguenze:** Piena conformità con la natura di associazione non riconosciuta / futuro ETS; nessuna responsabilità da intermediario commerciale.

### ADR-007: Flusso di Approvazione Schede Attività a Due Fasi
* **Data:** 2026-09-07
* **Contesto:** Necessità di verificare la rispondenza delle schede pubblicate alle finalità associative e alla dignità dell'ente.
* **Decisione:** Implementazione di un ciclo di vita a stati (`BOZZA`, `IN_ATTESA_APPROVAZIONE`, `PUBBLICATA`, `SOSPESA`, `RIFIUTATA`) con approvazione esplicita da parte della segreteria/amministrazione.
* **Conseguenze:** Controllo editoriale garantito e responsabilizzazione del socio.

### ADR-008: Principio di Democraticità Associativa e Subordinazione del Software
* **Data:** 2026-09-08
* **Contesto:** Esigenza fondamentale di salvaguardare la natura democratica dell'ente e impedire qualsiasi deriva verticistica o tecnocratica.
* **Decisione:** Il software è formalmente e strutturalmente subordinato agli organi democratici statutari. L'Assemblea dei Soci è sovrana; il Consiglio Direttivo è organo collegiale esecutivo; l'amministratore tecnico del software è un ruolo ausiliario senza poteri deliberativi e non può scavalcare né alterare le deliberazioni collegiali.
* **Conseguenze:** Garanzia di democraticità interna nel pieno rispetto dei principi generali del Terzo Settore e del Codice Civile.

### ADR-009: Separazione Assoluta tra Associazione e Attività Professionali dei Soci
* **Data:** 2026-09-08
* **Contesto:** Rischio di ingenerare nei cittadini/visitatori la falsa percezione che l'associazione certifichi la perizia professionale, garantisca l'esito dei servizi o assuma responsabilità contrattuali/extracontrattuali.
* **Decisione:** 
  1. Separazione rigorosa tra le due dimensioni: l'associazione gestisce la vita sociale democratica; la piattaforma espone unicamente uno spazio informativo neutrale; il professionista/impresa opera in piena e autonoma responsabilità; il visitatore sceglie autonomamente se contattare l'attività.
  2. Divieto assoluto di esporre nella vetrina o nelle schede badge, sigilli, bollini, "verificato", "certificato" o attestazioni di garanzia commerciale.
  3. Inserimento in ogni scheda di una chiara nota di trasparenza e autonomia.
* **Conseguenze:** Esclusione di qualsiasi responsabilità di garanzia o intermediazione in capo all'associazione e trasparenza totale verso la cittadinanza.

### ADR-010: Hardening Governance, Separazione del Ruolo Tecnico e Preparazione Architettura Web Indipendente (Fase 2.1)
* **Data:** 2026-09-08
* **Contesto:** Il progetto si evolve verso una piattaforma Web ufficiale a livelli disaccoppiati (React + TypeScript frontend, Node.js + TypeScript REST backend, futuro database PostgreSQL). Si richiede l'applicazione rigorosa dei principi di governance direttamente a livello di dominio backend (non solo nella UI).
* **Decisione:**
  1. **Subordinazione e perimetro del Ruolo Tecnico:** L'Amministratore Tecnico è formalmente e tecnicamente limitato alla manutenzione, alla diagnostica di sistema, ai log tecnici e alla configurazione infrastrutturale. È categoricamente inibito da qualsiasi azione associativa (ammissione soci, sospensione, esclusione, modifiche statutarie, deliberazioni, forzatura vetrina).
  2. **Ownership Stretta delle Schede:** Un socio può modificare esclusivamente la propria attività commerciale/professionale (`activity.memberId == actorMemberId`). È preclusa la modifica di schede altrui.
  3. **Completamento Stati Associativi:** Introdotto formalmente lo stato `ESCLUSO` nel dominio. Come per `SOSPESO`, `RECEDUTO` e `IN_ATTESA`, comporta l'oscuramento immediato della vetrina. I quorum e le maggioranze deliberative per disporre l'esclusione rimangono rigorosamente `[DA DEFINIRE]`.
  4. **Predisposizione Web Multi-Livello:** Creati i moduli `backend/` e `frontend/` indipendenti dalla UI Android, con logica di sicurezza e RBAC applicata a livello di policy/servizio.
* **Conseguenze:** Architettura robusta, testabile con test JVM/Robolectric sul prototipo Android e con test Node/TypeScript nel backend, pronta per la futura transizione verso PostgreSQL e deployment web.

### ADR-011: Implementazione REST API Server, Web App Pubblica e Area Socio Demo (Fase 2.2)
* **Data:** 2026-09-08
* **Contesto:** Attivazione del primo stack web funzionante end-to-end (Browser → React → REST API → Application Services → Domain Policy → Repository in-memory).
* **Decisione:**
  1. **Server REST API con Express:** Endpoints `GET /api/showcase`, `GET /api/activities/:id`, `GET /api/members/me`, `PUT /api/activities/:id` con validazione input severa e codici HTTP coerenti (200, 400, 403, 404, 500).
  2. **Protezione Accessi e Ownership:** `PUT /api/activities/:id` applica `AccessControlPolicy`: il socio può modificare solo la propria scheda; l'Amministratore Tecnico e altri soci ricevono 403. La modifica riporta lo stato in `IN_ATTESA_APPROVAZIONE`.
  3. **Protezione Dettaglio Pubblico:** `GET /api/activities/:id` restituisce 404 per schede non pubbliche (nessun bypass tramite URL diretto).
  4. **Autenticazione Demo:** Utilizzo esplicito di header `X-Demo-Member-Id` chiaramente documentato come transitorio per la Fase 2.2.
  5. **Frontend Web React:** Navigazione client `/`, `/attivita/:id`, `/socio`, `/socio/attivita` con componente `LegalNotice` e assenza totale di badge o sigilli promozionali.
* **Conseguenze:** Web app e API server completi e coperti da test automatizzati, con prototipo Android intatto.

### ADR-012: Adozione di PostgreSQL, Connection Pool e Migrazioni Transazionali DDL (Fase 2.4)
* **Data:** [Data non disponibile nel repository locale]
* **Contesto:** Necessità di persistenza relazionale sicura e conforme allo schema di dominio, con supporto a concorrenza, vincoli di integrità referenziale e transazioni ACID.
* **Decisione:**
  1. Introduzione del driver PostgreSQL con gestione pool (`pg.Pool`) e supporto configurabile tramite `DB_DRIVER=postgres` (mantenendo `DB_DRIVER=memory` per i test veloci).
  2. Implementazione del `DatabaseMigrator` transazionale: applica sequenzialmente le migrazioni DDL con rollback automatico in caso di errore e tracciamento nella tabella `schema_migrations`.
  3. Creazione delle migrazioni 001 (`members`), 002 (`business_activities`) e 003 (`audit_logs`) con vincoli di integrità e indici su stati e foreign key.
* **Conseguenze:** Persistenza relazionale solida, audit log immutabile e test di integrazione eseguiti tramite `pg-mem`.

### ADR-013: Autenticazione a Sessioni Server-Side, Hashing Scrypt e Cookie HttpOnly (Fase 3)
* **Data:** [Data non disponibile nel repository locale]
* **Contesto:** Superamento del meccanismo transitorio di Demo Auth basato su header; necessità di autenticazione con credenziali reali conforme agli standard OWASP.
* **Decisione:**
  1. Hashing crittografico delle password tramite `node:crypto.scrypt` (N=32768, r=8, p=1, keyLen=64, salt CSPRNG 16 byte, formato PHC versionabile) e comparazione timing-safe (`crypto.timingSafeEqual`).
  2. Prevenzione dell'account enumeration con risposta 401 generica neutra su login fallito.
  3. Account lockout: blocco temporaneo di 15 minuti (`423 Locked`) dopo 5 tentativi consecutivi falliti.
  4. Gestione sessioni server-side: generazione token raw a 32 byte via CSPRNG e archiviazione nel DB unicamente tramite hash SHA-256 (nessun token memorizzato in chiaro).
  5. Emissione del cookie di sessione `prolocal_session` con `HttpOnly: true`, `SameSite: 'lax'`, `Path: '/'`, `Max-Age: 28800` (8 ore) e `Secure` abilitato in produzione.
  6. Politica di scadenza: timeout per inattività di 30 minuti e timeout assoluto di 8 ore.
  7. Rimozione integrale del precedente meccanismo Demo Auth (`X-Demo-Member-Id`, `X-Demo-Role`).
* **Conseguenze:** Autenticazione sicura e protetta da attacchi XSS; le sessioni possono essere revocate istantaneamente lato server.

### ADR-014: Protezione CSRF su Richieste Mutative tramite Header Personalizzato
* **Data:** [Data non disponibile nel repository locale]
* **Contesto:** L'utilizzo di cookie di sessione per l'autenticazione espone l'applicazione a potenziali attacchi Cross-Site Request Forgery su operazioni che modificano dati.
* **Decisione:**
  1. Obbligo della presenza dell'header personalizzato `X-Requested-With: ProLocalApp` su tutte le richieste mutative (`POST`, `PUT`, `PATCH`, `DELETE`) effettuate con cookie di sessione.
  2. Rifiuto immediato con `403 Forbidden` (`Protezione CSRF violata`) in assenza dell'header valido.
  3. L'API client nel frontend invia automaticamente tale header su tutte le mutazioni.
* **Conseguenze:** Protezione contro invii forzati da form HTML terzi, garantita dalle restrizioni CORS dei browser sugli header personalizzati.

### ADR-015: Separazione Ontologica tra UserAccount e Member e Isolamento Tecnico
* **Data:** [Data non disponibile nel repository locale]
* **Contesto:** Rischio di commistione tra l'identità autenticabile e il ruolo di socio dell'associazione; necessità di garantire l'assoluta subordinazione del ruolo tecnico.
* **Decisione:**
  1. Creazione nel DB della tabella `user_accounts` con vincolo CHECK che impone `member_id IS NULL` se `actor_type = 'TECHNICAL_ADMIN'` e `member_id` obbligatorio e univoco se `actor_type = 'MEMBER'`.
  2. L'Amministratore Tecnico non possiede una scheda socio, non può visualizzare o modificare le attività commerciali dei soci (403), e accede unicamente alla console tecnica diagnostica.
  3. Risoluzione dinamica dei ruoli e dello stato associativo dal record `Member` ad ogni richiesta per gli utenti socio.
* **Conseguenze:** Rispetto assoluto del principio statutario di separazione dei poteri; nessun amministratore tecnico può alterare la vita democratica o commerciale dell'ente.

### ADR-016: Servizio Schedulato di Pulizia Sessioni Scadute (SessionCleanupService)
* **Data:** [Data non disponibile nel repository locale]
* **Contesto:** Le sessioni scadute per inattività o timeout assoluto rischiano di accumularsi nel database se l'utente non effettua il logout esplicito.
* **Decisione:**
  1. Creazione del servizio applicativo `SessionCleanupService` che invoca `sessionRepo.deleteExpired()` a intervalli regolari di 60 minuti.
  2. Failure isolation: cattura di eventuali errori di rete o DB nel log senza bloccare l'event loop di Node.js né far cadere il server HTTP.
  3. Integrazione con il lifecycle di avvio del server e interruzione controllata del timer su segnali di sistema (`SIGTERM`, `SIGINT`).
* **Conseguenze:** Manutenzione automatica del database senza leak di risorse o timer orfani.



