# Pro-Local - Documentazione di Progetto
## 06. Regole dell'Associazione e Disciplina del Consiglio

### 6.1 Natura e Inquadramento
* **Forma associativa:** Associazione non riconosciuta (art. 36 e ss. c.c.).
* **Prospettiva RUNTS:** Predisposizione per l'adeguamento ai requisiti del D.Lgs. 117/2017 (Codice Terzo Settore).
* **AVVISO IMPORTANTE:** Queste regole costituiscono requisiti del progetto software, ma non devono essere interpretate come consulenza legale. Eventuali incompatibilità con la normativa italiana dovranno essere evidenziate e verificate prima dell'implementazione definitiva.

---

### 6.2 Regole Già Definite per il Consiglio Direttivo [DEFINITO]

#### Regola 1: Elezione Diretta delle Quattro Cariche Interne
* **Enunciato:** Le quattro cariche interne del Consiglio vengono elette direttamente dall'Assemblea dei soci.
* **Cariche interne:**
  1. Presidente
  2. Vicepresidente
  3. Segretario
  4. Tesoriere
* **Implicazione Software:** L'Assemblea esprime una votazione specifica per ciascuna delle 4 cariche (oppure su scheda elettorale con preferenze per carica), anziché delegare l'attribuzione delle cariche all'insediamento interno del Consiglio.
* **Nota di verifica normativa:** Nel Terzo Settore e nel diritto associativo ordinario, l'elezione diretta da parte dell'Assemblea delle singole cariche è ammissibile purché prevista statutariamente.

#### Regola 2: Approvazione a Maggioranza dei Presenti
* **Enunciato:** Le deliberazioni del Consiglio vengono approvate a maggioranza dei presenti.
* **Implicazione Software:** Il quorum deliberativo del Consiglio si calcola sul totale dei consiglieri fisicamente o telematicamente presenti alla seduta (`favorevoli > contrari` o `favorevoli >= floor(presenti/2) + 1`).

#### Regola 3: Prevalenza del Voto del Presidente in Parità
* **Enunciato:** In caso di parità nel Consiglio prevale il voto del Presidente (casting vote).
* **Implicazione Software:** Qualora i voti favorevoli e contrari risultino identici, la deliberazione è approvata se il Presidente ha espresso voto favorevole; è respinta se il Presidente ha votato contro.

#### Regola 4: Subentro del Primo dei Non Eletti
* **Enunciato:** In caso di cessazione (per dimissioni, decadenza o decesso) di un consigliere, è previsto il subentro del primo dei non eletti, previa espressa approvazione dell'interessato.
* **Implicazione Software:**
  1. Il sistema mantiene la graduatoria ufficiale dell'ultima elezione assembleare.
  2. In caso di vacanza, genera una proposta di subentro indirizzata al primo dei non eletti disponibile.
  3. Il subentro diviene efficace solo a seguito di formale registrazione dell'accettazione da parte del subentrante. In caso di rinuncia, la proposta scala al secondo dei non eletti.

#### Regola 5: Disciplina per la Revoca del Singolo Consigliere
* **Enunciato:** È prevista una specifica disciplina per la revoca del singolo consigliere.
* **Implicazione Software:** Il sistema deve prevedere il flusso di mozione di revoca, indicando gli organi competenti a proporla e deliberarla.

---

### 6.3 Punti Statutari Aperti [DA DEFINIRE]
1. `[DA DEFINIRE]` Maggioranza qualificata o semplice per l'approvazione della mozione di revoca di un consigliere.
2. `[DA DEFINIRE]` Numero totale dei consiglieri che compongono il Consiglio Direttivo oltre alle 4 cariche.
3. `[DA DEFINIRE]` Durata temporale in anni del mandato del Consiglio Direttivo e rieleggibilità.
4. `[DA DEFINIRE]` Quorum costitutivo formale per la validità delle adunanze consiliari.
5. `[DA DEFINIRE]` Condizioni di incompatibilità tra cariche interne (es. cumulabilità tra Segretario e Tesoriere, oppure divieto).

---

### 6.4 Regole della Vetrina Digitale e Requisiti di Pubblicazione [DEFINITO]

#### Regola Fondamentale della Vetrina
* **Enunciato:** Un'attività commerciale, artigianale o professionale può essere pubblicata ed esposta nella vetrina pubblica SOLO se è collegata a una persona che risulta **SOCIO ATTIVO** dell'associazione Pro-Local.
* **Implicazione Software:**
  1. Il sistema verifica a runtime e a livello di query lo status associativo del socio titolare (`statoAssociativo == MembershipStatus.ATTIVO`).
  2. In caso di transizione dello stato del socio a `SOSPESO`, `RECEDUTO` o `ESCLUSO`, la scheda dell'attività viene istantaneamente resa invisibile nei risultati pubblici e nella vista di dettaglio della vetrina.
  3. L'amministrazione dell'associazione esercita vigilanza su ogni nuova scheda o modifica rilevante prima della messa online (`statoPubblicazione == PublicationStatus.PUBBLICATA`).

#### Regola di Tutela Istituzionale e Divieto di Intermediazione
* La piattaforma non percepisce provvigioni né percentuali sulle transazioni tra visitatori e attività dei soci.
* L'associazione non è parte contrattuale dei contratti d'opera o di vendita conclusi tra i soci e i loro clienti o committenti.
* La vetrina funge da strumento promozionale istituzionale per accrescere la visibilità delle eccellenze locali aggregate nella compagine sociale.

---

### 6.5 Aspetti Aperti della Vetrina non Definitivi [DA DEFINIRE]
In conformità con il mandato del progetto, i seguenti aspetti **NON sono considerati regole definitive** e restano aperti a future determinazioni:
1. `[DA DEFINIRE]` **Numero di attività per socio:** rapporto 1:1 o 1:N tra socio e attività pubblicabili.
2. `[DA DEFINIRE]` **Obbligatorietà dei singoli campi della scheda:** determinazione tassativa dei campi obbligatori minimi per la richiesta di pubblicazione.
3. `[DA DEFINIRE]` **Modalità definitive di approvazione:** procedura formale (es. delibera del Consiglio vs istruttoria delegata alla Segreteria).
4. `[DA DEFINIRE]` **Tassonomia definitiva delle categorie:** approvazione formale dell'elenco delle categorie merceologiche e delle modalità di richiesta nuove categorie.
5. `[DA DEFINIRE]` **Recensioni e reputazione:** escluse recensioni pubbliche e commerciali libere; da definire eventuale sistema di attestazioni interne.
6. `[DA DEFINIRE]` **Geolocalizzazione e mappe:** selezione della tecnologia cartografica conforme al principio di minimizzazione dati (GDPR).
7. `[DA DEFINIRE]` **Messaggistica interna:** modalità e limiti di eventuale contatto in-app.
8. `[DA DEFINIRE]` **Pagamenti, quote e abbonamenti:** esclusa categoricamente ogni transazione commerciale; da definire l'eventuale rinnovo online della quota annuale d'iscrizione.
9. `[DA DEFINIRE]` **Altre funzionalità commerciali:** vietata l'introduzione di strumenti e-commerce privi di previsione statutaria.
