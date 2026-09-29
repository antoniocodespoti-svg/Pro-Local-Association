# Pro-Local Frontend Web (React + TypeScript)

Interfaccia Web ufficiale della piattaforma Pro-Local con supporto completo per autenticazione a sessioni server-side, protezione CSRF e consultazione della vetrina pubblica.

## Principi Guida del Frontend

1. **La UI non è un confine di sicurezza:** Tutte le regole di visibilità, pubblicazione, autorizzazione RBAC, verifica dello status del socio e ownership delle schede sono applicate e garantite a monte dal Backend REST API.
2. **Principio di Neutralità e Trasparenza (No Certificazioni):** La vetrina non include in alcun caso badge di certificazione, bollini, sigilli o diciture tipo "Attività Verificata" / "Garantita". Include invece in modo permanente la **Nota di Trasparenza e Autonomia Professionale** (`LegalNotice`).
3. **Autenticazione Reale a Sessione (Fase 3):**
   - L'accesso avviene tramite form di login dedicato (`LoginView`) con credenziali email e password.
   - Non vengono archiviati token o password nel LocalStorage o SessionStorage del browser.
   - Il browser riceve e trasmette automaticamente il cookie sicuro `prolocal_session` con flag `HttpOnly`.
   - Tutte le chiamate API che richiedono contesto di sessione utilizzano `credentials: 'include'`.
   - Tutte le richieste mutative verso il backend (`POST`, `PUT`) includono l'header personalizzato `X-Requested-With: ProLocalApp` per la protezione anti-CSRF.
   - La gestione della scadenza della sessione è centralizzata: se un endpoint autenticato restituisce `401 Unauthorized`, il client intercetta l'evento (`onUnauthorized`) e reindirizza lo stato applicativo a non autenticato.
4. **Separazione dei Ruoli Utente:**
   - **Socio (`AUTHENTICATED_MEMBER`):** Accesso all'Area Socio (`/socio`), consultazione dello stato di iscrizione e modifica della propria scheda attività (`/socio/attivita`).
   - **Amministratore Tecnico (`AUTHENTICATED_TECHNICAL_ADMIN`):** Schermata dedicata (`TechnicalAdminView`) con clausola di separazione dei poteri; nessun accesso ai dati riservati del libro soci né alle attività commerciali.
5. **Pagine e Viste Implementate:**
   - `/`: Vetrina pubblica neutra delle attività dei soci (filtro per categoria, ricerca testuale, nota di trasparenza).
   - `/attivita/:id`: Scheda di dettaglio pubblica con contatti diretti dell'attività e divieto di bypass (404 per attività non pubbliche).
   - `/login`: Form di accesso con messaggi chiari per credenziali non valide (401) e blocco temporaneo di sicurezza (423).
   - `/socio`: Dashboard dell'area socio o vista amministratore tecnico in base all'attore autenticato.
   - `/socio/attivita`: Modulo per la modifica autonoma della propria attività da parte del socio titolare, con passaggio automatico in `IN_ATTESA_APPROVAZIONE`.
6. **Design Web Responsive e Accessibile:**
   - Compatibile con desktop, tablet e smartphone.
   - HTML semantico (`<header>`, `<main>`, `<footer>`, `<article>`, `<label>`).
   - Focus visibile, contrasti elevati e navigabilità da tastiera.

---

## Struttura della Directory

```
frontend/
├── package.json
├── tsconfig.json
├── src/
│   ├── types/
│   │   ├── domain.ts             # Contratti DTO per attività e soci
│   │   └── auth.ts               # Tipi di autenticazione, ruoli e ApiError
│   ├── services/
│   │   └── apiClient.ts          # Client API HTTP REST (credentials: 'include', CSRF)
│   ├── context/
│   │   └── AuthContext.tsx       # AuthProvider, hook useAuth e gestione stati di sessione
│   ├── components/
│   │   ├── LegalNotice.tsx       # Banner obbligatorio di trasparenza legale
│   │   ├── ActivityCard.tsx      # Scheda attività neutrale senza badge
│   │   ├── ShowcaseView.tsx      # Vista vetrina con ricerca e filtri
│   │   ├── ActivityDetailView.tsx# Vista dettaglio pubblico attività
│   │   ├── MemberDashboardView.tsx# Dashboard personale socio
│   │   ├── ActivityEditView.tsx  # Modulo modifica attività per il socio
│   │   ├── LoginView.tsx         # Form di autenticazione con credenziali
│   │   └── TechnicalAdminView.tsx# Pannello informativo per amministratore tecnico
│   ├── App.tsx                   # Routing lato client e protezione delle rotte
│   └── index.tsx
└── tests/
    ├── frontend_components.test.ts # Test di rendering SSR e assenza badge ingannevoli
    ├── auth_integration.test.ts    # Test integrazione flussi auth, form login, CSRF e HttpOnly
    └── api_client.test.ts          # Test unitari client API (showcase, member me, update)
```

---

## Esecuzione dei Test

```bash
# Esegue la suite completa dei test frontend (29 test)
npm run test:frontend

# Verifica statica dei tipi TypeScript senza emissione di codice
npm run typecheck:frontend
```
