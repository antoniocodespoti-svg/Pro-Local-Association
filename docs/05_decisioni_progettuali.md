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
