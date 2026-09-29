import { describe, it } from 'node:test';
import assert from 'node:assert';
import { newDb } from 'pg-mem';
import { SessionCleanupService } from '../src/services/SessionCleanupService.ts';
import { InMemorySessionRepository } from '../src/repositories/SessionRepository.ts';
import { PostgresSessionRepository } from '../src/repositories/PostgresSessionRepository.ts';
import { DatabaseMigrator } from '../src/db/migrator.ts';
import type { ISessionRepository } from '../src/repositories/SessionRepository.ts';

describe('Session Cleanup Service & Lifecycle Tests', () => {
  // Helper per configurare un database in memoria pg-mem con tabelle migrate
  async function createPgMemSessionRepo() {
    const mem = newDb({ noAstCoverageCheck: true });
    const adapter = mem.adapters.createPg();
    const pool = new adapter.Pool();
    const migrator = new DatabaseMigrator(pool);
    await migrator.runMigrations();

    // Creazione utente di appoggio per soddisfare la FK di sessions
    await pool.query(`
      INSERT INTO user_accounts (id, email, password_hash, actor_type, member_id, failed_login_attempts, is_active, created_at, updated_at)
      VALUES ('user-test-cleanup', 'cleanup@test.it', 'hash123', 'TECHNICAL_ADMIN', NULL, 0, TRUE, now(), now());
    `);

    const sessionRepo = new PostgresSessionRepository(pool);
    return { mem, pool, sessionRepo };
  }

  // Helper per creare un mock logger per catturare i log senza inquinare stdout/stderr
  function createMockLogger() {
    const logs: string[] = [];
    const errors: Array<{ msg: string; args: unknown[] }> = [];
    return {
      logs,
      errors,
      logger: {
        log: (msg: string) => logs.push(msg),
        error: (msg: string, ...args: unknown[]) => errors.push({ msg, args })
      }
    };
  }

  it('Inizializzazione: intervallo di default a 60 minuti (3_600_000 ms) e configurabile', () => {
    const inMemRepo = new InMemorySessionRepository();
    const defaultService = new SessionCleanupService(inMemRepo);
    assert.strictEqual(defaultService.getIntervalMs(), 60 * 60 * 1000, 'L intervallo di default deve essere 60 minuti');

    const customService = new SessionCleanupService(inMemRepo, { intervalMs: 15 * 60 * 1000 });
    assert.strictEqual(customService.getIntervalMs(), 15 * 60 * 1000, 'L intervallo custom deve essere rispettato');
  });

  it('runCleanupOnce(): elimina le sessioni scadute e restituisce il numero di righe rimosse', async () => {
    const inMemRepo = new InMemorySessionRepository();
    const now = new Date();

    // Sessione 1: scaduta 10 minuti fa
    await inMemRepo.create({
      sessionHash: 'hash-scaduto-1',
      userId: 'usr-1',
      expiresAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString()
    });

    // Sessione 2: scaduta 5 minuti fa
    await inMemRepo.create({
      sessionHash: 'hash-scaduto-2',
      userId: 'usr-1',
      expiresAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString()
    });

    // Sessione 3: valida (scade tra 4 ore)
    await inMemRepo.create({
      sessionHash: 'hash-valido-3',
      userId: 'usr-1',
      expiresAt: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString()
    });

    const mockLogger = createMockLogger();
    const service = new SessionCleanupService(inMemRepo, { logger: mockLogger.logger });

    const deleted = await service.runCleanupOnce(now.toISOString());
    assert.strictEqual(deleted, 2, 'Devono essere eliminate esattamente 2 sessioni scadute');

    // Verifica che rimanga solo la sessione valida
    const s1 = await inMemRepo.findBySessionHash('hash-scaduto-1');
    const s2 = await inMemRepo.findBySessionHash('hash-scaduto-2');
    const s3 = await inMemRepo.findBySessionHash('hash-valido-3');
    assert.strictEqual(s1, null);
    assert.strictEqual(s2, null);
    assert.notStrictEqual(s3, null);

    // Verifica logging informativo
    assert(mockLogger.logs.some((l) => l.includes('Rimosse 2 sessioni scadute')));
  });

  it('Failure Isolation: errore in deleteExpired() viene catturato, registrato e non crasha il processo', async () => {
    // Repository con fallimento simulato
    const failingRepo: ISessionRepository = {
      create: async () => { throw new Error('Not implemented'); },
      findBySessionHash: async () => null,
      updateLastAccessedAt: async () => {},
      deleteBySessionHash: async () => {},
      deleteByUserId: async () => 0,
      deleteExpired: async () => {
        throw new Error('PostgreSQL connection timeout: connection terminated abruptly');
      }
    };

    const mockLogger = createMockLogger();
    const service = new SessionCleanupService(failingRepo, { logger: mockLogger.logger });

    // L'esecuzione non deve sollevare eccezioni non gestite
    let caughtError = null;
    let result = null;
    try {
      result = await service.runCleanupOnce();
    } catch (err) {
      caughtError = err;
    }

    assert.strictEqual(caughtError, null, 'Il servizio deve isolare i fallimenti senza lanciare eccezioni');
    assert.strictEqual(result, -1, 'In caso di errore non bloccante restituisce -1');
    assert.strictEqual(mockLogger.errors.length, 1, 'Deve essere registrato l errore tramite logger');
    assert(mockLogger.errors[0].msg.includes('Errore durante la rimozione periodica'));
  });

  it('Recovery: il cleanup successivo continua a funzionare normalmente dopo un ciclo in errore', async () => {
    let shouldFail = true;
    const inMemRepo = new InMemorySessionRepository();

    // Creiamo una sessione scaduta
    await inMemRepo.create({
      sessionHash: 'hash-scaduto-recov',
      userId: 'usr-1',
      expiresAt: new Date(Date.now() - 60000).toISOString()
    });

    // Proxy repository che fallisce la prima volta e ha successo la seconda
    const flappyRepo: ISessionRepository = {
      create: (dto) => inMemRepo.create(dto),
      findBySessionHash: (h) => inMemRepo.findBySessionHash(h),
      updateLastAccessedAt: (h, d) => inMemRepo.updateLastAccessedAt(h, d),
      deleteBySessionHash: (h) => inMemRepo.deleteBySessionHash(h),
      deleteByUserId: (u) => inMemRepo.deleteByUserId(u),
      deleteExpired: async (now?: string) => {
        if (shouldFail) {
          throw new Error('Temporarily unavailable');
        }
        return inMemRepo.deleteExpired(now);
      }
    };

    const mockLogger = createMockLogger();
    const service = new SessionCleanupService(flappyRepo, { logger: mockLogger.logger });

    // 1° ciclo in errore
    const res1 = await service.runCleanupOnce();
    assert.strictEqual(res1, -1);
    assert.strictEqual(mockLogger.errors.length, 1);

    // Ripristino condizione di successo
    shouldFail = false;

    // 2° ciclo: deve completarsi con successo senza blocchi o stato incoerente
    const res2 = await service.runCleanupOnce();
    assert.strictEqual(res2, 1);
    assert.strictEqual(await inMemRepo.findBySessionHash('hash-scaduto-recov'), null);
  });

  it('Lifecycle del timer: start() avvia il timer, stop() lo ferma e azzera lo stato (nessun leak)', () => {
    const inMemRepo = new InMemorySessionRepository();
    const service = new SessionCleanupService(inMemRepo, { intervalMs: 1000 });

    assert.strictEqual(service.isActive(), false);

    // Avvio
    service.start();
    assert.strictEqual(service.isActive(), true);

    // start() multiplo è idempotente
    service.start();
    assert.strictEqual(service.isActive(), true);

    // Arresto
    service.stop();
    assert.strictEqual(service.isActive(), false);

    // stop() multiplo è idempotente
    service.stop();
    assert.strictEqual(service.isActive(), false);
  });

  it('Periodic Invocation: il timer invoca automaticamente runCleanupOnce() all intervallo stabilito', async () => {
    const inMemRepo = new InMemorySessionRepository();
    let invocationCount = 0;

    const spyRepo: ISessionRepository = {
      create: (dto) => inMemRepo.create(dto),
      findBySessionHash: (h) => inMemRepo.findBySessionHash(h),
      updateLastAccessedAt: (h, d) => inMemRepo.updateLastAccessedAt(h, d),
      deleteBySessionHash: (h) => inMemRepo.deleteBySessionHash(h),
      deleteByUserId: (u) => inMemRepo.deleteByUserId(u),
      deleteExpired: async (now?: string) => {
        invocationCount++;
        return inMemRepo.deleteExpired(now);
      }
    };

    // Intervallo brevissimo per test rapido e deterministico (30ms)
    const service = new SessionCleanupService(spyRepo, { intervalMs: 30 });
    service.start();

    // Attendiamo 80ms per verificare che avvengano almeno 2 invocazioni
    await new Promise((resolve) => setTimeout(resolve, 80));

    service.stop();
    assert(invocationCount >= 2, `deleteExpired deve essere stato invocato automaticamente almeno 2 volte (effettive: ${invocationCount})`);

    // Dopo stop, il conteggio non deve più incrementare
    const snapshotCount = invocationCount;
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.strictEqual(invocationCount, snapshotCount, 'Nessuna invocazione dopo stop()');
  });

  it('Integrazione PostgreSQL: esecuzione con PostgresSessionRepository su database pg-mem', async () => {
    const { sessionRepo } = await createPgMemSessionRepo();
    const now = new Date();

    // Inserimento sessione scaduta e sessione attiva su PostgreSQL
    await sessionRepo.create({
      sessionHash: 'pg-hash-expired-1',
      userId: 'user-test-cleanup',
      expiresAt: new Date(now.getTime() - 3600 * 1000).toISOString()
    });

    await sessionRepo.create({
      sessionHash: 'pg-hash-active-1',
      userId: 'user-test-cleanup',
      expiresAt: new Date(now.getTime() + 3600 * 1000).toISOString()
    });

    const mockLogger = createMockLogger();
    const service = new SessionCleanupService(sessionRepo, { logger: mockLogger.logger });

    const deleted = await service.runCleanupOnce(now.toISOString());
    assert.strictEqual(deleted, 1, 'Deve aver cancellato la sessione scaduta dalla tabella sessions di PostgreSQL');

    const expiredSession = await sessionRepo.findBySessionHash('pg-hash-expired-1');
    const activeSession = await sessionRepo.findBySessionHash('pg-hash-active-1');

    assert.strictEqual(expiredSession, null);
    assert.notStrictEqual(activeSession, null);
    assert.strictEqual(activeSession?.id, 'pg-hash-active-1');
  });
});
