# Pro-Local Frontend Web (React + TypeScript)

Questa directory ospita la base architetturale del nuovo frontend Web per la piattaforma Pro-Local, in linea con gli obiettivi della Fase 2.1 (Hardening Governance & Domain + Preparazione Web App).

## Principi Guida del Frontend

1. **La UI non è un confine di sicurezza:** Tutte le regole di visibilità, pubblicazione, autorizzazione RBAC e verifica dello status del socio sono eseguite e garantite a monte dal Backend.
2. **Principio di Neutralità e Trasparenza (No Certificazioni):** La vetrina non include in alcun caso badge di certificazione, bollini, sigilli o diciture tipo "Attività Verificata" / "Garantita". Include invece in modo permanente la **Nota di Trasparenza e Autonomia Professionale**.
3. **Consumo API REST:** Il frontend è disaccoppiato dall'architettura del database e comunica esclusivamente tramite endpoint REST conformi alle specifiche di dominio.

## Struttura della Directory

```
frontend/
├── package.json
├── tsconfig.json
└── src/
    ├── types/
    │   └── domain.ts             # Interfacce DTO restituite dal Backend
    ├── services/
    │   └── apiClient.ts          # Client HTTP per le REST API
    ├── components/
    │   ├── LegalNotice.tsx       # Banner obbligatorio di trasparenza legale
    │   ├── ActivityCard.tsx      # Scheda attività neutrale senza badge
    │   └── ShowcaseView.tsx      # Vista principale con filtri e ricerca
    ├── App.tsx
    └── index.tsx
```
