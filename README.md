# Pro-Local

Piattaforma digitale per la gestione dell'associazione e vetrina pubblica delle attività dei soci.

> **Stato Progetto:** Fase 2 - Vetrina Digitale & Area Soci Integrata (Versione 0.2.0-beta)  
> **Natura Giuridica dell'Ente:** Associazione non riconosciuta (predisposta per futura iscrizione al RUNTS).  
> **Due Dimensioni:** 1. Gestione associativa interna; 2. Portale vetrina pubblica delle attività dei soci.

---

## 🌟 Il Cuore della Web App: Vetrina Digitale dei Soci

Pro-Local funziona come vetrina promozionale territoriale per i servizi, i prodotti e le attività professionali degli associati:
- Ricerca libera per servizio, parola chiave e categorie merceologiche
- Schede dettagliate con contatti diretti, elenco servizi, orari e link social
- Badge istituzionale di garanzia "Attività Verificata - Socio Pro-Local Attivo"

### 🛡️ Regola Fondamentale di Visibilità
> **Un'attività può essere pubblicata nella vetrina SOLO se è collegata a una persona che risulta SOCIO ATTIVO dell'associazione.**
> Se lo stato del socio diviene non attivo (sospeso, receduto o escluso), la scheda viene istantaneamente oscurata dal portale pubblico.

---

## 🏛️ Gestione Digitale dell'Associazione
Pro-Local supporta la vita democratica e amministrativa dell'ente:
- Gestione associati e libro soci in tempo reale
- Organi statutari (Assemblea, Consiglio Direttivo con 4 cariche elette direttamente)
- Regole del Consiglio consolidate (maggioranza presenti, casting vote Presidente, subentro primo non eletti, disciplina revoca)
- Area Riservata Socio per compilazione e sottomissione scheda attività
- Area Amministrazione per revisione pubblicazioni e vigilanza statutaria

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
