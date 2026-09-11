import { describe, it } from 'node:test';
import assert from 'node:assert';
import { newDb } from 'pg-mem';
import { DatabaseMigrator, MIGRATIONS } from '../src/db/migrator.ts';
import { createPgPool } from '../src/db/connection.ts';
import { getDatabaseConfig } from '../src/db/config.ts';
import { PostgresMemberRepository } from '../src/repositories/PostgresMemberRepository.ts';
import { PostgresBusinessActivityRepository } from '../src/repositories/PostgresBusinessActivityRepository.ts';
import { PostgresAuditLogRepository } from '../src/repositories/PostgresAuditLogRepository.ts';
import { InMemoryAuditLogRepository } from '../src/repositories/AuditLogRepository.ts';
import { seedDemoData, DEMO_MEMBERS, DEMO_ACTIVITIES } from '../src/db/seeds/demoSeed.ts';
import {
  MembershipStatus,
  PublicationStatus,
  ActivityCategory
} from '../src/domain/models.ts';
import type { Member, BusinessActivity, AuditLogEntry } from '../src/domain/models.ts';
import { ShowcaseService } from '../src/services/ShowcaseService.ts';

describe('PostgreSQL Adapter & Migrations Tests (via pg-mem)', () => {
  function createTestDb() {
    const mem = newDb({ noAstCoverageCheck: true });
    const adapter = mem.adapters.createPg();
    const pool = new adapter.Pool();
    return { mem, pool };
  }

  it('esegue le migrazioni 001, 002, 003, 004 con successo', async () => {
    const { pool } = createTestDb();
    const migrator = new DatabaseMigrator(pool);

    const res = await migrator.runMigrations();
    assert.strictEqual(res.alreadyUpToDate, false);
    assert.deepStrictEqual(res.applied, [
      '001_create_members',
      '002_create_business_activities',
      '003_create_audit_logs',
      '004_create_auth_tables'
    ]);

    const appliedAgain = await migrator.runMigrations();
    assert.strictEqual(appliedAgain.alreadyUpToDate, true);
    assert.strictEqual(appliedAgain.applied.length, 0);
  });

  it('popola i dati dimostrativi seedDemoData e rispetta le relazioni', async () => {
    const { pool } = createTestDb();
    const migrator = new DatabaseMigrator(pool);
    await migrator.runMigrations();

    const counts = await seedDemoData(pool);
    assert.strictEqual(counts.membersCount, DEMO_MEMBERS.length);
    assert.strictEqual(counts.activitiesCount, DEMO_ACTIVITIES.length);

    // Secondo run idempotente
    const counts2 = await seedDemoData(pool);
    assert.strictEqual(counts2.membersCount, 0);
    assert.strictEqual(counts2.activitiesCount, 0);
  });

  it('PostgresMemberRepository: implementa findById, findAll, updateStatus e create', async () => {
    const { pool } = createTestDb();
    const migrator = new DatabaseMigrator(pool);
    await migrator.runMigrations();

    const repo = new PostgresMemberRepository(pool);

    const newMember: Member = {
      id: 'socio-pg-1',
      codiceSocio: 'SOC-PG-001',
      nomeCognome: 'Giulia Manieri',
      emailDemo: 'giulia@demo.it',
      dataIscrizione: '2024-05-01',
      statoAssociativo: MembershipStatus.ATTIVO,
      quotaSocialeInRegola: true
    };
    await repo.create(newMember);

    const found = await repo.findById('socio-pg-1');
    assert.ok(found);
    assert.strictEqual(found.nomeCognome, 'Giulia Manieri');
    assert.strictEqual(found.statoAssociativo, MembershipStatus.ATTIVO);

    await repo.updateStatus('socio-pg-1', MembershipStatus.SOSPESO);
    const updated = await repo.findById('socio-pg-1');
    assert.ok(updated);
    assert.strictEqual(updated.statoAssociativo, MembershipStatus.SOSPESO);
    assert.strictEqual(updated.quotaSocialeInRegola, false);
  });

  it('PostgresBusinessActivityRepository: CRUD e integrazione con ShowcaseService', async () => {
    const { pool } = createTestDb();
    const migrator = new DatabaseMigrator(pool);
    await migrator.runMigrations();

    const memberRepo = new PostgresMemberRepository(pool);
    const actRepo = new PostgresBusinessActivityRepository(pool);

    // Creiamo socio attivo e socio sospeso
    await memberRepo.create({
      id: 'm-attivo',
      codiceSocio: 'SOC-ATT',
      nomeCognome: 'Socio Attivo',
      emailDemo: 'attivo@demo.it',
      dataIscrizione: '2024-01-01',
      statoAssociativo: MembershipStatus.ATTIVO,
      quotaSocialeInRegola: true
    });

    await memberRepo.create({
      id: 'm-sospeso',
      codiceSocio: 'SOC-SOSP',
      nomeCognome: 'Socio Sospeso',
      emailDemo: 'sospeso@demo.it',
      dataIscrizione: '2024-01-01',
      statoAssociativo: MembershipStatus.SOSPESO,
      quotaSocialeInRegola: false
    });

    // Attività 1: socio attivo, PUBBLICATA
    await actRepo.create({
      id: 'act-pub',
      memberId: 'm-attivo',
      nomeAttivita: 'Panificio Tradizionale',
      categoria: ActivityCategory.ENOGASTRONOMIA_LOCALE,
      descrizioneBreve: 'Pane a lievitazione naturale',
      descrizioneCompleta: 'Forno a legna storico con farine locali.',
      serviziOfferti: ['Pane fresco', 'Pizze e focacce'],
      localita: 'Centro',
      statoPubblicazione: PublicationStatus.PUBBLICATA,
      dataUltimoAggiornamento: '2024-06-01'
    });

    // Attività 2: socio attivo, BOZZA
    await actRepo.create({
      id: 'act-draft',
      memberId: 'm-attivo',
      nomeAttivita: 'Laboratorio Dolciario',
      categoria: ActivityCategory.ENOGASTRONOMIA_LOCALE,
      descrizioneBreve: 'Bozza pasticceria',
      descrizioneCompleta: 'Descrizione bozza',
      serviziOfferti: ['Biscotti'],
      localita: 'Centro',
      statoPubblicazione: PublicationStatus.BOZZA,
      dataUltimoAggiornamento: '2024-06-01'
    });

    // Attività 3: socio sospeso, PUBBLICATA
    await actRepo.create({
      id: 'act-sospeso',
      memberId: 'm-sospeso',
      nomeAttivita: 'Sartoria Storica',
      categoria: ActivityCategory.ARTIGIANATO_RESTAURO,
      descrizioneBreve: 'Abiti su misura',
      descrizioneCompleta: 'Abiti artigianali.',
      serviziOfferti: ['Sartoria'],
      localita: 'Borgo',
      statoPubblicazione: PublicationStatus.PUBBLICATA,
      dataUltimoAggiornamento: '2024-06-01'
    });

    // Verifica con ShowcaseService (regola di dominio vincolante: solo ATTIVO + PUBBLICATA)
    const showcaseService = new ShowcaseService(actRepo, memberRepo);
    const showcase = await showcaseService.getPublicShowcase();

    assert.strictEqual(showcase.length, 1);
    assert.strictEqual(showcase[0].id, 'act-pub');
    assert.strictEqual(showcase[0].nomeAttivita, 'Panificio Tradizionale');
  });

  it('PostgresAuditLogRepository: registra ed estrae le voci di audit log', async () => {
    const { pool } = createTestDb();
    const migrator = new DatabaseMigrator(pool);
    await migrator.runMigrations();

    const auditRepo = new PostgresAuditLogRepository(pool);

    const entry: AuditLogEntry = {
      id: 'log-001',
      actorId: 'admin-tech-01',
      action: 'DATABASE_BACKUP_EXECUTION',
      resourceType: 'SYSTEM',
      resourceId: 'PROLOCAL_DB',
      timestamp: new Date().toISOString(),
      metadata: { status: 'SUCCESS', tables: ['members', 'business_activities'] }
    };

    await auditRepo.log(entry);

    const logs = await auditRepo.findAll();
    assert.strictEqual(logs.length, 1);
    assert.strictEqual(logs[0].id, 'log-001');
    assert.strictEqual(logs[0].action, 'DATABASE_BACKUP_EXECUTION');
    assert.deepStrictEqual(logs[0].metadata, {
      status: 'SUCCESS',
      tables: ['members', 'business_activities']
    });
  });

  it('Configuration: getDatabaseConfig restituisce la configurazione corretta e createPgPool crea il pool senza errori loadConfig', () => {
    const config = getDatabaseConfig();
    assert(config.driver === 'memory' || config.driver === 'postgres');
    assert.strictEqual(typeof config.port, 'number');

    // Verifica creazione pool con config personalizzata esplicita
    const pool = createPgPool({
      driver: 'postgres',
      host: '127.0.0.1',
      port: 5432,
      user: 'postgres',
      database: 'prolocal_test',
      maxConnections: 5
    });
    assert(pool, 'Il pool deve essere istanziato correttamente');
    assert.strictEqual(typeof pool.query, 'function');
  });

  it('Migration & Rollback: una migrazione con errore esegue il ROLLBACK e non sporca schema_migrations', async () => {
    const { pool } = createTestDb();
    const migrator = new DatabaseMigrator(pool);

    // Salviamo e alteriamo temporaneamente la prima migrazione per provocare un errore di sintassi SQL
    const originalSql = MIGRATIONS[0].sql;
    MIGRATIONS[0].sql = 'SYNTAX ERROR IN ATTRIBUTE DEFINITION';

    let errorThrown = false;
    try {
      await migrator.runMigrations();
    } catch (err: any) {
      errorThrown = true;
      assert(err.message.includes('[Migration Error]'), 'Deve lanciare un errore di migrazione');
    } finally {
      // Ripristino immediato del codice SQL integro
      MIGRATIONS[0].sql = originalSql;
    }

    assert.strictEqual(errorThrown, true, 'Deve fallire con errore di migrazione');

    // Verifica che schema_migrations non contenga la migrazione fallita
    const applied = await migrator.getAppliedMigrations();
    assert.strictEqual(applied.includes('001_create_members'), false, 'La migrazione fallita NON deve risultare registrata');
  });

  it('Foreign Key Integrity: rifiuta l inserimento di una business activity associata a un member_id inesistente', async () => {
    const { pool } = createTestDb();
    const migrator = new DatabaseMigrator(pool);
    await migrator.runMigrations();

    const actRepo = new PostgresBusinessActivityRepository(pool);

    const orphanActivity: BusinessActivity = {
      id: 'act-orfana',
      memberId: 'socio-inesistente-999',
      nomeAttivita: 'Attività Senza Socio',
      categoria: ActivityCategory.ENOGASTRONOMIA_LOCALE,
      descrizioneBreve: 'Tentativo di violazione vincolo relazionale',
      descrizioneCompleta: 'Non deve essere possibile inserire un attività orfana nel DB relazionale.',
      serviziOfferti: ['Vendita'],
      localita: 'Borgo',
      statoPubblicazione: PublicationStatus.BOZZA,
      dataUltimoAggiornamento: '2024-06-01'
    };

    let fkViolated = false;
    try {
      await actRepo.create(orphanActivity);
    } catch (err: any) {
      fkViolated = true;
      // pg-mem e postgres segnalano la violazione di foreign key
      assert(
        err.message.toLowerCase().includes('foreign key') ||
        err.message.toLowerCase().includes('violat') ||
        err.message.toLowerCase().includes('does not exist')
      );
    }

    assert.strictEqual(fkViolated, true, 'La foreign key member_id DEVE respingere record con socio inesistente');
  });

  it('Migration Pool Connection: connect() e release() vengono invocati e la connessione viene sempre rilasciata', async () => {
    const { pool } = createTestDb();

    let connectCount = 0;
    let releaseCount = 0;

    // Creiamo un wrapper che simula il comportamento di un Pool con connect() e release()
    const poolWithTracking = {
      query: (sql: string, params?: unknown[]) => pool.query(sql, params),
      connect: async () => {
        connectCount++;
        return {
          query: (sql: string, params?: unknown[]) => pool.query(sql, params),
          release: () => {
            releaseCount++;
          }
        };
      }
    };

    const migrator = new DatabaseMigrator(poolWithTracking);
    const result = await migrator.runMigrations();

    assert.strictEqual(result.applied.length, 4, 'Devono essere applicate 4 migrazioni');
    assert.strictEqual(connectCount, 4, 'Deve essere acquisito un client dedicato per ogni migrazione');
    assert.strictEqual(releaseCount, 4, 'Tutti i client dedicati devono essere stati rilasciati nel blocco finally');
  });

  it('Audit Immutability: i repository audit sono append-only e non espongono metodi di alterazione o cancellazione', async () => {
    const inMemRepo = new InMemoryAuditLogRepository();
    const pgRepo = new PostgresAuditLogRepository(createTestDb().pool);

    // Verifica interfaccia a runtime: non devono esistere metodi mutativi update/delete
    assert.strictEqual((inMemRepo as any).update, undefined, 'InMemoryAuditLogRepository non deve avere update()');
    assert.strictEqual((inMemRepo as any).delete, undefined, 'InMemoryAuditLogRepository non deve avere delete()');
    assert.strictEqual((pgRepo as any).update, undefined, 'PostgresAuditLogRepository non deve avere update()');
    assert.strictEqual((pgRepo as any).delete, undefined, 'PostgresAuditLogRepository non deve avere delete()');

    // Verifica isolamento: modificare il risultato di findAll() non deve alterare lo store interno
    await inMemRepo.log({
      id: 'audit-test-1',
      actorId: 'mem-1',
      action: 'TEST_ACTION',
      resourceType: 'TEST',
      resourceId: 'res-1',
      timestamp: new Date().toISOString()
    });

    const logsCopy = await inMemRepo.findAll();
    assert.strictEqual(logsCopy.length, 1);
    logsCopy.pop(); // Mutazione dell'array esterno
    assert.strictEqual(logsCopy.length, 0);

    const logsAfter = await inMemRepo.findAll();
    assert.strictEqual(logsAfter.length, 1, 'Lo store interno in-memory deve rimanere intatto');
  });
});
