# Pro-Local - Documentazione di Progetto
## 04. Infrastruttura e Rete

### 4.1 Architettura di Rete della Piattaforma Web (Implementata)

L'infrastruttura di rete della piattaforma Web ufficiale si articola come segue:

1. **Backend REST API (Node.js + Express):**
   - In ascolto su porta configurabile tramite variabile d'ambiente `PORT` (default: 3001).
   - Espone endpoint JSON per la consultazione pubblica (`/api/showcase`, `/api/activities/:id`, `/api/health`) e per le operazioni autenticate (`/api/auth/*`, `/api/members/me`, `/api/activities/:id`).
   - Gestione CORS centralizzata: restringe le origini autorizzate tramite la variabile d'ambiente `ALLOWED_ORIGINS` (default locale: `http://localhost:3000`, `http://localhost:5173`), consentendo il transito dei cookie con `credentials: true`.

2. **Sicurezza del Canale di Trasporto e Cookie di Sessione:**
   - Il cookie di sessione `prolocal_session` è configurato con:
     - `HttpOnly: true` (protezione assoluta contro letture malevole da script client-side);
     - `SameSite: 'lax'` (mitigazione di richieste cross-site);
     - `Path: '/'`;
     - `Max-Age: 28800` (8 ore di validità massima);
     - `Secure: true` abilitato automaticamente quando `NODE_ENV === 'production'`, richiedendo canale cifrato HTTPS/TLS.

3. **Protezione Anti-CSRF (Transport Level):**
   - Tutte le richieste HTTP che provocano mutazioni (`POST`, `PUT`, `PATCH`, `DELETE`) effettuate con cookie di sessione attivo richiedono obbligatoriamente l'header HTTP personalizzato `X-Requested-With: ProLocalApp`.
   - Le richieste cross-origin che tentano di iniettare header personalizzati vengono bloccate dai browser tramite il meccanismo di preflight CORS (OPTIONS).

4. **Infrastruttura Database Relazionale (PostgreSQL):**
   - Connessione gestita tramite connection pool nativo (`pg.Pool`).
   - Parametri configurabili tramite `DATABASE_URL` oppure singole variabili d'ambiente (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGSSL`).
   - Gestione transazionale DDL con rollback automatico in caso di errore durante l'applicazione delle migrazioni.
   - Pulizia periodica automatica delle sessioni scadute (`SessionCleanupService`) a intervalli di 60 minuti con isolamento degli errori.

---

### 4.2 Aspetti Infrastrutturali Futuri e di Deployment [DA DEFINIRE]

I seguenti aspetti operativi non sono attualmente cablati nel repository e restano da definire in sede di rilascio in produzione:

1. **Reverse Proxy e Terminazione TLS [DA DEFINIRE]:**
   - Configurazione di Nginx, Caddy o load balancer cloud per la terminazione TLS 1.3 e l'inoltro corretto degli header `X-Forwarded-For` e `X-Forwarded-Proto`.
2. **Caching Vetrina Pubblica [DA DEFINIRE]:**
   - Eventuale adozione di CDN o Edge Cache per le schede pubbliche, con meccanismo perentorio di invalidazione istantanea nel momento in cui un socio passa a stato non attivo.
3. **Provider di Hosting e Container Orchestration [DA DEFINIRE]:**
   - L'ambiente include un `docker-compose.yml` di riferimento per PostgreSQL, ma la piattaforma di hosting definitiva (VPS, cloud gestito o PaaS) rimane da deliberare.
4. **Storage Documentale Cifrato [DA DEFINIRE]:**
   - Eventuale storage compatibile S3 o bucket protetto per archiviazione di verbali assembleari e bilanci firmati.
