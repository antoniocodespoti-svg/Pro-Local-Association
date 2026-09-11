# PRO-LOCAL ASSOCIATION - ARCHITETTURA TECNICA WEB (FASE 2.2)

## 1. Obiettivo Architetturale
Dalla Fase 2.2, la **Piattaforma Web** (React + TypeScript / Node.js + TypeScript / REST API) costituisce la **destinazione architetturale ufficiale** di Pro-Local.
Il prototipo Android nativo (Kotlin + Jetpack Compose) è pienamente preservato nel repository come riferimento funzionale e non viene cancellato.

---

## 2. Catena delle Responsabilità (Request Flow)

Il flusso applicativo segue rigorosamente la separazione architetturale a livelli:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           1. BROWSER                                    │
│   Navigazione URL: /, /attivita/:id, /socio, /socio/attivita            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Interazione Utente / HTTP Req
┌────────────────────────────────────▼────────────────────────────────────┐
│                    2. REACT FRONTEND (Client Untrusted)                 │
│   Componenti di Presentazione (ShowcaseView, Detail, Dashboard, Edit)   │
│   - Nessuna logica di autorizzazione o calcolo di visibilità            │
│   - Disaccoppiamento legale e assenza di badge/bollini                  │
│   - Client HTTP ProLocalApiClient con header demo                       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ REST API (fetch HTTP JSON)
┌────────────────────────────────────▼────────────────────────────────────┐
│                    3. REST API CONTROLLERS (Express)                    │
│   Routing: /api/showcase, /api/activities/:id, /api/members/me          │
│   - Validazione rigorosa dell'input (ActivityValidator)                 │
│   - Estrazione contesto attore (X-Demo-Member-Id, X-Demo-Role)          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ DTO / Command
┌────────────────────────────────────▼────────────────────────────────────┐
│                    4. APPLICATION SERVICES                              │
│   ShowcaseService, ActivityManagementService, MemberService             │
│   - Coordinamento use-case e orchestrazione dei workflow                │
│   - Reset dello stato a IN_ATTESA_APPROVAZIONE in caso di modifica       │
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
│                    6. DATA ACCESS LAYER (In-Memory)                     │
│   IMemberRepository, IBusinessActivityRepository                        │
│   - Strutture in-memory controllate per la Fase 2.2                     │
│   - Transizione futura a PostgreSQL senza impatto sul dominio           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Specifiche delle REST API

Tutti gli endpoint rispondono con intestazioni `Content-Type: application/json; charset=utf-8` e gestiscono CORS.

### 3.1 Vetrina Pubblica
- **`GET /api/showcase`**
  - **Descrizione:** Elenco pubblico delle schede attività approvate.
  - **Criterio di Dominio:** Restituisce unicamente attività con `statoPubblicazione == 'PUBBLICATA'` e socio titolare con `statoAssociativo == 'ATTIVO'`.
  - **Filtro Privacy:** I dati personali e statutari del socio non sono esposti; include il blocco di trasparenza e disaccoppiamento legale.
  - **Risposta:** `200 OK` con array di `PublicActivityDto`.

### 3.2 Dettaglio Scheda Attività
- **`GET /api/activities/:id`**
  - **Descrizione:** Dettaglio completo per consultazione pubblica della singola scheda.
  - **Regola di Sicurezza:** Se la scheda non esiste, o se appartiene a un socio non `ATTIVO`, o se ha stato diverso da `PUBBLICATA`, risponde invariabilmente con `404 Not Found` per impedire enumeration o leak informativo.
  - **Risposta:** `200 OK` con `PublicActivityDto` oppure `404 Not Found`.

### 3.3 Area Socio (Profilo Personale)
- **`GET /api/members/me`**
  - **Descrizione:** Dati anagrafici associativi del socio autenticato e scheda attività collegata.
  - **Autenticazione:** Header `X-Demo-Member-Id` (Default: `socio-01`).
  - **Risposta:** `200 OK` con profilo socio, stato associativo, stato della scheda, nota di collaudo demo. Se l'id non esiste, `404 Not Found`.

### 3.4 Modifica Scheda Attività
- **`PUT /api/activities/:id`**
  - **Descrizione:** Aggiornamento della scheda da parte del socio titolare.
  - **Autenticazione / Autorizzazione:**
    - `X-Demo-Member-Id`: ID del socio richiedente.
    - `X-Demo-Role`: `SOCIO`.
  - **Controlli Server-Side (AccessControlPolicy & ActivityManagementService):**
    1. **Verifica Ruolo:** Se l'attore è `AMMINISTRATORE_TECNICO`, la richiesta è respinta con `403 Forbidden` (l'amministratore tecnico non ha facoltà di modificare i dati delle attività dei soci).
    2. **Verifica Ownership:** Se l'attore è `SOCIO` ma non è il titolare della scheda (`activity.memberId !== actorMemberId`), la richiesta è respinta con `403 Forbidden`.
    3. **Validazione Input:** I dati sono convalidati tramite `ActivityValidator` (lunghezze minime/massime, campi obbligatori, array servizi non vuoto). Se non validi: `400 Bad Request`.
    4. **Workflow Ripubblicazione:** L'aggiornamento imposta tassativamente `statoPubblicazione = IN_ATTESA_APPROVAZIONE`. La scheda non sarà più visibile nella vetrina pubblica fino alla nuova approvazione statutaria.
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

## 5. Meccanismo di Autenticazione Demo (`X-Demo-Member-Id`)

> [!CAUTION]
> **AVVISO DI SICUREZZA:** Il meccanismo di autenticazione basato sull'header HTTP `X-Demo-Member-Id` è **esclusivamente uno strumento di collaudo per la Fase 2.2**.
> **NON È UN'AUTENTICAZIONE DI PRODUZIONE.**
> Nelle fasi successive, questo meccanismo sarà sostituito da un'infrastruttura di autenticazione standardizzata con sessioni sicure HTTP-only / token JWT crittografici conformi alle linee guida di sicurezza applicativa.

---

## 6. Stato dei Componenti del Progetto

| Componente | Tecnologia | Stato Attuale | Note |
|---|---|---|---|
| **Web REST Backend** | Node.js + Express + TypeScript | **Operativo (Fase 2.2)** | 31 test di sicurezza, RBAC e integrazione HTTP verdi. |
| **Web Frontend** | React 18/19 + TypeScript | **Operativo (Fase 2.2)** | Vetrina pubblica, navigazione browser, area socio, modifica scheda, 12 test di integrazione e rendering verdi. |
| **Persistenza Dati** | In-Memory Repositories | **Operativo (Fase 2.2)** | PostgreSQL è escluso per ora e predisposto per fasi successive. |
| **Prototipo Mobile** | Android / Kotlin / Jetpack Compose | **Preservato e Integro** | 33 test unitari/Robolectric verdi; non cancellato. |
| **Governance & Statuto** | Domain Policies & Types | **Conforme** | Voci `[DA DEFINIRE]` preservate; nessun potere associativo all'amministratore tecnico; nessun badge/certificazione. |

---

## 7. Verifica e Regression Testing
- Test suite Backend & RBAC: `npm run test:backend` (31 passing).
- Test suite Frontend & SSR Components: `npm run test:frontend` (12 passing).
- Regression suite Prototipo Android: `gradle :app:testDebugUnitTest` (33 passing).
