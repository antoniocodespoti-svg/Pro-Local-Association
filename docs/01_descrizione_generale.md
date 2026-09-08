# Pro-Local - Documentazione di Progetto
## 01. Descrizione Generale del Progetto

### 1.1 Visione e Obiettivo
**Pro-Local** è una piattaforma digitale modulare concepita per supportare in modo efficiente, trasparente e sicuro la vita e l'operatività di un'associazione locale.

Il progetto unisce in un unico ecosistema integrato due dimensioni strettamente collegate:
1. **Gestione digitale dell'associazione:** amministrazione interna, libro soci, organi statutari (Consiglio Direttivo, Assemblea), verbali, votazioni e conformità giuridica.
2. **Portale / Vetrina pubblica delle attività dei soci:** cuore pulsante della piattaforma, che valorizza le competenze, i servizi e le attività economiche, artigianali e professionali degli associati sul territorio locale.

### 1.1.1 La Regola di Ammissibilità alla Vetrina
La vetrina pubblica opera secondo una regola interna di ammissibilità:
> **Un'attività può essere pubblicata ed esposta nella vetrina SOLO se è collegata a una persona che risulta SOCIO ATTIVO dell'associazione Pro-Local.**

La perdita, la sospensione o il mancato perfezionamento dello status di "Socio Attivo" determina automaticamente l'immediata disattivazione della visibilità pubblica dell'attività nella vetrina. Tale regola è una condizione associativa interna di ammissibilità alla piattaforma, NON una certificazione di qualità o un attestato commerciale.

### 1.1.2 Separazione Assoluta tra Associazione e Attività
La piattaforma stabilisce una netta distinzione tra la sfera associativa e la sfera delle attività private:
1. **L'associazione gestisce la propria vita associativa democratica.**
2. **La piattaforma gestisce la pubblicazione delle schede** secondo regole stabilite e verificate.
3. **Il professionista o l'attività economica rimane interamente autonomo** nella conduzione della propria opera o impresa.
4. **Il visitatore sceglie in piena autonomia** se contattare l'attività o richiedere prestazioni.
5. **L'associazione NON è garante né intermediario:** non verifica la perizia professionale, non garantisce l'esito o la qualità delle prestazioni, non certifica le attività né assume alcuna responsabilità contrattuale o extracontrattuale.
6. **Divieto di badge e attestazioni:** nell'interfaccia pubblica della vetrina è tassativamente escluso l'uso di badge, sigilli, bollini di verifica, attestazioni di garanzia o diciture che possano indurre il pubblico a ritenere l'attività "certificata" o "garantita" dall'ente.

### 1.2 Natura Giuridica dell'Ente
* **Stato Attuale:** Associazione non riconosciuta (ai sensi degli artt. 36 e ss. del Codice Civile italiano).
* **Evoluzione Futura:** Predisposizione per l'eventuale iscrizione al **RUNTS** (Registro Unico Nazionale del Terzo Settore) ai sensi del D.Lgs. 117/2017 (Codice del Terzo Settore), qualora l'Assemblea deliberi in tal senso.
* **Clausola di Salvaguardia Legale:** Le specifiche e le regole qui descritte costituiscono requisiti tecnici e funzionali del software e non costituiscono consulenza legale formale. Qualsiasi incompatibilità statutaria o normativa dovrà essere verificata prima dell'implementazione definitiva.

### 1.3 Principi Guida del Software
1. **Principio di Democraticità Associativa:** L'associazione è e rimane rigorosamente democratica. Il software è uno strumento subordinato alle regole associative e non un'autorità sopra gli organi statutari. L'Assemblea dei Soci è sovrana; il Consiglio Direttivo è organo collegiale esecutivo; nessun amministratore tecnico può scavalcare o sostituire le decisioni degli organi democratici.
2. **Separazione Funzionale e Giuridica:** Netta demarcazione tra la vita interna dell'associazione e la sfera professionale dei soci, garantendo neutralità espositiva senza promesse o garanzie commerciali.
3. **Modularità Rigorosa:** Ogni area funzionale (Consiglio, Vetrina, Associati, Voto, Documenti) è isolata e indipendente.
4. **Fedeltà ai Requisiti:** Distinzione esplicita tra requisiti già consolidati e deliberati (`[DEFINITO]`) e requisiti aperti o non ancora statuiti (`[DA DEFINIRE]`). Nessun requisito non espressamente richiesto viene inventato.
5. **Privacy & Sicurezza by Design:** Architettura predisposta per la tutela dei dati personali (GDPR), gestione granulare di ruoli e permessi e tracciamento non ripudiabile delle operazioni rilevanti (audit log).
6. **Indipendenza dei Livelli:** Separazione netta tra interfaccia utente (UI), logica di business e livello di persistenza dati.
7. **Versionamento e Manutenibilità:** Codice e documentazione integrati e predisposti per il repository GitHub.
