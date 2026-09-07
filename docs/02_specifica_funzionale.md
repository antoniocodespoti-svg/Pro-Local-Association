# Pro-Local - Documentazione di Progetto
## 02. Specifica Funzionale

Questa specifica definisce lo stato di avanzamento e i requisiti di ciascun modulo di Pro-Local.

---

### Modulo 1: Organi dell'Associazione e Consiglio Direttivo
* **Stato complessivo:** `[PARZIALMENTE DEFINITO]`

#### Requisiti Consolidati [DEFINITO]:
1. **Quattro Cariche Interne:** Le 4 cariche interne del Consiglio Direttivo vengono elette direttamente dall'Assemblea dei soci.
   - Presidente
   - Vicepresidente
   - Segretario
   - Tesoriere
2. **Approvazione delle Deliberazioni:** Le deliberazioni del Consiglio sono approvate a maggioranza dei consiglieri presenti.
3. **Risoluzione Parità:** In caso di parità nei voti del Consiglio, prevale il voto del Presidente.
4. **Cessazione Consigliere e Subentro:** In caso di dimissioni, decadenza o cessazione di un consigliere, è previsto il subentro del primo dei non eletti nella graduatoria assembleare, subordinatamente all'approvazione espressa dell'interessato.
5. **Revoca del Singolo Consigliere:** È prevista una disciplina esplicita per la revoca del singolo consigliere.

#### Requisiti da Definire [DA DEFINIRE]:
- `[DA DEFINIRE]` Numero totale dei membri del Consiglio Direttivo (es. numero fisso o intervallo min-max).
- `[DA DEFINIRE]` Quorum costitutivo formale per la validità delle sedute di Consiglio.
- `[DA DEFINIRE]` Modalità e maggioranze per l'attivazione e l'approvazione della revoca del singolo consigliere.
- `[DA DEFINIRE]` Termine temporale per l'accettazione del subentro da parte del primo dei non eletti.

---

### Modulo 2: Associati e Tesseramento
* **Stato complessivo:** `[DA DEFINIRE]`
* **Predisposizione Architetturale:**
  - Anagrafica socio con protezione dati personali (visibilità minima, conformità GDPR).
  - Stati socio: Richiedente, Attivo, Sospeso, Receduto, Escluso.
  - Libro soci digitale con storicizzazione iscrizioni e rinnovi quote.
* **Punti da stabilire statutariamente:**
  - `[DA DEFINIRE]` Criteri e requisiti per l'ammissione a nuovo socio.
  - `[DA DEFINIRE]` Organo competente per l'approvazione della domanda di adesione.
  - `[DA DEFINIRE]` Disciplina dei diritti di elettorato attivo e passivo (es. anzianità associativa).
  - `[DA DEFINIRE]` Categorie di soci (ordinari, sostenitori, onorari, ecc.).

---

### Modulo 3: Assemblea dei Soci
* **Stato complessivo:** `[DA DEFINIRE]`
* **Predisposizione Architetturale:**
  - Convocazioni ordinarie e straordinarie.
  - Gestione ordine del giorno (ODG).
  - Tracciamento presenze e deleghe.
* **Punti da stabilire statutariamente:**
  - `[DA DEFINIRE]` Modalità e preavviso formale di convocazione (email, raccomandata, albo).
  - `[DA DEFINIRE]` Quorum costitutivo e deliberativo di prima e seconda convocazione.
  - `[DA DEFINIRE]` Numero massimo di deleghe conferibili a un singolo associato.

---

### Modulo 4: Candidature ed Elezioni
* **Stato complessivo:** `[DA DEFINIRE]`
* **Predisposizione Architetturale:**
  - Presentazione liste / candidature singole per le 4 cariche e per i consiglieri.
  - Generazione graduatoria elettorale con elenco eletti e lista dei non eletti per eventuali subentri.
* **Punti da stabilire statutariamente:**
  - `[DA DEFINIRE]` Termini di apertura e chiusura presentazione candidature.
  - `[DA DEFINIRE]` Metodo elettorale (voto disgiunto, preferenze multiple, collegio unico).

---

### Modulo 5: Votazioni e Deliberazioni
* **Stato complessivo:** `[DA DEFINIRE]` (eccetto regola deliberazioni del Consiglio `[DEFINITO]`).
* **Predisposizione Architetturale:**
  - Schede di voto digitali (palesi o segrete).
  - Calcolo automatico della maggioranza dei presenti per il Consiglio Direttivo.
  - Meccanismo di voto prevalente del Presidente in parità consiliare.
* **Punti da stabilire statutariamente:**
  - `[DA DEFINIRE]` Piattaforma tecnica per il voto elettronico certificato (segretezza vs tracciabilità).
  - `[DA DEFINIRE]` Casi di voto a scrutinio segreto obbligatorio in Assemblea.

---

### Modulo 6: Documenti, Comunicazioni e Verbali
* **Stato complessivo:** `[DA DEFINIRE]`
* **Predisposizione Architetturale:**
  - Repository documentale con metadati e classificazione riservatezza.
  - Redazione, firma/approvazione e archiviazione verbali di Consiglio e di Assemblea.
  - Registro comunicazioni istituzionali inviate agli associati.
* **Punti da stabilire statutariamente:**
  - `[DA DEFINIRE]` Modalità di pubblicazione e accesso ai verbali da parte dei soci.
  - `[DA DEFINIRE]` Firma dei verbali (firma autografa, digitale o approvazione telematica).

---

### Modulo 7: Ruoli e Permessi (RBAC)
* **Stato complessivo:** `[DA DEFINIRE]`
* **Predisposizione Architetturale:**
  - Matrice RBAC (Role-Based Access Control) con principio di minimo privilegio.
  - Ruoli previsti: Presidente, Vicepresidente, Segretario, Tesoriere, Consigliere, Socio Ordinario, Amministratore Sistema.
* **Punti da stabilire:**
  - `[DA DEFINIRE]` Diritti specifici di modifica su bilanci e libro soci.
