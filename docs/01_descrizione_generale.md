# Pro-Local - Documentazione di Progetto
## 01. Descrizione Generale del Progetto

### 1.1 Visione e Obiettivo
**Pro-Local** è una piattaforma digitale modulare concepita per supportare in modo efficiente, trasparente e sicuro la gestione amministrativa, deliberativa e documentale di un'associazione.

Il progetto nasce con l'intento di fornire una base tecnologica solida e manutenibile nel tempo, evitando soluzioni usa-e-getta o architetture improvvisate.

### 1.2 Natura Giuridica dell'Ente
* **Stato Attuale:** Associazione non riconosciuta (ai sensi degli artt. 36 e ss. del Codice Civile italiano).
* **Evoluzione Futura:** Predisposizione per l'eventuale iscrizione al **RUNTS** (Registro Unico Nazionale del Terzo Settore) ai sensi del D.Lgs. 117/2017 (Codice del Terzo Settore), qualora l'Assemblea deliberi in tal senso.
* **Clausola di Salvaguardia Legale:** Le specifiche e le regole qui descritte costituiscono requisiti tecnici e funzionali del software e non costituiscono consulenza legale formale. Qualsiasi incompatibilità statutaria o normativa dovrà essere verificata prima dell'implementazione definitiva.

### 1.3 Principi Guida del Software
1. **Modularità Rigorosa:** Ogni area funzionale (Consiglio, Associati, Voto, Documenti) è isolata e indipendente.
2. **Fedeltà ai Requisiti:** Distinzione esplicita tra requisiti già consolidati e deliberati (`[DEFINITO]`) e requisiti aperti o non ancora statuiti (`[DA DEFINIRE]`). Nessun requisito non espressamente richiesto viene inventato.
3. **Privacy & Sicurezza by Design:** Architettura predisposta per la tutela dei dati personali (GDPR), gestione granulare di ruoli e permessi e tracciamento non ripudiabile delle operazioni rilevanti (audit log).
4. **Indipendenza dei Livelli:** Separazione netta tra interfaccia utente (UI), logica di business e livello di persistenza dati.
5. **Versionamento e Manutenibilità:** Codice e documentazione integrati e predisposti per il repository GitHub.
