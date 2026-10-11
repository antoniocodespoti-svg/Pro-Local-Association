# Pro-Local Backend API & Domain Layer (Node.js + TypeScript)

Server REST API HTTP, modelli di dominio associativo, autenticazione basata su sessioni e persistenza dati per la piattaforma Pro-Local.

## Principi Architetturali

1. **Subordinazione del Ruolo Tecnico:** L'Amministratore Tecnico ha permessi strettamente limitati a operazioni di manutenzione, diagnostica, log e configurazione tecnica. Tutte le operazioni associative e di status (ammissione, sospensione, esclusione, modifiche statutarie, elezioni, delibere, forzatura vetrina, modifica schede soci) sono categoricamente inibite.
2. **Controllo Accessi e Ownership:** Un socio può modificare solo ed esclusivamente la propria attività (`activity.memberId == actorMemberId`). È preclusa la modifica di schede altrui. L'amministratore tecnico non ha titolo per intervenire sulle schede commerciali dei soci.
3. **Regola Vetrina di Dominio:** Un'attività è pubblicamente visibile se e solo se la scheda è in stato `PUBBLICATA` e il socio titolare è in stato `ATTIVO`. Stati come `IN_ATTESA`, `SOSPESO`, `RECEDUTO` o `ESCLUSO` comportano l'oscuramento immediato e totale sia dalla vetrina (`GET /api/showcase`) che dall'endpoint di dettaglio (`GET /api/activities/:id` restituisce 404 per evitare bypass).
4. **Indipendenza dalla UI:** Le regole di sicurezza, autorizzazione (RBAC) e ammissibilità risiedono nel layer `domain/policies/` e nei servizi applicativi, non nel client.
5. **Autenticazione Reale a Sessione (Fase 3):** Superamento del precedente meccanismo di collaudo demo (gli header `X-Demo-Member-Id` e `X-Demo-Role` sono stati completamente rimossi). L'autenticazione è gestita server-side tramite credenziali email/password, hash crittografico Scrypt, token casuali CSPRNG archiviati nel database come digest SHA-256 e cookie HTTP `prolocal_session` con flag `HttpOnly`.
6. **Protezione CSRF:** Sulle richieste HTTP mutative (`POST`, `PUT`, `PATCH`, `DELETE`) effettuate con sessione autenticata viene imposta la presenza dell'header personalizzato `X-Requested-With: ProLocalApp`.
7. **Doppio Driver di Persistenza:** Astrazione completa tramite repository pattern con supporto per driver in-memory (`DB_DRIVER=memory`) e driver PostgreSQL relazionale (`DB_DRIVER=postgres`) con pool di connessioni, transazioni e migrazioni DDL.

---

## Endpoints REST API

| Metodo | Path | Tipo | Autenticazione & Autorizzazione | CSRF | Descrizione & Status Codes |
|---|---|---|---|---|---|
| `POST` | `/api/auth/login` | Pubblico | Nessuna autenticazione richiesta | Non applicato | Autentica l'utente con email e password. Prevenzione user enumeration (401 neutro) e blocco account dopo 5 fallimenti consecutivi (423). Rilascia cookie `prolocal_session`. (`200`, `400`, `401`, `403`, `423`, `500`) |
| `POST` | `/api/auth/logout` | Privato | Sessione attiva (cookie `prolocal_session`) | Obbligatorio se con sessione | Revoca immediata della sessione sul database e cancellazione del cookie client. Idempotente. (`200`, `403`, `500`) |
| `GET` | `/api/auth/me` | Privato | Sessione attiva (cookie `prolocal_session`) | No (lettura safe) | Restituisce lo stato dell'attore autenticato e il ruolo associativo. 401 se non autenticato o sessione scaduta. (`200`, `401`, `500`) |
| `GET` | `/api/members/me` | Privato | Sessione attiva, solo ruolo `MEMBER` (`SOCIO` / `PRESIDENTE`) | No (lettura safe) | Restituisce il profilo del socio, la scheda attività pubblicata/corrente, l'eventuale `revisionePendente`, `ultimaRevisione` e lo storico `revisioniPerAttivita`. 403 Forbidden se invocato da `TECHNICAL_ADMIN`. (`200`, `401`, `403`, `404`, `500`) |
| `PUT` | `/api/activities/:id` | Privato | Sessione attiva, solo ruolo `MEMBER` (`SOCIO` / `PRESIDENTE`) | Obbligatorio (`X-Requested-With`) | Richiesta non distruttiva di modifica scheda attività del socio. Verifica ownership (`actorMemberId == activity.memberId`), valida l'input e crea/aggiorna una revisione in stato `IN_ATTESA_APPROVAZIONE` preservando invariata la scheda pubblicata live. (`200`, `400`, `401`, `403`, `404`, `500`) |
| `GET` | `/api/president/revisions/pending` | Privato | Sessione attiva, solo `PRESIDENTE` con stato `ATTIVO` | No (lettura safe) | Restituisce la coda delle revisioni in stato `IN_ATTESA_APPROVAZIONE` e registra audit `CONSULTAZIONE_CODA_REVISIONI`. (`200`, `401`, `403`, `500`) |
| `GET` | `/api/president/revisions/:id` | Privato | Sessione attiva, solo `PRESIDENTE` con stato `ATTIVO` | No (lettura safe) | Restituisce il dettaglio della revisione, la scheda attività corrente e il flag `canReview` (`false` in caso di conflitto di interessi sulla propria attività). (`200`, `401`, `403`, `404`, `500`) |
| `POST` | `/api/president/revisions/:id/approve` | Privato | Sessione attiva, solo `PRESIDENTE` con stato `ATTIVO` | Obbligatorio (`X-Requested-With`) | Approva una revisione pendente applicando in modo atomico le modifiche alla scheda pubblicata e registrando audit `APPROVAZIONE_REVISIONE_ATTIVITA`. Vietata l'auto-approvazione (`403`). (`200`, `401`, `403`, `404`, `409`, `500`) |
| `POST` | `/api/president/revisions/:id/reject` | Privato | Sessione attiva, solo `PRESIDENTE` con stato `ATTIVO` | Obbligatorio (`X-Requested-With`) | Rifiuta una revisione pendente con motivazione obbligatoria (`>= 10` caratteri), lasciando invariata la scheda pubblicata e registrando audit `RIFIUTO_REVISIONE_ATTIVITA`. Vietato l'auto-rifiuto (`403`). (`200`, `400`, `401`, `403`, `404`, `409`, `500`) |
| `GET` | `/api/showcase` | Pubblico | Aperto a tutti i visitatori | No | Restituisce l'elenco delle attività pubblicabili (scheda `PUBBLICATA` e socio `ATTIVO`). (`200`, `500`) |
| `GET` | `/api/activities/:id` | Pubblico | Aperto a tutti i visitatori | No | Restituisce il dettaglio pubblico di una specifica attività. Restituisce 404 se l'attività non rispetta i criteri di visibilità pubblica. (`200`, `404`, `500`) |
| `GET` | `/api/health` | Pubblico | Aperto a tutti i visitatori | No | Endpoint di controllo dello stato del server e del timestamp di uptime. (`200`) |

---

## Architettura Dati e Migrazioni PostgreSQL

Lo schema del database è gestito tramite migrazioni transazionali DDL tracciate nella tabella `schema_migrations`:
- `001_create_members.sql`: Tabella `members` con vincoli di stato associativo (`IN_ATTESA`, `ATTIVO`, `SOSPESO`, `RECEDUTO`, `ESCLUSO`) e indici.
- `002_create_business_activities.sql`: Tabella `business_activities` con relazione 1:N verso `members`, foreign key protetta (`ON DELETE RESTRICT`) e indici.
- `003_create_audit_logs.sql`: Tabella `audit_logs` append-only per tracciamento delle mutazioni di sicurezza.
- `004_create_auth_tables.sql`: Tabelle `user_accounts` e `sessions`. Include vincolo CHECK che impone `member_id IS NULL` per `TECHNICAL_ADMIN` e `member_id IS NOT NULL` per `MEMBER`, con indice univoco su `member_id`. Le sessioni sono collegate tramite foreign key `ON DELETE CASCADE`.
- `005_create_activity_revisions_and_president.sql`: Aggiunge `ruolo_direttivo` a `members` (con vincolo CHECK e indice parziale univoco per `PRESIDENTE`) e crea la tabella `activity_revisions` con stati `IN_ATTESA_APPROVAZIONE`, `PUBBLICATA`, `RIFIUTATA` e riferimenti a `business_activities` e `members`.

Le migrazioni sono presenti sia come file fisici in `src/db/migrations/` sia all'interno dell'array `MIGRATIONS` in `src/db/migrator.ts`, con test automatizzato di coerenza semantica.

---

## Servizio di Pulizia Sessioni (`SessionCleanupService`)

Il componente `SessionCleanupService` garantisce la manutenzione automatica del database:
- **Intervallo:** Esecuzione schedulata ogni 60 minuti (`3.600.000` ms).
- **Operazione:** Invocazione di `sessionRepo.deleteExpired()`.
- **Failure Isolation:** Errori di connessione a PostgreSQL vengono intercettati e registrati senza arrestare il server né bloccare le esecuzioni successive.
- **Graceful Shutdown:** L'avvio in `src/index.ts` registra gestori per `SIGTERM` e `SIGINT` che arrestano il timer prima di chiudere il listener HTTP.

---

## Struttura della Directory

```
backend/
├── package.json
├── tsconfig.json
├── src/
│   ├── app.ts                          # Configurazione Express, middleware e routing REST
│   ├── index.ts                        # Entrypoint server HTTP, pool PG, migrazioni e lifecycle
│   ├── auth/
│   │   ├── PasswordHasher.ts           # Hashing password con Scrypt (PHC format, salt CSPRNG)
│   │   ├── SessionManager.ts           # Gestione token CSPRNG, hash SHA-256 e timeout (30m / 8h)
│   │   ├── authMiddleware.ts           # Middleware autenticazione sessione e protezione CSRF
│   │   └── cookieUtils.ts              # Gestione cookie HttpOnly 'prolocal_session'
│   ├── db/
│   │   ├── config.ts                   # Configurazione connessione PostgreSQL via variabili ambiente
│   │   ├── connection.ts               # Inizializzazione pg.Pool
│   │   ├── migrator.ts                 # DatabaseMigrator con transazioni e tracking migrazioni
│   │   ├── migrations/                 # File DDL SQL (001, 002, 003, 004, 005)
│   │   └── seeds/                      # Dati dimostrativi iniziali (demoSeed.ts)
│   ├── domain/
│   │   ├── models.ts                   # Modelli socio, attività, revisioni e audit log
│   │   ├── auth.ts                     # Modelli account utente, sessione e contesti di autenticazione
│   │   └── policies/
│   │       └── AccessControlPolicy.ts  # Policy di controllo accessi RBAC, revisioni e visibilità vetrina
│   ├── repositories/                   # Interfacce e implementazioni (InMemory e Postgres)
│   │   ├── MemberRepository.ts / PostgresMemberRepository.ts
│   │   ├── BusinessActivityRepository.ts / PostgresBusinessActivityRepository.ts
│   │   ├── ActivityRevisionRepository.ts / PostgresActivityRevisionRepository.ts
│   │   ├── AuditLogRepository.ts / PostgresAuditLogRepository.ts
│   │   ├── UserAccountRepository.ts / PostgresUserAccountRepository.ts
│   │   └── SessionRepository.ts / PostgresSessionRepository.ts
│   ├── services/
│   │   ├── AuthService.ts              # Servizio applicativo autenticazione, login, lockout e logout
│   │   ├── SessionCleanupService.ts    # Servizio schedulato pulizia sessioni scadute
│   │   ├── ShowcaseService.ts          # Servizio consultazione vetrina e dettaglio pubblico
│   │   └── ActivityManagementService.ts# Gestione revisioni schede, approvazione/rifiuto e audit log
│   └── validation/
│       └── activityValidator.ts        # Validazione rigorosa degli input delle schede attività
└── tests/
    ├── governance_security.test.ts     # 19 test di governance e regole RBAC
    ├── api_http.test.ts                # 17 test di integrazione HTTP su rotte pubbliche e socio
    ├── postgres_repositories.test.ts   # 12 test migrazioni DDL (001-005) e repository PG
    ├── auth_core.test.ts               # 21 test unitari Scrypt hasher, session manager e repo auth PG
    ├── auth_service.test.ts            # 17 test unitari AuthService (lockout, anti-enumeration, lifecycle)
    ├── auth_http.test.ts               # 29 test HTTP per login, logout, me, cookie e CSRF
    ├── session_cleanup.test.ts         # 7 test lifecycle timer, failure isolation e PostgreSQL
    ├── rest_api.test.ts                # 9 test REST API e sicurezza
    ├── phase1_domain_db.test.ts        # 8 test dominio revisioni, policy Presidente e migrazione 005
    ├── phase2_service_layer.test.ts    # 17 test service layer workflow non distruttivo e approvazione
    └── phase3_approval_http.test.ts    # 19 test HTTP workflow REST del Presidente (in-memory + PG)
```

---

## Esecuzione dei Test

I test sono gestiti tramite il runner nativo di Node.js (`node:test`) con supporto per TypeScript:

```bash
# Esegue la suite completa dei test backend (175 test su 11 file / 31 suite)
npm run test:backend

# Verifica statica dei tipi TypeScript senza emissione di codice
npm run typecheck:backend
```
