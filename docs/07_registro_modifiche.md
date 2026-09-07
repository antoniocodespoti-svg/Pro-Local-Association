# Pro-Local - Documentazione di Progetto
## 07. Registro delle Modifiche (Changelog)

Tutte le modifiche al codice e alla documentazione di Pro-Local sono annotate in questo registro per garantire tracciabilità e continuità.

---

### Versione 0.2.1-beta (Consolidamento & Verifica Rigorosa Fase 2)
* **Data di Verifica:** 2026-09-07
* **Tipologia:** Verifica di Conformità, Test di Validazione & Consolidamento Regole

#### Esiti della Verifica:
- **Vetrina Pubblica:** Verificata la ricerca per parole chiave e servizi, i filtri merceologici e territoriali, la navigazione responsive e l'apertura/chiusura della scheda dettaglio attività.
- **Regola Fondamentale del Socio Attivo:**
  - Confermata l'esistenza di una singola regola di dominio coerente (`BusinessActivity.isVisibileInVetrina(MembershipStatus)`).
  - Verificato che la sospensione del socio oscuri immediatamente l'attività sia dalla vetrina che dai risultati di ricerca, nonché reattivamente dalla vista di dettaglio aperta.
- **Area Socio:**
  - Verificata la gestione autonoma della scheda, la visualizzazione dello stato (`BOZZA`, `IN_ATTESA_APPROVAZIONE`, `PUBBLICATA`, `SOSPESA`).
  - Verificato e testato il blocco perentorio della richiesta di pubblicazione se il socio collegato non possiede lo stato `ATTIVO`.
- **Area Amministrativa & Audit:**
  - Verificate le operazioni di approvazione, sospensione e richiesta di integrazioni/bozza, con collegamento esplicito attività-socio.
  - Verificata la registrazione degli audit log con livello di severità e modello predisposto per la persistenza su database relazionale.
- **Invarianza Governance del Consiglio Direttivo:**
  - Verificata la totale integrità delle regole del Consiglio: quattro cariche apicali elette dall'Assemblea, maggioranza dei presenti, voto prevalente del Presidente in parità, subentro del primo dei non eletti, disciplina di revoca.
- **Allineamento [DEFINITO] vs [DA DEFINIRE]:**
  - Confermato che i punti non deliberati (numero attività per socio, obbligatorietà campi, modalità definitive di approvazione, categorie definitive, recensioni, geolocalizzazione, messaggistica, pagamenti, abbonamenti e altre funzioni commerciali) restano esplicitamente marcati come `[DA DEFINIRE]`.
- **Suite di Test:**
  - Eseguiti con successo tutti i test unitari Robolectric/JVM (`ProLocalCouncilTest` e `ProLocalShowcaseTest`), inclusi nuovi test sul blocco sottomissione socio sospeso e tracciamento audit log.

---

### Versione 0.2.0-beta (Fase 2 - Vetrina Digitale delle Attività dei Soci)
* **Data di Rilascio:** 2026-09-07
* **Tipologia:** Evoluzione Funzionale Maggiore / Vetrina Pubblica & Area Soci

#### Nuove Funzionalità Implementate:
- **Integrazione delle Due Dimensioni Pro-Local:**
  - Piena coesistenza tra la dimensione istituzionale/amministrativa dell'associazione e la dimensione pubblica di vetrina territoriale.
- **Vetrina Digitale Pubblica (`ShowcaseScreen`):**
  - Ricerca libera per parola chiave o servizio; filtri per categorie merceologiche (Artigianato, Consulenza, Enogastronomia, Digitale, Benessere, Casa & Verde, ecc.); filtri territoriali/quartiere.
  - Elenco attività con contatti veloci (telefono, email, sito), badge di categoria e tag servizi.
  - Banner esplicativo della Regola Fondamentale e della natura istituzionale no-profit della rete.
- **Scheda Dettaglio Attività (`ActivityDetailSheet`):**
  - Finestra modale / foglio esteso di dettaglio con descrizione approfondita, tutti i recapiti ufficiali, orari di apertura, elenco puntuale dei servizi offerti e canali social.
  - Badge di garanzia "Attività Verificata - Socio Pro-Local Attivo" con identificativo tessera socio.
- **Applicazione Rigorosa della Regola Fondamentale:**
  - Incapsulata a livello di dominio (`BusinessActivity.isVisibileInVetrina(MembershipStatus)`).
  - Un'attività compare nella vetrina **esclusivamente se il socio collegato risulta in stato ATTIVO**.
  - Se il socio viene sospeso o decade, l'attività viene istantaneamente e reattivamente oscurata.
- **Area Riservata Socio (`MemberAreaScreen`):**
  - Visualizzazione del profilo associativo personale (codice tessera, data di ammissione, stato quota annuale).
  - Gestione autonoma della propria scheda attività (nome, categoria, recapiti, orari, servizi, descrizione).
  - Tracciamento visivo dello stato di pubblicazione (`BOZZA`, `IN_ATTESA_APPROVAZIONE`, `PUBBLICATA`, `SOSPESA`).
  - Pulsante formale di richiesta pubblicazione (con blocco automatico preventivo se il socio è sospeso).
  - Selettore persone demo per testare l'esperienza di soci attivi o sospesi.
- **Pannello di Amministrazione e Vigilanza (`ShowcaseAdminScreen`):**
  - Coda di revisione delle schede sottomesse dai soci (approvazione, sospensione o richiesta chiarimenti).
  - Gestione in tempo reale del Libro Soci (attivazione/sospensione con effetto immediato sulla vetrina).
  - Registro delle attività con stato editoriale e motivazioni di sospensione.
  - Matrice RBAC dimostrativa e registro di audit delle operazioni.
- **Suite di Test Automatizzati:**
  - Aggiunti test Robolectric/JVM dedicati (`ProLocalShowcaseTest`) che certificano formalmente la regola fondamentale, la reattività della sospensione/riattivazione e la sottomissione delle schede.
- **Documentazione Allineata:**
  - Aggiornati tutti i 7 documenti in `/docs` e la documentazione in-app per riflettere le nuove funzionalità e le decisioni architetturali.

---

### Versione 0.1.0-alpha (Fase 1 - Fondazione del Progetto)
* **Data di Rilascio:** 2026-09-07
* **Tipologia:** Release Iniziale / Architettura Base

#### Nuove Funzionalità & Struttura Implementate:
- **Identità di Piattaforma:** Configurazione del progetto come **Pro-Local**, con icone vettoriali adattive civiche, tema con palette blu istituzionale/ardesia e metadata allineati.
- **Layout Responsive Multi-Dispositivo:** Supporto adattivo per smartphone (navigazione inferiore/drawer), tablet e desktop/computer (NavigationRail e griglie flessibili).
- **Dashboard Iniziale:** Panoramica dello stato associativo, conteggio sintetico dei moduli, monitoraggio dei requisiti definiti vs da definire, log delle attività recenti e promemoria delle regole del Consiglio.
- **Modulo Consiglio & Organi:**
  - Esposizione formale delle 4 cariche interne elette dall'Assemblea (Presidente, Vicepresidente, Segretario, Tesoriere).
  - Motore di simulazione e consultazione delle 5 regole consiliari definite: maggioranza presenti, parità con voto prevalente del Presidente, subentro primo non eletti con approvazione, disciplina revoca.
  - Disclaimer normativo esplicito per la conformità con l'ordinamento italiano.
- **Moduli Futuri Predisposti (con etichetta esplicita `[DA DEFINIRE]`):**
  - Sezioni predisposte per: Associati, Assemblea & Votazioni, Documenti & Verbali, Comunicazioni, Ruoli e Permessi.
  - Per ciascun modulo sono elencati gli elementi già predisposti a livello architetturale e le decisioni statutarie da definire prima dell'implementazione.
- **Visualizzatore Integrato della Documentazione:**
  - Navigazione e lettura diretta in-app di tutte le 7 categorie di documentazione di progetto, con filtro per categoria e indicatori di completezza.
- **Separazione dei Livelli:** Struttura `core.model` e `core.data.ProLocalRepository` completamente disaccoppiata dalla UI, con dati rigorosamente dimostrativi.
- **Predisposizione GitHub:** Documentazione completa in formato Markdown nella directory `/docs` e file `README.md` principale.
