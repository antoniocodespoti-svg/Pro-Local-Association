# Pro-Local Backend API & Domain Layer (Node.js + TypeScript)

Questa directory contiene la base architetturale del backend REST per la futura Web App di Pro-Local.

## Principi Architetturali

1. **Subordinazione del Ruolo Tecnico:** L'Amministratore Tecnico ha permessi strettamente limitati a operazioni di manutenzione, log e configurazione tecnica. Tutte le operazioni associative e di status (ammissione, sospensione, esclusione, modifiche statutarie, elezioni, delibere) sono negate.
2. **Controllo Accessi e Ownership:** Un socio può modificare solo la propria attività (`activity.memberId == actorMemberId`). Non può modificare attività altrui. L'amministratore tecnico non può alterare schede dei soci.
3. **Regola Vetrina di Dominio:** Un'attività è pubblicamente visibile se e solo se la scheda è in stato `PUBBLICATA` e il socio titolare è in stato `ATTIVO`. Stati come `IN_ATTESA`, `SOSPESO`, `RECEDUTO` o `ESCLUSO` comportano l'oscuramento immediato.
4. **Indipendenza dalla UI:** Le regole di sicurezza e di ammissibilità risiedono nel layer `domain/policies/` e nei servizi applicativi, non nel browser.

## Struttura della Directory

```
backend/
├── package.json
├── tsconfig.json
├── src/
│   ├── domain/
│   │   ├── models.ts                    # Modelli di dominio e tipizzazioni
│   │   └── policies/
│   │       └── AccessControlPolicy.ts   # RBAC, ownership e visibilità vetrina
│   ├── repositories/
│   │   ├── MemberRepository.ts          # Interfaccia e repo soci
│   │   └── BusinessActivityRepository.ts# Interfaccia e repo attività
│   └── services/
│       ├── ShowcaseService.ts           # Servizio vetrina pubblica filtrata
│       └── ActivityManagementService.ts # Gestione schede con ownership check
└── tests/
    └── governance_security.test.ts      # Suite completa test RBAC negativi/positivi
```

## Esecuzione dei Test

```bash
npm test
# oppure: node --experimental-strip-types --test tests/governance_security.test.ts
```
