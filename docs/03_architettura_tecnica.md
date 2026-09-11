# Pro-Local - Documentazione di Progetto
## 03. Architettura Tecnica

### 3.1 Pattern Architetturale Complessivo
L'applicazione è strutturata secondo il principio di **Separazione delle Responsabilità** (SoC - Separation of Concerns), implementando un'architettura a livelli (Clean Architecture / MVVM):

```
┌─────────────────────────────────────────────────────────┐
│               PRESENTATION LAYER (UI)                   │
│   Jetpack Compose / Web Adaptive Layouts / Theme M3     │
│   DashboardScreen, CouncilScreen, ModulesScreen, Docs   │
└────────────────────────────┬────────────────────────────┘
                             │ StateFlow & UI Actions
┌────────────────────────────▼────────────────────────────┐
│              DOMAIN & BUSINESS RULES LAYER              │
│   Entities, Regole del Consiglio, Modelli di Sicurezza  │
│   CouncilRuleEngine, AuditLog, Validation               │
└────────────────────────────┬────────────────────────────┘
                             │ Repository Contracts
┌────────────────────────────▼────────────────────────────┐
│                    DATA LAYER                           │
│   ProLocalRepository (Interfaccia astratta)             │
│   ├── DemoProLocalRepository (Attuale: In-Memory Mock)  │
│   └── Room / SQL / REST API (Predisposto per il futuro) │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Modularità dei Componenti
1. **Core Domain (`com.example.core.model`):**
   - Modelli puri Kotlin indipendenti da framework di persistenza o UI.
   - Entità Governance: `CouncilMember`, `InternalRole`, `CouncilResolution`, `AssociationStatus`, `AuditLogEntry`, `ProjectModule`.
   - Entità Vetrina e Soci: `Member` (stato associativo, quota), `BusinessActivity` (scheda attività economica, recapiti, servizi, stato pubblicazione), `ActivityCategory`, `PublicationStatus`, `MembershipStatus`.
2. **Data Layer Abstraction (`com.example.core.data`):**
   - L'interfaccia `ProLocalRepository` espone flussi reattivi (`StateFlow` / `Flow` per `members`, `activities`, `councilMembers`, `councilResolutions`, `auditLogs`).
   - L'implementazione attuale `DemoProLocalRepository` fornisce dati dimostrativi controllati con aggiornamento reattivo di stato.
   - La regola di visibilità fondamentale è incapsulata a livello di dominio (`BusinessActivity.isVisibileInVetrina(memberStatus)`) e valutata in tempo reale.
   - La migrazione a un database SQLite/Room o API REST non richiederà modifiche alla UI o alla logica di business.
3. **Presentation Layer (`com.example.ui`):**
   - Modulo Vetrina (`com.example.ui.showcase`): `ShowcaseScreen`, `ActivityDetailSheet`, filtri settoriali e geografici.
   - Modulo Area Socio (`com.example.ui.member`): `MemberAreaScreen`, compilatore scheda attività, selettore persona demo.
   - Modulo Amministrazione (`com.example.ui.admin`): `ShowcaseAdminScreen`, coda di revisione pubblicazioni, gestione libro soci in tempo reale, RBAC matrix, audit log.
   - Moduli Istituzionali: `CouncilScreen`, `DashboardScreen`, `ProjectDocsScreen`, `ModularPlaceholdersScreen`.
   - Layout responsive adattivo (compatto per smartphone con NavigationBar, medio/espanso per tablet e desktop con NavigationRail permanente).

### 3.3 Gestione della Sicurezza, Democraticità e Privacy
- **Principio di Democraticità Associativa:** La gerarchia del software rispecchia lo statuto: l'Assemblea dei Soci è l'organo sovrano, il Consiglio Direttivo l'organo esecutivo collegiale. I ruoli tecnici (amministratore di sistema/software) hanno funzioni puramente ausiliarie e di manutenzione, senza alcun potere decisionale o di veto sulle delibere degli organi democratici.
- **Separazione Assoluta Associazione / Attività:** Architettura disaccoppiata. La piattaforma fornisce unicamente l'infrastruttura tecnologica per la visibilità autonoma delle attività dei soci. Nessun dato o flusso prevede intermediazioni di pagamento, rilascio di certificazioni professionali o garanzie contrattuali. L'interfaccia esclude badge o sigilli di garanzia.
- **Separazione tra dati anagrafici e trasparenza:** Trattamento dati conforme al GDPR, con visibilità minima e tutela dei recapiti personali rispetto ai recapiti professionali pubblici.
- **Audit Log Istituzionale:** Tracciamento delle azioni rilevanti tramite modello immutabile `AuditLogEntry` con timestamp, operatore e livello di severità.
- **Modello di controllo accessi (RBAC):** Predisposto per token JWT o sessioni server-side sicure in fase di pubblicazione online.

### 3.4 Architettura Target Web Platform (Fase 2.1+)
Il progetto è ora ufficialmente indirizzato verso una piattaforma Web completa, mantenendo intatto e funzionante il prototipo Android di riferimento.

```
Browser
  ↓
Frontend Web (React + TypeScript in /frontend)
  ↓
REST API (JSON Contracts)
  ↓
Backend (Node.js + TypeScript in /backend)
  ↓
Domain / Application Policies (AccessControlPolicy, ShowcaseVisibility)
  ↓
Repositories (IMemberRepository, IBusinessActivityRepository)
  ↓
Database (PostgreSQL / Relazionale)
```

1. **La UI non è un confine di sicurezza:** Tutta la validazione dei permessi (RBAC), la verifica di ownership e il filtro di visibilità vetrina sono tassativamente eseguiti lato backend prima della serializzazione dei dati.
2. **Backend Domain Layer (`/backend/src/domain`):** Modelli indipendenti, tipizzazione rigorosa e policies pure testabili in isolamento con test runner nativo Node.js.
3. **Frontend Presentation Layer (`/frontend/src`):** Componenti React privi di qualsiasi logica autorizzativa o badge di certificazione, corredati da banner permanente di trasparenza e autonomia associativa.

### 3.5 Implementazione REST API Server & Flusso Operativo (Fase 2.2)
La catena operativa browser-backend è ora attiva con server REST Express:

```
Browser (React Single Page Views: /, /attivita/:id, /socio, /socio/attivita)
  ↓ HTTP JSON Fetch (Headers: X-Demo-Member-Id, Content-Type: application/json)
REST API Server (Express in /backend/src/app.ts)
  ↓ ActivityValidator (Validazione server-side, lunghezze, email/url format)
Application Services (ShowcaseService, ActivityManagementService)
  ↓ AccessControlPolicy (Verifica ownership socio e visibilità vetrina)
In-Memory Repositories (InMemoryMemberRepository, InMemoryBusinessActivityRepository)
```

- **Enforcement di Sicurezza Server-Side:** Il client React invia l'intento di modifica; il server verifica che `actorRole == SOCIO` e `activity.memberId == actorMemberId`. In caso contrario, risponde con `403 Forbidden`.
- **Nessun Bypass Vetrina:** L'endpoint `GET /api/activities/:id` applica `isActivityPubliclyVisible` e risponde con `404` se l'attività è in bozza o il socio non è attivo.
- **Autenticazione DEMO:** Header esplicito `X-Demo-Member-Id` per la simulazione del socio in questa fase; l'autenticazione con sessioni crittografiche sicure e password hashing è demandata alle fasi successive.
- **Stato Database:** I dati risiedono nelle istanze dimostrative in-memory; PostgreSQL non è ancora configurato come repository operativo.


