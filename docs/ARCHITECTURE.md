# PRO-LOCAL ASSOCIATION - ARCHITETTURA TECNICA WEB (FASE 3 CONSOLIDATA)

## 1. Obiettivo Architetturale
Dalla Fase 2.2 in avanti, la **Piattaforma Web** (React + TypeScript / Node.js + TypeScript / REST API) costituisce la **destinazione architetturale ufficiale** di Pro-Local.
Il prototipo Android nativo (Kotlin + Jetpack Compose) è pienamente preservato nel repository come riferimento funzionale e non viene cancellato.

---

## 2. Catena delle Responsabilità (Request Flow)

Il flusso applicativo segue rigorosamente la separazione architetturale a livelli:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           1. BROWSER                                    │
│   Navigazione URL: /, /attivita/:id, /login, /socio, /socio/attivita    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Interazione Utente / HTTP Req
┌────────────────────────────────────▼────────────────────────────────────┐
│                    2. REACT FRONTEND (Client Untrusted)                 │
│   Componenti di Presentazione (ShowcaseView, Detail, Dashboard, Edit,   │
│                                LoginView, TechnicalAdminView)           │
│   - Gestione autenticazione reattiva con AuthContext / useAuth          │
│   - Client HTTP ProLocalApiClient con credentials: 'include'            │
│   - Emissione automatica header CSRF X-Requested-With: ProLocalApp      │
│   - Gestione centralizzata session expiration su 401                    │
│   - Disaccoppiamento legale e assenza di badge/bollini                  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ REST API (Cookie + CSRF Header)
┌────────────────────────────────────▼────────────────────────────────────┐
│                    3. REST API CONTROLLERS & MIDDLEWARE (Express)       │
│   Routing: /api/auth/*, /api/showcase, /api/activities/*,               │
│            /api/members/me, /api/health                                 │
│   - Middleware createAuthMiddleware: estrazione cookie prolocal_session │
│   - Verifica CSRF su richieste mutative (POST, PUT, PATCH, DELETE)      │
│   - Validazione rigorosa dell'input (ActivityValidator)                 │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ DTO / Command
┌────────────────────────────────────▼────────────────────────────────────┐
│                    4. APPLICATION & SECURITY SERVICES                   │
│   AuthService, SessionManager, SessionCleanupService,                   │
│   ShowcaseService, ActivityManagementService                            │
│   - Verifica password con Scrypt e timing-safe comparison               │
│   - Prevenzione enumeration e account lockout (5 fallimenti = 15 min)   │
│   - Lookup sessione via SHA-256 (idle 30m / absolute 8h)                │
│   - Risoluzione dinamica stato associativo da Member                    │
│   - Reset dello stato a IN_ATTESA_APPROVAZIONE in caso di modifica      │
│   - Cleanup periodico sessioni scadute ogni 60 minuti                   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Verifica Policy
┌────────────────────────────────────▼────────────────────────────────────┐
│                    5. DOMAIN POLICIES & GOVERNANCE                      │
│   AccessControlPolicy (RBAC + Ownership Enforcement)                    │
│   - Garanzia intangibilità poteri associativi                           │
│   - Divieto per l'Amministratore Tecnico di compiere atti associativi   │
│   - Regole di pubblicazione: stato PUBBLICATA && socio ATTIVO           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Interfaccia Repository
┌────────────────────────────────────▼────────────────────────────────────┐
│                    6. DATA ACCESS LAYER                                 │
│   IMemberRepository, IBusinessActivityRepository,                       │
│   IAuditLogRepository, IUserAccountRepository, ISessionRepository       │
│   - Driver PostgreSQL (pool, migrazioni 001–004, transazioni)          │
│   - Driver In-Memory (per test unitari isolati)                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Specifiche delle REST API

Tutti gli endpoint rispondono con intestazioni `Content-Type: application/json; charset=utf-8` e gestiscono CORS.

### 3.1 Autenticazione e Sessioni
- **`POST /api/auth/login`**
  - **Descrizione:** Autenticazione utente con email e password.
  - **Comportamento di Sicurezza:** Verifica password con Scrypt, protezione anti-enumeration (401 neutro su credenziali errate o utente non trovato), blocco account dopo 5 tentativi consecutivi (423 Locked con indicazione di `lockedUntil`), emissione cookie `prolocal_session` con flag `HttpOnly`.
  - **Risposta:** `200 OK` con dettagli utente e ruolo, oppure `400`, `401`, `403`, `423`, `500`.

- **`POST /api/auth/logout`**
  - **Descrizione:** Revoca immediata della sessione attiva.
  - **Comportamento di Sicurezza:** Richiede header `X-Requested-With: ProLocalApp` se invocato con cookie. Rimuove la sessione dal database e cancella il cookie sul client. Idempotente.
  - **Risposta:** `200 OK` (`messaggio: "Logout effettuato con successo"`), oppure `403`, `500`.

- **`GET /api/auth/me`**
  - **Descrizione:** Verifica della sessione attiva e recupero dell'identità dell'attore.
  - **Risposta:** `200 OK` con dati profilo sicuro e ruolo, oppure `401 Unauthorized` se sessione assente o scaduta.

### 3.2 Vetrina Pubblica
- **`GET /api/showcase`**
  - **Descrizione:** Elenco pubblico delle schede attività approvate.
  - **Criterio di Dominio:** Restituisce unicamente attività con `statoPubblicazione == 'PUBBLICATA'` e socio titolare con `statoAssociativo == 'ATTIVO'`.
  - **Filtro Privacy:** I dati personali e statutari del socio non sono esposti; include il blocco di trasparenza e disaccoppiamento legale.
  - **Risposta:** `200 OK` con array di `PublicActivityDto`.

### 3.3 Dettaglio Scheda Attività
- **`GET /api/activities/:id`**
  - **Descrizione:** Dettaglio completo per consultazione pubblica della singola scheda.
  - **Regola di Sicurezza:** Se la scheda non esiste, o se appartiene a un socio non `ATTIVO`, o se ha stato diverso da `PUBBLICATA`, risponde invariabilmente con `404 Not Found` per impedire enumeration o leak informativo.
  - **Risposta:** `200 OK` con `PublicActivityDto` oppure `404 Not Found`.

### 3.4 Area Socio (Profilo Personale)
- **`GET /api/members/me`**
  - **Descrizione:** Dati anagrafici associativi del socio autenticato e scheda attività collegata.
  - **Autenticazione / Autorizzazione:** Richiede cookie di sessione valido appartenente a un utente di tipo `MEMBER`. Se l'attore è `TECHNICAL_ADMIN`, risponde con `403 Forbidden`. Se non autenticato, risponde con `401 Unauthorized`.
  - **Risposta:** `200 OK` con profilo socio, stato associativo e scheda attività.

### 3.5 Modifica Scheda Attività
- **`PUT /api/activities/:id`**
  - **Descrizione:** Aggiornamento della scheda da parte del socio titolare.
  - **Autenticazione / Autorizzazione / CSRF:**
    - Cookie di sessione valido (ruolo `SOCIO`).
    - Header obbligatorio `X-Requested-With: ProLocalApp`.
  - **Controlli Server-Side (AccessControlPolicy & ActivityManagementService):**
    1. **Verifica Ruolo:** Se l'attore è `AMMINISTRATORE_TECNICO`, la richiesta è respinta con `403 Forbidden`.
    2. **Verifica Ownership:** Se l'attore è `SOCIO` ma non è il titolare della scheda (`activity.memberId !== actorMemberId`), la richiesta è respinta con `403 Forbidden`.
    3. **Validazione Input:** I dati sono convalidati tramite `ActivityValidator` (lunghezze minime/massime, campi obbligatori, array servizi non vuoto). Se non validi: `400 Bad Request`.
    4. **Workflow Ripubblicazione:** L'aggiornamento imposta tassativamente `statoPubblicazione = IN_ATTESA_APPROVAZIONE`. La scheda non sarà visibile nella vetrina pubblica fino alla nuova approvazione statutaria.
  - **Risposta:** `200 OK` con scheda aggiornata e messaggio di workflow.

---

## 4. Modello di Autorizzazione e RBAC

Il sistema applica il principio di **autorizzazione centralizzata server-side**:

1. **`AccessControlPolicy`:** Unica autorità per stabilire se una coppia `(Ruolo, AzioneDiSistema)` è lecita.
2. **Ruolo `AMMINISTRATORE_TECNICO`:**
   - Ha esclusivamente permessi tecnici: consultazione diagnostica, audit log di sistema, configurazione infrastrutturale.
   - **Divieti Assoluti:**
     - Non può ammettere soci.
     - Non può sospendere o escludere soci.
     - Non può modificare lo stato associativo.
     - Non può eleggere o revocare consiglieri.
     - Non può modificare regole o statuto.
     - Non può forzare la pubblicazione di attività in vetrina.
     - Non può modificare le schede attività dei soci.
3. **Ruolo `SOCIO`:**
   - Può consultare il proprio profilo e stato associativo.
   - Può visualizzare e modificare **esclusivamente** la propria attività (`Ownership Rule`).
   - Non può modificare schede di altri soci.
   - Non può deliberare ammissioni/esclusioni.

---

## 5. Stato dei Componenti del Progetto

| Componente | Tecnologia | Stato Attuale | Note |
|---|---|---|---|
| **Web REST Backend** | Node.js + Express + TypeScript | **Operativo (Fase 3 Consolidata)** | 122 test di sicurezza, RBAC, Scrypt, sessioni, migrazioni PG e cleanup verdi. |
| **Web Frontend** | React 18/19 + TypeScript | **Operativo (Fase 3 Consolidata)** | Vetrina pubblica, login con credenziali, area socio protetta, CSRF, 29 test di integrazione e rendering verdi. |
| **Persistenza Dati** | PostgreSQL (001–004) & In-Memory | **Operativo (Fase 3 Consolidata)** | Migrazioni DDL transazionali, connection pool e pulizia periodica automatica (SessionCleanupService). |
| **Prototipo Mobile** | Android / Kotlin / Jetpack Compose | **Preservato e Integro** | Prototipo autonomo preservato nella directory `/app`. |
| **Governance & Statuto** | Domain Policies & Types | **Conforme** | Voci `[DA DEFINIRE]` preservate; nessun potere associativo all'amministratore tecnico; nessun badge/certificazione. |

---

## 6. Verifica e Regression Testing
- Suite test completa del progetto: `npm test` (151 passing).
  - Test Backend & RBAC: `npm run test:backend` (122 passing).
  - Test Frontend & Components: `npm run test:frontend` (29 passing).
