# Pro-Local

Piattaforma digitale per la gestione democratica dell'associazione e vetrina pubblica delle attività dei soci.

> **Stato Progetto:** Fase 2.4 — Consolidamento PostgreSQL, Transazioni, Audit Logging & Test Suite (Versione 0.2.4-beta)  
> **Natura Giuridica dell'Ente:** Associazione non riconosciuta (predisposta per eventuale futura iscrizione al RUNTS).  
> **Due Dimensioni Distinte:** 1. Gestione della vita associativa democratica interna; 2. Portale vetrina neutrale per la visibilità delle attività dei soci.  
> **Destinazione Architetturale Ufficiale:** Piattaforma Web (React + TypeScript / Backend Node.js + TypeScript REST API) con prototipo Android intatto e funzionante.

---

## 🏛️ Principio Assoluto: Democraticità dell'Associazione

L'associazione deve essere e rimanere rigorosamente democratica:
- Il software è uno strumento al servizio dell'associazione e delle sue regole statutarie, non un'autorità sopra gli organi associativi.
- L'**Assemblea dei Soci** è l'organo sovrano che approva gli indirizzi ed elegge direttamente le cariche sociali.
- Il **Consiglio Direttivo** è l'organo collegiale esecutivo (con regole chiare di funzionamento: maggioranza dei presenti, voto dirimente del Presidente in parità, subentro graduato del primo dei non eletti, disciplina per la revoca).
- Nessun amministratore tecnico può sostituire o scavalcare una decisione dell'Assemblea o del Consiglio Direttivo.

---

## 🔍 Principio di Separazione tra Associazione e Attività Professionali

La piattaforma mantiene una netta e rigorosa separazione funzionale e giuridica:
1. L'associazione gestisce la propria vita associativa interna.
2. La piattaforma gestisce la pubblicazione delle schede secondo le regole stabilite.
3. Il professionista/attività rimane autonomo nella gestione della propria professione o impresa.
4. Il visitatore sceglie in piena autonomia se contattare l'attività.
5. **L'associazione NON è garante né intermediario commerciale:** non verifica la perizia professionale, non garantisce la qualità dei servizi, non certifica le attività né assume responsabilità contrattuali.
6. **Neutralità assoluta dell'interfaccia pubblica:** nella vetrina non vengono utilizzati badge, sigilli, bollini, icone di verifica, attestazioni di garanzia o diciture equivalenti.

### 🛡️ Regola Interna di Pubblicazione
> **Un'attività è potenzialmente pubblicabile nella vetrina SOLO se collegata a un SOCIO ATTIVO dell'associazione.**  
> Se il socio diviene non attivo (sospeso, moroso, receduto o escluso), l'attività viene automaticamente e istantaneamente oscurata dalla vetrina pubblica e dai risultati di ricerca. Tale condizione costituisce un requisito interno di ammissibilità statutaria, NON una certificazione pubblica.

---

## 🌟 Vetrina delle Attività dei Soci
- Consultazione pubblica neutrale di artigiani, professionisti e realtà del territorio.
- Ricerca libera per servizio, parola chiave e categorie merceologiche.
- Schede descrittive con contatti diretti, elenco servizi, orari e link social forniti dal titolare.
- Scheda trasparente con nota di autonomia e assenza di intermediazione commerciale.

---

## 📁 Documentazione Integrale di Progetto
La documentazione è parte integrante del progetto ed è consultabile sia nei file Markdown sottostanti sia direttamente all'interno dell'applicazione:

1. [Descrizione Generale del Progetto](docs/01_descrizione_generale.md)
2. [Specifica Funzionale](docs/02_specifica_funzionale.md)
3. [Architettura Tecnica](docs/03_architettura_tecnica.md)
4. [Infrastruttura e Rete](docs/04_infrastruttura_rete.md)
5. [Decisioni Progettuali (ADR)](docs/05_decisioni_progettuali.md)
6. [Regole dell'Associazione](docs/06_regole_associazione.md)
7. [Registro delle Modifiche (Changelog)](docs/07_registro_modifiche.md)

---

## 💻 Architettura del Codice
- **Piattaforma Web (Ufficiale Fase 2.2+ / Fase 3.2 Core Auth):**
  - **Backend (`/backend`):** Node.js + TypeScript REST API (Express), modelli di dominio, policy RBAC server-side, validazione severa input (`ActivityValidator`), doppio driver di persistenza (`DB_DRIVER=memory` e `DB_DRIVER=postgres` con migrazioni transazionali e pool), audit trail attivo sulle mutazioni.
  - **Auth Core & Persistence (Fase 3.2):** Migrazione PostgreSQL `004_create_auth_tables` con tabelle `user_accounts` e `sessions`. Separazione ontologica tra Identità Autenticabile (`UserAccount`) e Membro (`Member`), vincolo CHECK per `MEMBER` (`member_id` obbligatorio) e `TECHNICAL_ADMIN` (`member_id` nullo). Password hashing sicuro con `node:crypto.scrypt` (formato versionabile PHC), raw session ID a 32 byte di entropia (non persistito) e lookup server-side tramite hash SHA-256. Gestione timeout (inattività 30 min, timeout assoluto 8 ore).
  - **Auth Application Service & Session Lifecycle (Fase 3.3):** `AuthService` disaccoppiato da database e framework HTTP. Flusso di login con normalizzazione email, prevenzione account enumeration (`InvalidCredentialsError`), account lockout (5 tentativi falliti consecutivi = blocco 15 minuti), emissione sessione server-side con hash SHA-256, risoluzione dell'attore autenticato (`resolveAuthenticatedActor`) con lettura dinamica da `Member` per i soci (ruolo e stato associativo non persistiti staticamente in sessione) e ruolo `AMMINISTRATORE_TECNICO` per `TECHNICAL_ADMIN` con `memberId=null`. Logout idempotente con revoca immediata della sessione. Audit log per `LOGIN_SUCCESS`, `LOGIN_FAILED` e `LOGOUT` senza emissione di password o token raw. *Nota: La Demo Auth basata su header rimane attiva e pienamente funzionante in questa fase; i controller HTTP `/api/auth/login`, `/logout`, `/me` e i form frontend verranno introdotti nelle fasi successive.*
  - **Frontend (`/frontend`):** React + TypeScript, interfaccia responsive e accessibile (Vetrina `/`, Scheda `/attivita/:id`, Dashboard `/socio`, Gestione `/socio/attivita`), nota permanente di trasparenza (`LegalNotice`), assenza totale di badge ingannevoli.
- **Prototipo Android/Kotlin (Preservato):**
  - **Linguaggio:** Kotlin
  - **Interfaccia Utente:** Jetpack Compose (Material Design 3, Responsive Multi-Device: Smartphone, Tablet, Desktop)
  - **Separazione dei Livelli:** Clean Architecture / MVVM
    - `com.example.core.model`: Entità e modelli di business
    - `com.example.core.data`: Repository contract e provider dati dimostrativi
    - `com.example.ui`: Schermate, componenti riutilizzabili e tema responsive
- **Dati:** Dati esclusivamente dimostrativi (nessun dato personale reale).
