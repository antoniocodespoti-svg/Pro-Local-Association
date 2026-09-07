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
