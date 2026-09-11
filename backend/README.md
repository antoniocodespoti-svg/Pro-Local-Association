# Pro-Local Backend API & Domain Layer (Node.js + TypeScript)

Server REST API HTTP e Dominio Associativo per la Web App ufficiale di Pro-Local.

## Principi Architetturali

1. **Subordinazione del Ruolo Tecnico:** L'Amministratore Tecnico ha permessi strettamente limitati a operazioni di manutenzione, diagnostica, log e configurazione tecnica. Tutte le operazioni associative e di status (ammissione, sospensione, esclusione, modifiche statutarie, elezioni, delibere, forzatura vetrina, modifica schede soci) sono categoricamente inibite.
2. **Controllo Accessi e Ownership:** Un socio può modificare solo ed esclusivamente la propria attività (`activity.memberId == actorMemberId`). È preclusa la modifica di schede altrui. L'amministratore tecnico non ha titolo per intervenire sulle schede commerciali dei soci.
3. **Regola Vetrina di Dominio:** Un'attività è pubblicamente visibile se e solo se la scheda è in stato `PUBBLICATA` e il socio titolare è in stato `ATTIVO`. Stati come `IN_ATTESA`, `SOSPESO`, `RECEDUTO` o `ESCLUSO` comportano l'oscuramento immediato e totale sia dalla vetrina (`GET /api/showcase`) che dall'endpoint di dettaglio (`GET /api/activities/:id` restituisce 404 per evitare bypass).
4. **Indipendenza dalla UI:** Le regole di sicurezza e di ammissibilità risiedono nel layer `domain/policies/` e nei servizi applicativi, non nel browser.
5. **Autenticazione DEMO esplicita (Fase 2.2):** Poiché le sessioni di produzione sono fuori scope in questa fase, l'identità dell'attore è simulata via header `X-Demo-Member-Id` e `X-Demo-Role`, esplicitamente etichettati come meccanismo di collaudo non di produzione.
6. **Persistenza in-memory:** L'astrazione repository opera su collezioni dimostrative in memoria; nessun database PostgreSQL è operativo in questa fase.

## Endpoints REST API

| Metodo | Path | Descrizione | Policy applicata | Status codes |
|---|---|---|---|---|
| `GET` | `/api/showcase` | Vetrina pubblica neutra | Solo schede PUBBLICATE di soci ATTIVI | `200`, `500` |
| `GET` | `/api/activities/:id` | Dettaglio pubblico attività | 404 se l'attività non è pubblica o non esiste (no bypass) | `200`, `404`, `500` |
| `GET` | `/api/members/me` | Area personale socio demo | Legge dati via header `X-Demo-Member-Id` | `200`, `404`, `500` |
| `PUT` | `/api/activities/:id` | Aggiornamento scheda attività | Validazione server-side, ownership check (`actorMemberId == activity.memberId`), stato → `IN_ATTESA_APPROVAZIONE` | `200`, `400`, `403`, `404`, `500` |

## Struttura della Directory

```
backend/
├── package.json
├── tsconfig.json
├── src/
│   ├── app.ts                          # Configurazione Express e routing REST
│   ├── index.ts                        # Server HTTP listen entrypoint
│   ├── domain/
│   │   ├── models.ts                   # Modelli di dominio e tipizzazioni pure
│   │   └── policies/
│   │       └── AccessControlPolicy.ts  # RBAC, ownership e visibilità vetrina
│   ├── repositories/
│   │   ├── MemberRepository.ts         # Interfaccia e repo soci in-memory
│   │   └── BusinessActivityRepository.ts# Interfaccia e repo attività in-memory
│   ├── services/
│   │   ├── ShowcaseService.ts          # Servizio vetrina pubblica e dettaglio protetto
│   │   └── ActivityManagementService.ts# Gestione schede con ownership check
│   └── validation/
│       └── activityValidator.ts        # Validatore input server-side
└── tests/
    ├── governance_security.test.ts     # 16 test unitari RBAC e dominio
    └── rest_api.test.ts                # 9 test HTTP end-to-end su porta effimera
```

## Esecuzione dei Test

```bash
npm test
# Esegue sia governance_security.test.ts che rest_api.test.ts
```
