import { createProLocalApp } from './app.ts';
import { createPgPool } from './db/connection.ts';
import { DatabaseMigrator } from './db/migrator.ts';
import { PostgresMemberRepository } from './repositories/PostgresMemberRepository.ts';
import { PostgresBusinessActivityRepository } from './repositories/PostgresBusinessActivityRepository.ts';
import { PostgresAuditLogRepository } from './repositories/PostgresAuditLogRepository.ts';
import { seedDemoData } from './db/seeds/demoSeed.ts';

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
      auditRepo: new PostgresAuditLogRepository(pool)
    };
  }

  const app = createProLocalApp(customRepos);

  app.listen(PORT, () => {
    console.log(`[Pro-Local REST API] Server avviato su http://localhost:${PORT}`);
    console.log(`[Pro-Local REST API] Driver di persistenza attivo: ${DB_DRIVER.toUpperCase()}`);
    console.log('[Pro-Local REST API] Endpoints attivi:');
    console.log(' - GET /api/showcase');
    console.log(' - GET /api/activities/:id');
    console.log(' - GET /api/members/me');
    console.log(' - PUT /api/activities/:id');
  });
}

bootstrap().catch(err => {
  console.error('[Pro-Local] Errore fatale durante l\'avvio:', err);
  process.exit(1);
});
