# Pro-Local

Piattaforma digitale per la gestione democratica dell'associazione e vetrina pubblica delle attività dei soci.

> **Stato Progetto:** Fase 3 (Consolidata) — Workflow Revisioni Attività & Approvazione Presidenziale REST, Autenticazione a Sessioni Server-Side, Cookie HttpOnly, CSRF, PostgreSQL (001–005), Session Cleanup & Test Suite (204 test verdi: 175 Backend + 29 Frontend) (Versione package 0.2.4-beta)  
> **Natura Giuridica dell'Ente:** Associazione non riconosciuta (predisposta per eventuale futura iscrizione al RUNTS).  
> **Due Dimensioni Distinte:** 1. Gestione della vita associativa democratica interna; 2. Portale vetrina neutrale per la visibilità delle attività dei soci.  
> **Destinazione Architetturale Ufficiale:** Piattaforma Web (React + TypeScript / Backend Node.js + TypeScript REST API) con prototipo Android intatto e funzionante.

---

## 🏛️ Principio Assoluto: Democraticità dell'Associazione

L'associazione deve essere e rimanere rigorosamente democratica:
- Il software è uno strumento al servizio dell'associazione e delle sue regole statutarie, non un'autorità sopra gli organi associativi.
- L'**Assemblea dei Soci** è l'organo sovrano che approva gli indirizzi ed elegge direttamente le cariche sociali.
- Il **Consiglio Direttivo** è l'organo collegiale esecutivo (con regole chiare di funzionamento: maggioranza dei presenti, voto dirimente del Presidente in parità, subentro graduato del primo dei non eletti, disciplina per la revoca).
- Nessun amministratore tecnico può sostituire o scavalcare una decisione dell'Assemblea o del Consiglio Direttivo.

---

## 🔍 Principio di Separazione tra Associazione e Attività Professionali

La piattaforma mantiene una netta e rigorosa separazione funzionale e giuridica:
1. L'associazione gestisce la propria vita associativa interna.
2. La piattaforma gestisce la pubblicazione delle schede secondo le regole stabilite.
3. Il professionista/attività rimane autonomo nella gestione della propria professione o impresa.
4. Il visitatore sceglie in piena autonomia se contattare l'attività.
5. **L'associazione NON è garante né intermediario commerciale:** non verifica la perizia professionale, non garantisce la qualità dei servizi, non certifica le attività né assume responsabilità contrattuali.
6. **Neutralità assoluta dell'interfaccia pubblica:** nella vetrina non vengono utilizzati badge, sigilli, bollini, icone di verifica, attestazioni di garanzia o diciture equivalenti.

### 🛡️ Regola Interna di Pubblicazione
> **Un'attività è potenzialmente pubblicabile nella vetrina SOLO se collegata a un SOCIO ATTIVO dell'associazione.**  
> Se il socio diviene non attivo (sospeso, moroso, receduto o escluso), l'attività viene automaticamente e istantaneamente oscurata dalla vetrina pubblica e dai risultati di ricerca. Tale condizione costituisce un requisito interno di ammissibilità statutaria, NON una certificazione pubblica.

---

## 🌟 Vetrina delle Attività dei Soci
- Consultazione pubblica neutrale di artigiani, professionisti e realtà del territorio.
- Ricerca libera per servizio, parola chiave e categorie merceologiche.
- Schede descrittive con contatti diretti, elenco servizi, orari e link social forniti dal titolare.
- Scheda trasparente con nota di autonomia e assenza di intermediazione commerciale.

---

## 📁 Documentazione Integrale di Progetto
La documentazione è parte integrante del progetto ed è consultabile sia nei file Markdown sottostanti sia direttamente all'interno dell'applicazione:

1. [Descrizione Generale del Progetto](docs/01_descrizione_generale.md)
2. [Specifica Funzionale](docs/02_specifica_funzionale.md)
3. [Architettura Tecnica](docs/03_architettura_tecnica.md)
4. [Infrastruttura e Rete](docs/04_infrastruttura_rete.md)
5. [Decisioni Progettuali (ADR)](docs/05_decisioni_progettuali.md)
6. [Regole dell'Associazione](docs/06_regole_associazione.md)
7. [Registro delle Modifiche (Changelog)](docs/07_registro_modifiche.md)
8. [Architettura Web e Flusso Dati](docs/ARCHITECTURE.md)

---

## 💻 Architettura del Codice
- **Piattaforma Web (Ufficiale Fase 3 Consolidata):**
  - **Backend (`/backend`):** Node.js + TypeScript REST API (Express), modelli di dominio, policy RBAC server-side, validazione severa input (`ActivityValidator`), doppio driver di persistenza (`DB_DRIVER=memory` e `DB_DRIVER=postgres` con migrazioni transazionali e pool), audit trail immutabile sulle mutazioni.
  - **Workflow Non Distruttivo di Revisione & Approvazione Presidenziale:**
    - La modifica di una scheda attività da parte del socio titolare (`PUT /api/activities/:id`) genera o aggiorna una revisione in stato `IN_ATTESA_APPROVAZIONE` senza sovrascrivere la scheda pubblicata live in vetrina.
    - Il **Presidente** autenticato e con stato associativo `ATTIVO` può consultare la coda delle revisioni pendenti (`GET /api/president/revisions/pending`), esaminare il dettaglio comparato con la scheda corrente (`GET /api/president/revisions/:id`), approvare la revisione pubblicando atomicamente le modifiche (`POST /api/president/revisions/:id/approve`) o rifiutarla con motivazione obbligatoria di almeno 10 caratteri (`POST /api/president/revisions/:id/reject`).
    - Prevenzione del conflitto di interessi: è vietata l'auto-approvazione e l'auto-rifiuto da parte del Presidente sulla propria scheda attività (`403 Forbidden`).
  - **Autenticazione & Sessioni Server-Side:**
    - Password hashing tramite algoritmo crittografico Scrypt (`node:crypto.scrypt`, salt CSPRNG 16 byte, parametri N=32768, r=8, p=1, keyLen=64, comparazione timing-safe).
    - Prevenzione dell'account enumeration su login (risposta generica 401 sia per credenziali errate sia per utente inesistente).
    - Politica di blocco account (account lockout: 5 tentativi consecutivi falliti determinano blocco temporaneo di 15 minuti, stato HTTP 423).
    - Gestione sessioni server-side: token raw casuale a 32 byte generato da CSPRNG, archiviato nel database unicamente tramite hash SHA-256 (nessun token o credenziale memorizzata in chiaro).
    - Gestione dei timeout: timeout per inattività di 30 minuti (rinnovato ad ogni richiesta valida) e timeout assoluto improrogabile di 8 ore.
    - Cookie di sessione `prolocal_session`: `HttpOnly: true`, `SameSite: 'lax'`, `Path: '/'`, `Max-Age: 28800` (8 ore), con attributo `secure: true` in ambiente di produzione.
    - Protezione CSRF: header obbligatorio `X-Requested-With: ProLocalApp` su tutte le richieste mutative (`POST`, `PUT`, `PATCH`, `DELETE`) effettuate con cookie di sessione; restituisce `403 Forbidden` in caso di violazione.
    - Rimozione Demo Auth: il precedente meccanismo transitorio basato su header (`X-Demo-Member-Id`, `X-Demo-Role`) è stato completamente rimosso dal runtime e dai contratti di servizio.
  - **Persistenza & Migrazioni PostgreSQL:**
    - Migrazioni transazionali DDL disponibili sia come file SQL fisici in `backend/src/db/migrations/` (`001_create_members.sql`, `002_create_business_activities.sql`, `003_create_audit_logs.sql`, `004_create_auth_tables.sql`, `005_create_activity_revisions_and_president.sql`) sia come stringhe nel runtime `migrator.ts`, con test automatizzato di coerenza semantica tra i due.
    - Separazione ontologica tra Identità Autenticabile (`UserAccount`) e Membro (`Member`), garantita da vincolo CHECK a livello database: `TECHNICAL_ADMIN` ha `member_id IS NULL`, `MEMBER` ha `member_id` obbligatorio e univoco; vincolo e indice parziale univoco per il ruolo direttivo `PRESIDENTE` su `members`.
  - **Servizio di Manutenzione Sessioni (`SessionCleanupService`):**
    - Esecuzione periodica automatica ogni 60 minuti tramite invocazione di `sessionRepo.deleteExpired()`.
    - Isolamento dei fallimenti (failure isolation): eventuali errori del database vengono registrati nel log senza arrestare il server HTTP né impedire i cicli successivi.
    - Integrazione nel lifecycle di avvio del server e arresto pulito (graceful shutdown) su segnali di terminazione `SIGTERM` e `SIGINT`.
  - **Frontend (`/frontend`):** React + TypeScript, interfaccia responsive e accessibile. Gestione autenticazione con `AuthContext` e hook `useAuth`, schermata di accesso protetta (`LoginView`), dashboard del socio (`MemberDashboardView`), gestione scheda attività (`ActivityEditView`), console separata per amministratore tecnico (`TechnicalAdminView`), client API configurato con `credentials: 'include'` e header CSRF automatico, gestione centralizzata della scadenza sessione (401), nota permanente di trasparenza (`LegalNotice`).
  - **Test Suite Automatizzata:** 204 test verificati e superati (175 test Backend su 11 file di test / 31 suite, 29 test Frontend su 3 suite, 0 falliti, 0 ignorati).
- **Prototipo Android/Kotlin (Preservato):**
  - **Linguaggio:** Kotlin
  - **Interfaccia Utente:** Jetpack Compose (Material Design 3, Responsive Multi-Device: Smartphone, Tablet, Desktop)
  - **Separazione dei Livelli:** Clean Architecture / MVVM
    - `com.example.core.model`: Entità e modelli di business
    - `com.example.core.data`: Repository contract e provider dati dimostrativi
    - `com.example.ui`: Schermate, componenti riutilizzabili e tema responsive
- **Dati:** Dati esclusivamente dimostrativi (nessun dato personale reale).
