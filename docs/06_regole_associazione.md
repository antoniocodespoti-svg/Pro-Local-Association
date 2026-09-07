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
