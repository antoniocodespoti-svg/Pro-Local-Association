# Pro-Local

Piattaforma digitale per la gestione democratica dell'associazione e vetrina pubblica delle attività dei soci.

> **Stato Progetto:** Fase 2.1 — Hardening Governance & Domain + Preparazione Web App (Versione 0.2.3-beta)  
> **Natura Giuridica dell'Ente:** Associazione non riconosciuta (predisposta per eventuale futura iscrizione al RUNTS).  
> **Due Dimensioni Distinte:** 1. Gestione della vita associativa democratica interna; 2. Portale vetrina neutrale per la visibilità delle attività dei soci.  
> **Destinazione Architetturale Ufficiale:** Piattaforma Web modulare (Backend Node.js/TS REST API + Frontend React/TS) con preservazione integrale del prototipo Android di riferimento.

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
- **Linguaggio:** Kotlin
- **Interfaccia Utente:** Jetpack Compose (Material Design 3, Responsive Multi-Device: Smartphone, Tablet, Desktop)
- **Separazione dei Livelli:** Clean Architecture / MVVM
  - `com.example.core.model`: Entità e modelli di business
  - `com.example.core.data`: Repository contract e provider dati dimostrativi
  - `com.example.ui`: Schermate, componenti riutilizzabili e tema responsive
- **Dati:** Dati esclusivamente dimostrativi (nessun dato personale reale).
