# Pro-Local - Documentazione di Progetto
## 04. Infrastruttura e Rete

### 4.1 Fase 1: Ambiente Locale e Dimostrativo
* **Esecuzione:** Client-side standalone su runtime Kotlin/Compose.
* **Persistenza:** Memoria locale applicativa (in-memory mock con modelli persistibili).
* **Dipendenze Esterne:** Nessuna chiamata di rete attiva in questa fase; assenza di dipendenze di rete bloccanti.

### 4.2 Fase Futura: Pubblicazione Online e Rete [DA DEFINIRE]
Per la futura pubblicazione online come servizio cloud per l'associazione, l'infrastruttura di riferimento prevista comprende:

1. **Protocolli e Cifratura:**
   - HTTPS / TLS 1.3 obbligatorio per tutte le comunicazioni.
   - HSTS (HTTP Strict Transport Security) per prevenire downgrade.
2. **Backend e API [DA DEFINIRE]:**
   - API RESTful o gRPC per il dialogo tra frontend web/mobile e server.
   - Gateway con Rate Limiting e protezione DDoS.
3. **Database e Storage [DA DEFINIRE]:**
   - Database relazionale (PostgreSQL / SQLite con crittografia at-rest) per la gestione di libro soci, verbali e deliberazioni.
   - Storage cifrato (es. S3-compatible / Cloud Storage con ACL private) per i documenti PDF dei verbali e degli allegati.
4. **Ambiente di Hosting [DA DEFINIRE]:**
   - Container Docker / Kubernetes o Cloud Server con geolocalizzazione dei dati in conformità con la normativa europea (GDPR).
   - Backup periodici automatizzati e cifrati off-site.
