# Pro-Local - Documentazione di Progetto
## 01. Descrizione Generale del Progetto

### 1.1 Visione e Obiettivo
**Pro-Local** è una piattaforma digitale modulare concepita per supportare in modo efficiente, trasparente e sicuro la vita e l'operatività di un'associazione locale.

Il progetto unisce in un unico ecosistema integrato due dimensioni strettamente collegate:
1. **Gestione digitale dell'associazione:** amministrazione interna, libro soci, organi statutari (Consiglio Direttivo, Assemblea), verbali, votazioni e conformità giuridica.
2. **Portale / Vetrina pubblica delle attività dei soci:** cuore pulsante della piattaforma, che valorizza le competenze, i servizi e le attività economiche, artigianali e professionali degli associati sul territorio locale.

### 1.1.1 La Regola Fondamentale della Vetrina
La vetrina pubblica opera secondo un vincolo statutario inscindibile:
> **Un'attività può essere pubblicata ed esposta nella vetrina SOLO se è collegata a una persona che risulta SOCIO ATTIVO dell'associazione Pro-Local.**

La perdita, la sospensione o il mancato perfezionamento dello status di "Socio Attivo" determina automaticamente l'immediata disattivazione della visibilità pubblica dell'attività nella vetrina. Non sono previste eccezioni commerciali o abbonamenti svincolati dal vincolo sociale.

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
