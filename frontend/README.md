# Pro-Local Frontend Web (React + TypeScript)

Interfaccia Web ufficiale della piattaforma Pro-Local (Fase 2.2 — Prima Web App Pubblica + Area Socio).

## Principi Guida del Frontend

1. **La UI non è un confine di sicurezza:** Tutte le regole di visibilità, pubblicazione, autorizzazione RBAC, verifica dello status del socio e ownership delle schede sono eseguite e garantite a monte dal Backend.
2. **Principio di Neutralità e Trasparenza (No Certificazioni):** La vetrina non include in alcun caso badge di certificazione, bollini, sigilli o diciture tipo "Attività Verificata" / "Garantita". Include invece in modo permanente la **Nota di Trasparenza e Autonomia Professionale** (`LegalNotice`).
3. **Pagine e Viste Implementate:**
   - `/`: Vetrina pubblica neutra delle attività dei soci (filtro per categoria, ricerca testuale, nota di trasparenza).
   - `/attivita/:id`: Scheda di dettaglio pubblica con contatti diretti dell'attività e divieto di bypass (404 per attività non pubbliche).
   - `/socio`: Dashboard dell'area socio (profilo demo, stato associativo, anteprima scheda attività collegata e stato pubblicazione).
   - `/socio/attivita`: Modulo per la modifica autonoma della propria attività con indicazione esplicita della regola di passaggio in `IN_ATTESA_APPROVAZIONE`.
4. **Design Web Responsive e Accessibile:**
   - Compatibile con desktop, tablet e smartphone.
   - HTML semantico (`<header>`, `<main>`, `<footer>`, `<article>`, `<label>`).
   - Focus visibile, contrasti elevati e navigabilità da tastiera.
5. **Autenticazione DEMO:**
   - L'identità del socio è gestita via selettore demo (`X-Demo-Member-Id`). Non rappresenta un sistema di autenticazione di produzione.

## Struttura della Directory

```
frontend/
├── package.json
├── tsconfig.json
├── src/
│   ├── types/
│   │   └── domain.ts             # Contratti DTO per la UI Web
│   ├── services/
│   │   └── apiClient.ts          # Client API HTTP REST
│   ├── components/
│   │   ├── LegalNotice.tsx       # Banner obbligatorio di trasparenza legale
│   │   ├── ActivityCard.tsx      # Scheda attività neutrale senza badge
│   │   ├── ShowcaseView.tsx      # Vista vetrina con ricerca e filtri
│   │   ├── ActivityDetailView.tsx# Vista dettaglio pubblico attività
│   │   ├── MemberDashboardView.tsx# Dashboard personale socio demo
│   │   └── ActivityEditView.tsx  # Modulo modifica attività per il socio
│   ├── App.tsx                   # Router e coordinamento dello stato web
│   └── index.tsx
└── tests/
    └── frontend_components.test.ts# Suite di test SSR componenti e assenza badge
```

## Esecuzione dei Test

```bash
npm test
# Bundle CommonJS ed esecuzione test SSR con node:test
```
