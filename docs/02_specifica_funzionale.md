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
* **Stato complessivo:** `[PARZIALMENTE DEFINITO]`
* **Predisposizione Architetturale:**
  - Matrice RBAC (Role-Based Access Control) con principio di minimo privilegio.
  - Ruoli previsti: Visitatore Pubblico, Socio Ordinario, Segreteria / Amministrazione, Consiglio Direttivo, Amministratore Sistema.
* **Punti da stabilire statutariamente:**
  - `[DA DEFINIRE]` Diritti specifici di modifica su bilanci e libro soci.
  - `[DA DEFINIRE]` Criteri per la nomina di amministratori tecnici di sistema.

---

### Modulo 8: Vetrina Pubblica delle Attività dei Soci
* **Stato complessivo:** `[DEFINITO]`
* **Requisiti Consolidati [DEFINITO]:**
  1. **Regola Fondamentale di Visibilità:** Un'attività può essere pubblicata ed esposta nella vetrina SOLO ed ESCLUSIVAMENTE se è collegata a una persona che risulta **SOCIO ATTIVO** dell'associazione.
  2. **Oscuramento Automatico:** Se un socio passa a stato non attivo (SOSPESO, RECEDUTO, IN_ATTESA), la sua attività viene immediatamente e automaticamente oscurata dalla vetrina pubblica.
  3. **Ricerca e Consultazione Libera:** Accessibile a qualunque visitatore, con ricerca testuale libera, filtri per categoria e filtri territoriali.
  4. **Scheda Dettagliata dell'Attività:** Include nome attività, categoria, descrizione, elenco servizi, recapiti pubblici e orari.
  5. **Badge di Certificazione:** Ogni scheda espone visibilmente il sigillo di "Attività Verificata - Socio Pro-Local Attivo" con codice tessera socio.
* **Aspetti Aperti non Definitivi [DA DEFINIRE]:**
  - `[DA DEFINIRE]` **Numero di attività per socio:** attualmente impostato a 1 attività per socio a scopo dimostrativo; la possibilità di gestire più attività per il medesimo socio (rapporto 1 a N) è da definire con apposita delibera.
  - `[DA DEFINIRE]` **Obbligatorietà dei singoli dati della scheda:** elenco definitivo dei campi obbligatori vs facoltativi (es. telefono fisso, social, orari).
  - `[DA DEFINIRE]` **Modalità definitive di approvazione:** iter formale per la revisione (delibera consiliare, delega alla segreteria o meccanismo con termine perentorio).
  - `[DA DEFINIRE]` **Regole definitive sulle categorie:** tassonomia merceologica finale e criteri di assegnazione/richiesta di nuove categorie.
  - `[DA DEFINIRE]` **Recensioni e valutazioni:** attualmente escluse; da valutare solo se circoscritte a feedback istituzionali tra soci certificati, escludendo recensioni commerciali aperte.
  - `[DA DEFINIRE]` **Geolocalizzazione avanzata e mappe:** integrazione cartografica interattiva e calcolo percorsi, subordinata a selezione provider GDPR-compliant senza tracciamento.
  - `[DA DEFINIRE]` **Messaggistica diretta in-app:** da valutare in relazione agli oneri di moderazione e alla normativa privacy.
  - `[DA DEFINIRE]` **Pagamenti, quote e abbonamenti:** esclusa qualsiasi forma di e-commerce o intermediario di pagamento; l'eventuale rinnovo telematico della sola quota associativa resta da definire.
  - `[DA DEFINIRE]` **Altre funzionalità commerciali:** escluso qualsiasi modello a pagamento o provvigione commerciale, incompatibile con la natura associativa.

---

### Modulo 9: Area Riservata Socio
* **Stato complessivo:** `[DEFINITO]`
* **Requisiti Consolidati [DEFINITO]:**
  1. **Accesso e Profilo:** Visualizzazione anagrafica socio, codice tessera, data di ammissione e stato associativo in tempo reale.
  2. **Gestione Scheda Attività:** Compilazione, modifica e aggiornamento autonomo dei dati della propria attività commerciale/professionale.
  3. **Monitoraggio Ciclo di Vita:** Stato della pubblicazione visibile in ogni momento: `BOZZA`, `IN_ATTESA_APPROVAZIONE`, `PUBBLICATA`, `SOSPESA`, `RIFIUTATA`.
  4. **Sottomissione Formale:** Possibilità di richiedere la pubblicazione o una nuova approvazione; blocco automatico della richiesta se il socio non è in regola.
  5. **Anteprima Pubblica:** Visualizzazione fedele di come la scheda appare ai visitatori nella vetrina.
* **Requisiti da Definire [DA DEFINIRE]:**
  - `[DA DEFINIRE]` Rinnovo e pagamento telematico della quota associativa annuale.
  - `[DA DEFINIRE]` Caricamento autonomo di gallerie fotografiche e loghi vettoriali.

---

### Modulo 10: Amministrazione e Vigilanza Vetrina
* **Stato complessivo:** `[DEFINITO]`
* **Requisiti Consolidati [DEFINITO]:**
  1. **Coda di Revisione:** Revisione delle schede sottomesse dai soci, approvazione con pubblicazione o sospensione motivata con note.
  2. **Libro Soci e Controllo Visibilità:** Modifica dello stato dei soci con impatto diretto e reattivo istantaneo sulla vetrina.
  3. **Audit Log Istituzionale:** Tracciamento non ripudiabile di ogni cambio di stato, pubblicazione o sospensione.
