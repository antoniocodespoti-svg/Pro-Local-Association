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
   - Entità: `CouncilMember`, `InternalRole`, `CouncilResolution`, `AssociationStatus`, `AuditLogEntry`, `ProjectModule`.
2. **Data Layer Abstraction (`com.example.core.data`):**
   - L'interfaccia `ProLocalRepository` espone flussi reattivi (`StateFlow` / `Flow`).
   - L'implementazione attuale fornisce dati dimostrativi controllati senza dipendenze hardware o esterne.
   - La migrazione a un database SQLite/Room o API REST non richiederà modifiche alla UI o alla logica di business.
3. **Presentation Layer (`com.example.ui`):**
   - Componenti atomici riutilizzabili (`StatusBadge`, `StatCard`, `RuleCard`, `AuditLogItem`).
   - Layout responsive adattivo (compatto per smartphone, medio/espanso per tablet e desktop con NavigationRail).

### 3.3 Gestione della Sicurezza e Privacy
- Separazione tra dati anagrafici dimostrativi e dati reali.
- Tracciamento delle azioni rilevanti tramite modello immutabile `AuditLogEntry` con timestamp, operatore e livello di severità.
- Modello di controllo accessi (RBAC) predisposto per token JWT o sessioni server-side sicure in fase di pubblicazione online.
