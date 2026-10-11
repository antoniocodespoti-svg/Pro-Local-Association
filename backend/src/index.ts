import { createProLocalApp } from './app.ts';
import { createPgPool } from './db/connection.ts';
import { DatabaseMigrator } from './db/migrator.ts';
import { PostgresMemberRepository } from './repositories/PostgresMemberRepository.ts';
import { PostgresBusinessActivityRepository } from './repositories/PostgresBusinessActivityRepository.ts';
import { PostgresActivityRevisionRepository } from './repositories/PostgresActivityRevisionRepository.ts';
import { PostgresAuditLogRepository } from './repositories/PostgresAuditLogRepository.ts';
import { PostgresUserAccountRepository } from './repositories/PostgresUserAccountRepository.ts';
import { PostgresSessionRepository } from './repositories/PostgresSessionRepository.ts';
import { seedDemoData } from './db/seeds/demoSeed.ts';
import { SessionCleanupService } from './services/SessionCleanupService.ts';

const PORT = process.env.PORT || 3001;
const DB_DRIVER = process.env.DB_DRIVER || 'memory';

async function bootstrap() {
  let customRepos = undefined;

  if (DB_DRIVER === 'postgres') {
    console.log('[Pro-Local DB] Inizializzazione PostgreSQL connection pool...');
    const pool = createPgPool();
    const migrator = new DatabaseMigrator(pool);

    console.log('[Pro-Local DB] Verifica ed esecuzione migrazioni...');
    const migRes = await migrator.runMigrations();
    if (migRes.applied.length > 0) {
      console.log(`[Pro-Local DB] Migrazioni applicate con successo: ${migRes.applied.join(', ')}`);
    } else {
      console.log('[Pro-Local DB] Schema database già aggiornato.');
    }

    if (process.env.SEED_DEMO_DATA === 'true') {
      console.log('[Pro-Local DB] Popolamento dati demo iniziale...');
      const seedRes = await seedDemoData(pool);
      console.log(`[Pro-Local DB] Seed completato: ${seedRes.membersCount} soci, ${seedRes.activitiesCount} attività.`);
    }

    customRepos = {
      memberRepo: new PostgresMemberRepository(pool),
      activityRepo: new PostgresBusinessActivityRepository(pool),
      revisionRepo: new PostgresActivityRevisionRepository(pool),
      auditRepo: new PostgresAuditLogRepository(pool),
      userAccountRepo: new PostgresUserAccountRepository(pool),
      sessionRepo: new PostgresSessionRepository(pool),
      dbClient: pool
    };
  }

  let cleanupService: SessionCleanupService | null = null;
  if (customRepos?.sessionRepo) {
    cleanupService = new SessionCleanupService(customRepos.sessionRepo);
    cleanupService.start();
    console.log('[Pro-Local DB] Cleanup periodico sessioni scadute avviato (intervallo: 60 minuti).');
  }

  const app = createProLocalApp(customRepos);

  const server = app.listen(PORT, () => {
    console.log(`[Pro-Local REST API] Server avviato su http://localhost:${PORT}`);
    console.log(`[Pro-Local REST API] Driver di persistenza attivo: ${DB_DRIVER.toUpperCase()}`);
    console.log('[Pro-Local REST API] Autenticazione: Sessione HTTP reale basata su cookie HttpOnly');
    console.log('[Pro-Local REST API] Endpoints attivi:');
    console.log(' - POST /api/auth/login');
    console.log(' - POST /api/auth/logout');
    console.log(' - GET /api/auth/me');
    console.log(' - GET /api/showcase');
    console.log(' - GET /api/activities/:id');
    console.log(' - GET /api/members/me');
    console.log(' - PUT /api/activities/:id');
    console.log(' - GET /api/president/revisions/pending');
    console.log(' - GET /api/president/revisions/:id');
    console.log(' - POST /api/president/revisions/:id/approve');
    console.log(' - POST /api/president/revisions/:id/reject');
  });

  const gracefulShutdown = () => {
    console.log('[Pro-Local] Ricevuto segnale di terminazione, arresto del server...');
    if (cleanupService) {
      cleanupService.stop();
      console.log('[Pro-Local] Servizio di session cleanup arrestato.');
    }
    server.close(() => {
      console.log('[Pro-Local] Server HTTP arrestato con successo.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

bootstrap().catch(err => {
  console.error('[Pro-Local] Errore fatale durante l\'avvio:', err);
  process.exit(1);
});
