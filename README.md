# Pro-Local

Piattaforma digitale modulare per la gestione dell'associazione.

> **Stato Progetto:** Fase 1 - Struttura Iniziale & Governance Base  
> **Natura Giuridica dell'Ente:** Associazione non riconosciuta (predisposta per futura iscrizione al RUNTS).  
> **Requisiti:** Distinzione rigorosa tra regole consolidate `[DEFINITO]` e aspetti aperti `[DA DEFINIRE]`.

---

## 🏛️ Obiettivo
Pro-Local nasce per supportare digitalmente la vita democratica e amministrativa dell'associazione:
- Gestione associati e libro soci
- Organi statutari (Assemblea, Consiglio Direttivo)
- Candidature, elezioni e votazioni
- Deliberazioni e verbali
- Documenti e comunicazioni istituzionali
- Gestione granulare di ruoli e permessi

---

## ⚖️ Regole Fondamentali Già Definite per il Consiglio
1. **Quattro cariche interne elette direttamente dall'Assemblea**: Presidente, Vicepresidente, Segretario, Tesoriere.
2. **Approvazione a maggioranza dei presenti**: le deliberazioni del Consiglio richiedono la maggioranza dei voti dei presenti.
3. **Voto prevalente del Presidente in caso di parità**: in caso di parità, il voto del Presidente determina l'esito.
4. **Subentro del primo dei non eletti**: in caso di cessazione, subentra il primo dei non eletti previa espressa approvazione dell'interessato.
5. **Disciplina per la revoca del singolo consigliere**: prevista esplicita disciplina di revoca.

*Nota di conformità:* Queste regole costituiscono requisiti del progetto software e non costituiscono consulenza legale. Eventuali incompatibilità con la normativa italiana dovranno essere verificate prima dell'implementazione definitiva.

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
