# Pro-Local - Documentazione di Progetto
## 03. Architettura Tecnica

### 3.1 Pattern Architetturale Complessivo
L'applicazione è strutturata secondo il principio di **Separazione delle Responsabilità** (SoC - Separation of Concerns), implementando un'architettura a livelli (Clean Architecture / Domain-Driven Design / MVVM):

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       PRESENTATION LAYER (UI)                           │
│   Web: React + TypeScript (SPA, AuthContext, Responsive Layouts)        │
│   Mobile: Jetpack Compose (Prototipo Android M3 preservato nel repo)    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP JSON Fetch (Cookie + CSRF)
┌────────────────────────────────────▼────────────────────────────────────┐
│                    APPLICATION & SECURITY LAYER                         │
│   REST API Controllers (Express app.ts), Auth Middleware (Cookie/CSRF)  │
│   AuthService, SessionManager, SessionCleanupService, ShowcaseService   │
│   ActivityManagementService, ActivityValidator                          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Regole e autorizzazioni
┌────────────────────────────────────▼────────────────────────────────────┐
│                   DOMAIN & BUSINESS RULES LAYER                         │
│   Entità: UserAccount, Session, Member, BusinessActivity, AuditLogEntry │
│   Policies: AccessControlPolicy (RBAC + Ownership Enforcement)           │
│   Regole di Visibilità Vetrina, Democraticità statutaria                │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Repository Contracts
┌────────────────────────────────────▼────────────────────────────────────┐
│                         DATA ACCESS LAYER                               │
│   Interfacce: IMemberRepo, IActivityRepo, IAuditRepo, IUserAccountRepo, │
│               ISessionRepo                                              │
│   Driver: PostgreSQL (pool, migrazioni transazionali 001–004)           │
│           In-Memory (strutture isolate per test rapidi)                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Piattaforma Web Ufficiale e Catena Operativa (Request Flow)

La catena operativa browser-backend per la piattaforma Web ufficiale è così articolata:

```
Browser (React Single Page: /, /attivita/:id, /login, /socio, /socio/attivita)
  ↓
React / AuthContext (Hook useAuth, gestione reattiva dello stato autenticato)
  ↓
API Client (apiClient.ts con credentials: 'include')
  ↓ Richiesta HTTP (Cookie HttpOnly prolocal_session + Header CSRF X-Requested-With: ProLocalApp)
Express Web Server (/backend/src/app.ts)
  ↓
Middleware di Autenticazione & CSRF (createAuthMiddleware)
  - Estrazione e verifica cookie di sessione
  - Verifica obbligatoria header X-Requested-With su metodi mutativi (POST, PUT, PATCH, DELETE)
  ↓
AuthService & SessionManager
  - Lookup della sessione tramite hash SHA-256 del token raw
  - Verifica idle timeout (30 min) e absolute timeout (8 ore)
  - Risoluzione dinamica dell'attore (lettura ruoli e stato associativo da Member)
  ↓
Application Services (ShowcaseService, ActivityManagementService)
  - Validazione input (ActivityValidator)
  - Verifica delle regole di ownership (actorMemberId == activity.memberId)
  - Reset dello stato scheda a IN_ATTESA_APPROVAZIONE in caso di modifica
  ↓
Domain Policies & Governance (AccessControlPolicy)
  - Inibizione categorica di atti associativi per l'Amministratore Tecnico
  - Ammissibilità in vetrina vincolata a scheda PUBBLICATA e socio ATTIVO
  ↓
Data Access Layer (PostgreSQL / In-Memory)
  - Esecuzione query / transazioni relazionali
  - AuditLog immutabile (audit_logs)
```

---

### 3.3 Gestione della Sicurezza, Autenticazione e Privacy

1. **Autenticazione a Sessioni Server-Side (Nessun utilizzo di JWT):**
   - L'applicazione non utilizza JSON Web Token (JWT) stateless, ma sessioni server-side con stato controllato sul database.
   - All'atto del login (`POST /api/auth/login`), la password viene verificata tramite l'algoritmo **Scrypt** (`node:crypto.scrypt`) con parametri crittografici conformi (N=32768, r=8, p=1, keyLen=64, salt CSPRNG a 16 byte) e comparazione timing-safe (`crypto.timingSafeEqual`).
   - La risposta a credenziali errate o utente inesistente è un errore 401 neutro (*"Credenziali non valide"*), a prevenzione dell'user enumeration.
   - Dopo 5 tentativi falliti consecutivi scatta il blocco temporaneo dell'account (lockout di 15 minuti, stato HTTP 423).
   - A login avvenuto, viene generato un token di sessione raw casuale a 32 byte (CSPRNG, 64 caratteri hex). Nel database viene archiviato unicamente il suo digest crittografico **SHA-256**.
   - Il token raw viene trasmesso al client esclusivamente tramite cookie HTTP `prolocal_session`:
     - `HttpOnly: true` (inaccessibile da script JavaScript, protezione XSS);
     - `SameSite: 'lax'` (protezione da richieste cross-site);
     - `Path: '/'`;
     - `Max-Age: 28800` (8 ore);
     - `Secure: true` in ambiente di produzione (`NODE_ENV === 'production'`).
   - **Timeout di Sessione:**
     - *Inattività (Idle Timeout):* 30 minuti. Il campo `last_accessed_at` viene rinnovato ad ogni richiesta autenticata lecita.
     - *Scadenza Assoluta (Absolute Timeout):* 8 ore dalla creazione, non estendibile.
   - **Logout e Revoca:** L'endpoint `POST /api/auth/logout` revoca la sessione cancellandola dal repository ed eliminando il cookie dal client.
   - **Precedente Demo Auth:** Il meccanismo transitorio di collaudo basato sugli header `X-Demo-Member-Id` e `X-Demo-Role` è stato integralmente dismesso e rimosso dal codice.

2. **Protezione Cross-Site Request Forgery (CSRF):**
   - Tutte le richieste HTTP che mutano lo stato (`POST`, `PUT`, `PATCH`, `DELETE`) effettuate con un cookie di sessione autenticato valido devono includere l'header personalizzato `X-Requested-With: ProLocalApp`.
   - In caso di assenza o valore difforme, il middleware restituisce immediatamente `403 Forbidden` (`Protezione CSRF violata`), impedendo attacchi cross-origin orchestrati tramite form HTML standard.

3. **Separazione Ontologica UserAccount / Member e Modello RBAC:**
   - L'identità autenticabile (`UserAccount`) è formalmente distinta dal profilo associativo (`Member`).
   - Nel database PostgreSQL, la tabella `user_accounts` impone un vincolo `CHECK (chk_actor_type_member)`:
     - Se `actor_type = 'TECHNICAL_ADMIN'`, allora `member_id IS NULL`.
     - Se `actor_type = 'MEMBER'`, allora `member_id` è obbligatorio, non nullo e univoco (`UNIQUE(member_id)`).
   - L'Amministratore Tecnico (`TECHNICAL_ADMIN` / `AMMINISTRATORE_TECNICO`) non ha un record socio collegato (`memberId = null`), non può accedere a `GET /api/members/me` (403), non può possedere né modificare schede attività (403) e ha accesso solo alla propria console tecnica (`TechnicalAdminView`).
   - Per gli utenti di tipo `MEMBER`, ruolo e stato associativo non sono salvati staticamente nella sessione, ma vengono risolti dinamicamente dal database ad ogni richiesta.

4. **Principio di Democraticità Associativa:**
   - La gerarchia del software rispecchia lo statuto: l'Assemblea dei Soci è l'organo sovrano, il Consiglio Direttivo l'organo esecutivo collegiale. I ruoli tecnici hanno funzioni puramente manutentive e non possono scavalcare le delibere degli organi associativi.

5. **Neutralità della Vetrina Pubblica (No Certificazioni):**
   - La vetrina (`/`) espone esclusivamente schede in stato `PUBBLICATA` appartenenti a soci in stato associativo `ATTIVO`.
   - Se il socio diviene non attivo (sospeso, moroso, receduto o escluso), la scheda scompare istantaneamente dalla vetrina pubblica e `GET /api/activities/:id` risponde con `404 Not Found` per impedire bypass.
   - L'interfaccia non include badge, bollini di garanzia o attestazioni ingannevoli; include in modo permanente la nota di trasparenza (`LegalNotice`).

---

### 3.4 Persistenza Dati e Sistema di Migrazioni

Il backend supporta due driver di persistenza configurabili tramite la variabile d'ambiente `DB_DRIVER`:
- `DB_DRIVER=memory`: Driver in-memory per test unitari e ambienti isolati.
- `DB_DRIVER=postgres`: Driver PostgreSQL con connection pool (`pg.Pool`), transazioni con rollback automatico in caso di errore e tracking delle migrazioni.

#### Migrazioni DDL Transazionali (001–004)
Le migrazioni dello schema sono gestite dal componente `DatabaseMigrator`:
- `001_create_members.sql`: Tabella `members` con vincoli di stato associativo (`IN_ATTESA`, `ATTIVO`, `SOSPESO`, `RECEDUTO`, `ESCLUSO`) e indici.
- `002_create_business_activities.sql`: Tabella `business_activities` con relazione 1:N verso `members`, foreign key protetta (`ON DELETE RESTRICT`) e indici.
- `003_create_audit_logs.sql`: Tabella `audit_logs` append-only per tracciamento delle mutazioni di sicurezza.
- `004_create_auth_tables.sql`: Tabelle `user_accounts` e `sessions`. Include indici su email, member_id, user_id, expires_at, foreign key in cascade per le sessioni e vincolo CHECK di separazione ontologica.

*Nota di Coerenza:* Le definizioni DDL risiedono come file SQL fisici in `backend/src/db/migrations/` e come definizioni runtime all'interno dell'array `MIGRATIONS` in `backend/src/db/migrator.ts`. La conformità e l'equivalenza semantica tra i due formati sono rigorosamente verificate tramite test automatizzato.

---

### 3.5 Servizio di Pulizia Sessioni Scadute (`SessionCleanupService`)

Per prevenire l'accumulo di record obsoleti nella tabella `sessions` di PostgreSQL:
- Il servizio `SessionCleanupService` viene inizializzato all'avvio del server in `src/index.ts`.
- Esegue un ciclo periodico ogni **60 minuti** invocando `sessionRepo.deleteExpired()`.
- **Isolamento dei Fallimenti (Failure Isolation):** Eventuali errori riscontrati durante il cleanup (es. disconnessioni di rete) vengono intercettati e registrati nel log senza causare il crash del server HTTP né bloccare i cicli successivi.
- **Graceful Shutdown:** All'intercettazione dei segnali `SIGTERM` o `SIGINT`, il timer viene interrotto (`cleanupService.stop()`) prima della chiusura del server HTTP.

---

### 3.6 Prototipo Android / Kotlin (Preservato)

Il prototipo mobile nativo sviluppato in Kotlin e Jetpack Compose rimane preservato nella cartella `/app` come riferimento funzionale:
- Modelli in `com.example.core.model` e repository demo in `com.example.core.data`.
- Interfaccia Jetpack Compose con Material Design 3 in `com.example.ui`.
- Non comunica direttamente con le API REST attuali, ma opera in modalità dimostrativa autonoma.
