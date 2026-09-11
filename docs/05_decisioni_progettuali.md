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


