# Pro-Local - Documentazione di Progetto
## 04. Infrastruttura e Rete

### 4.1 Architettura Attuale: Client Standalone Reattivo
* **Esecuzione:** Client-side reattivo su runtime Kotlin/Compose.
* **Persistenza & Stato:** Gestione dello stato in-memory reattiva (`StateFlow`), che garantisce il ricalcolo istantaneo delle viste pubbliche in funzione delle variazioni dello stato associativo.
* **Dipendenze Esterne:** Nessuna chiamata a servizi di terze parti o librerie di tracciamento commerciale esterne; assenza totale di dipendenze hardware bloccanti.

### 4.2 Progettazione Rete per la Piattaforma Online [DA DEFINIRE]
La natura bivalente di Pro-Local (vetrina pubblica + gestione interna) guida l'architettura di rete:

1. **Vetrina Pubblica ad Alta Efficienza (Read-Heavy):**
   - Esposizione pubblica delle schede attività tramite Edge Caching / CDN.
   - Invalida automatica della cache non appena lo stato di un socio cambia da "ATTIVO" a "SOSPESO" o "DECADUTO" per garantire il rispetto assoluto della Regola Fondamentale.
   - Nessun cookie di profilazione o tracciamento commerciale di terze parti.
2. **Area Riservata Soci e Amministrazione (Protected API):**
   - Accesso protetto tramite canale TLS 1.3 / HTTPS con autenticazione a due fattori (2FA) raccomandata per gli amministratori.
   - Sessioni con token a scadenza temporale e refresh protetto.
3. **Database e Storage [DA DEFINIRE]:**
   - Database relazionale (PostgreSQL / SQLite con crittografia at-rest) con vincoli di integrità referenziale rigidi tra `Socio` e `Attivita`.
   - Storage cifrato (es. S3-compatible / Cloud Storage con ACL private) per verbali e documenti statutari.
