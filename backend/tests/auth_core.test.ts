import { describe, it } from 'node:test';
import assert from 'node:assert';
import { newDb } from 'pg-mem';
import { DatabaseMigrator } from '../src/db/migrator.ts';
import { ActorType } from '../src/domain/auth.ts';
import { PostgresUserAccountRepository } from '../src/repositories/PostgresUserAccountRepository.ts';
import { PostgresSessionRepository } from '../src/repositories/PostgresSessionRepository.ts';
import { InMemoryUserAccountRepository } from '../src/repositories/UserAccountRepository.ts';
import { InMemorySessionRepository } from '../src/repositories/SessionRepository.ts';
import { ScryptPasswordHasher } from '../src/auth/PasswordHasher.ts';
import {
  generateRawSessionId,
  hashSessionId,
  calculateAbsoluteExpiry,
  calculateIdleExpiry,
  evaluateSessionValidity,
  SESSION_CONFIG
} from '../src/auth/SessionManager.ts';

describe('Auth Core & Persistence Tests (Fase 3.2)', () => {
  function createTestDb() {
    const mem = newDb({ noAstCoverageCheck: true });
    const adapter = mem.adapters.createPg();
    const pool = new adapter.Pool();
    return { mem, pool };
  }

  // =========================================================================
  // 1. DATABASE & MIGRATION 004 TESTS
  // =========================================================================
  describe('Migration 004 & Constraints', () => {
    it('applica la migrazione 004 con successo ed è idempotente', async () => {
      const { pool } = createTestDb();
      const migrator = new DatabaseMigrator(pool);

      const res = await migrator.runMigrations();
      assert(res.applied.includes('004_create_auth_tables'));

      const res2 = await migrator.runMigrations();
      assert.strictEqual(res2.alreadyUpToDate, true);
      assert.strictEqual(res2.applied.length, 0);
    });

    it('accetta MEMBER con member_id valido e rifiuta MEMBER con member_id NULL', async () => {
      const { pool } = createTestDb();
      const migrator = new DatabaseMigrator(pool);
      await migrator.runMigrations();

      // Inseriamo prima un socio valido per la foreign key
      await pool.query(`
        INSERT INTO members (id, codice_socio, nome_cognome, email_demo, data_iscrizione, membership_status)
        VALUES ('mem-test-01', 'SOC-999', 'Mario Rossi', 'mario@test.it', '2026-01-01', 'ATTIVO');
      `);

      // Creazione MEMBER valida
      const userRepo = new PostgresUserAccountRepository(pool);
      const memberUser = await userRepo.create({
        id: 'usr-mem-01',
        email: 'mario@test.it',
        passwordHash: 'dummy_hash',
        actorType: ActorType.MEMBER,
        memberId: 'mem-test-01'
      });
      assert.strictEqual(memberUser.id, 'usr-mem-01');
      assert.strictEqual(memberUser.memberId, 'mem-test-01');

      // MEMBER con member_id NULL deve fallire per vincolo CHECK
      let checkFailed = false;
      try {
        await userRepo.create({
          id: 'usr-mem-invalid',
          email: 'invalid-member@test.it',
          passwordHash: 'dummy_hash',
          actorType: ActorType.MEMBER,
          memberId: null
        });
      } catch (err: any) {
        checkFailed = true;
      }
      assert.strictEqual(checkFailed, true, 'MEMBER con member_id NULL deve essere respinto dal vincolo CHECK');
    });

    it('accetta TECHNICAL_ADMIN con member_id NULL e rifiuta TECHNICAL_ADMIN con member_id non NULL', async () => {
      const { pool } = createTestDb();
      const migrator = new DatabaseMigrator(pool);
      await migrator.runMigrations();

      await pool.query(`
        INSERT INTO members (id, codice_socio, nome_cognome, email_demo, data_iscrizione, membership_status)
        VALUES ('mem-test-02', 'SOC-998', 'Luigi Bianchi', 'luigi@test.it', '2026-01-01', 'ATTIVO');
      `);

      const userRepo = new PostgresUserAccountRepository(pool);

      // TECHNICAL_ADMIN con member_id NULL valido
      const adminUser = await userRepo.create({
        id: 'usr-admin-01',
        email: 'admin.tech@prolocal.internal',
        passwordHash: 'dummy_hash',
        actorType: ActorType.TECHNICAL_ADMIN,
        memberId: null
      });
      assert.strictEqual(adminUser.id, 'usr-admin-01');
      assert.strictEqual(adminUser.memberId, null);

      // TECHNICAL_ADMIN con member_id non-null deve fallire
      let checkFailed = false;
      try {
        await userRepo.create({
          id: 'usr-admin-invalid',
          email: 'admin.invalid@prolocal.internal',
          passwordHash: 'dummy_hash',
          actorType: ActorType.TECHNICAL_ADMIN,
          memberId: 'mem-test-02'
        });
      } catch (err: any) {
        checkFailed = true;
      }
      assert.strictEqual(checkFailed, true, 'TECHNICAL_ADMIN con member_id non NULL deve essere respinto dal vincolo CHECK');
    });

    it('rifiuta actor_type diverso da MEMBER o TECHNICAL_ADMIN', async () => {
      const { pool } = createTestDb();
      const migrator = new DatabaseMigrator(pool);
      await migrator.runMigrations();

      let checkFailed = false;
      try {
        await pool.query(`
          INSERT INTO user_accounts (id, email, password_hash, actor_type, member_id)
          VALUES ('usr-bad-role', 'bad@test.it', 'hash', 'SUPER_ADMIN', NULL);
        `);
      } catch {
        checkFailed = true;
      }
      assert.strictEqual(checkFailed, true, 'actor_type non consentito deve fallire');
    });

    it('garantisce vincolo UNIQUE su email e UNIQUE su member_id', async () => {
      const { pool } = createTestDb();
      const migrator = new DatabaseMigrator(pool);
      await migrator.runMigrations();

      await pool.query(`
        INSERT INTO members (id, codice_socio, nome_cognome, email_demo, data_iscrizione, membership_status)
        VALUES ('mem-test-03', 'SOC-997', 'Anna Verdi', 'anna@test.it', '2026-01-01', 'ATTIVO');
      `);

      const userRepo = new PostgresUserAccountRepository(pool);
      await userRepo.create({
        id: 'usr-01',
        email: 'anna@test.it',
        passwordHash: 'hash1',
        actorType: ActorType.MEMBER,
        memberId: 'mem-test-03'
      });

      // Duplicato email
      let emailUniqueViolated = false;
      try {
        await userRepo.create({
          id: 'usr-02',
          email: 'anna@test.it',
          passwordHash: 'hash2',
          actorType: ActorType.TECHNICAL_ADMIN,
          memberId: null
        });
      } catch {
        emailUniqueViolated = true;
      }
      assert.strictEqual(emailUniqueViolated, true, 'Email duplicata deve essere respinta');

      // Duplicato member_id (un socio non può avere due account)
      let memberIdUniqueViolated = false;
      try {
        await userRepo.create({
          id: 'usr-03',
          email: 'anna2@test.it',
          passwordHash: 'hash3',
          actorType: ActorType.MEMBER,
          memberId: 'mem-test-03'
        });
      } catch {
        memberIdUniqueViolated = true;
      }
      assert.strictEqual(memberIdUniqueViolated, true, 'MemberId duplicato deve essere respinto');
    });

    it('gestisce cascata FK su cancellazione utente per le sessioni collegate', async () => {
      const { pool } = createTestDb();
      const migrator = new DatabaseMigrator(pool);
      await migrator.runMigrations();

      const userRepo = new PostgresUserAccountRepository(pool);
      const sessionRepo = new PostgresSessionRepository(pool);

      const user = await userRepo.create({
        id: 'usr-cascade-test',
        email: 'tech@test.it',
        passwordHash: 'hash',
        actorType: ActorType.TECHNICAL_ADMIN
      });

      const session = await sessionRepo.create({
        sessionHash: 'hash-session-cascade-1',
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      });

      const foundBefore = await sessionRepo.findBySessionHash('hash-session-cascade-1');
      assert.strictEqual(foundBefore?.id, 'hash-session-cascade-1');

      // Cancellazione utente
      await pool.query('DELETE FROM user_accounts WHERE id = $1', [user.id]);

      const foundAfter = await sessionRepo.findBySessionHash('hash-session-cascade-1');
      assert.strictEqual(foundAfter, null, 'Le sessioni devono essere cancellate in cascata con ON DELETE CASCADE');
    });
  });

  // =========================================================================
  // 2. PASSWORD HASHING (SCRYPT) TESTS
  // =========================================================================
  describe('Password Hashing with Scrypt', () => {
    it('stessa password produce salt differenti e hash differenti', async () => {
      const hasher = new ScryptPasswordHasher();
      const pwd = 'PasswordComplessa2026!';

      const hash1 = await hasher.hash(pwd);
      const hash2 = await hasher.hash(pwd);

      assert.notStrictEqual(hash1, hash2, 'Due hash della stessa password devono avere salt diversi');
      assert(hash1.startsWith('scrypt$N=16384,r=8,p=1$'), 'Formato versionabile rispettato');
      assert(!hash1.includes(pwd), 'La password in chiaro non deve comparire nell hash');
    });

    it('verifica password con successo se corretta e fallisce se errata', async () => {
      const hasher = new ScryptPasswordHasher();
      const pwd = 'MiaChiaveSicura123$';
      const hash = await hasher.hash(pwd);

      const valid = await hasher.verify(pwd, hash);
      assert.strictEqual(valid, true, 'La verifica deve avere successo con la password corretta');

      const invalid = await hasher.verify('PasswordSbagliata', hash);
      assert.strictEqual(invalid, false, 'La verifica deve fallire con una password errata');

      const emptyInvalid = await hasher.verify('', hash);
      assert.strictEqual(emptyInvalid, false, 'La verifica deve fallire con password vuota');
    });

    it('rifiuta hash malformati o manomessi senza eccezioni incontrollate', async () => {
      const hasher = new ScryptPasswordHasher();
      assert.strictEqual(await hasher.verify('pwd', 'formato-non-valido'), false);
      assert.strictEqual(await hasher.verify('pwd', 'scrypt$N=invalid$salt$key'), false);
      assert.strictEqual(await hasher.verify('pwd', 'bcrypt$somehash'), false);
    });

    it('rileva se l hash necessita di rehash futuro quando i parametri cambiano', async () => {
      const standardHasher = new ScryptPasswordHasher({ costN: 16384 });
      const hash = await standardHasher.hash('TestRehash123');

      assert.strictEqual(standardHasher.needsRehash(hash), false);

      const upgradedHasher = new ScryptPasswordHasher({ costN: 32768 });
      assert.strictEqual(upgradedHasher.needsRehash(hash), true, 'Deve richiedere rehash se i parametri sono stati incrementati');
    });
  });

  // =========================================================================
  // 3. SESSION ID & TIMEOUT MANAGEMENT TESTS
  // =========================================================================
  describe('Session ID & Timeout Utilities', () => {
    it('generateRawSessionId produce token a 32 byte (64 caratteri hex) di entropia', () => {
      const id1 = generateRawSessionId();
      const id2 = generateRawSessionId();

      assert.strictEqual(id1.length, 64);
      assert.strictEqual(id2.length, 64);
      assert.notStrictEqual(id1, id2);
    });

    it('hashSessionId calcola SHA-256 coerente e unidirezionale', () => {
      const raw = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const hash1 = hashSessionId(raw);
      const hash2 = hashSessionId(raw);

      assert.strictEqual(hash1.length, 64);
      assert.strictEqual(hash1, hash2);
      assert.notStrictEqual(raw, hash1, 'L hash deve essere diverso dal valore raw');
    });

    it('calculateAbsoluteExpiry assegna 8 ore dal momento di creazione', () => {
      const base = new Date('2026-09-11T10:00:00.000Z');
      const expiry = calculateAbsoluteExpiry(base);
      const diffHours = (expiry.getTime() - base.getTime()) / (1000 * 60 * 60);

      assert.strictEqual(diffHours, SESSION_CONFIG.ABSOLUTE_TIMEOUT_HOURS);
      assert.strictEqual(diffHours, 8);
    });

    it('calculateIdleExpiry assegna 30 minuti dall ultimo accesso', () => {
      const lastAccessed = new Date('2026-09-11T10:00:00.000Z');
      const expiry = calculateIdleExpiry(lastAccessed);
      const diffMinutes = (expiry.getTime() - lastAccessed.getTime()) / (1000 * 60);

      assert.strictEqual(diffMinutes, SESSION_CONFIG.IDLE_TIMEOUT_MINUTES);
      assert.strictEqual(diffMinutes, 30);
    });

    it('evaluateSessionValidity distingue correttamente sessioni valide, scadute per inattività e per absolute timeout', () => {
      const now = new Date('2026-09-11T10:20:00.000Z');

      // 1. Sessione valida (creata 20 min fa, accesso 10 min fa, scade tra 7h40)
      const validSession = {
        createdAt: '2026-09-11T10:00:00.000Z',
        lastAccessedAt: '2026-09-11T10:10:00.000Z',
        expiresAt: '2026-09-11T18:00:00.000Z'
      };
      assert.deepStrictEqual(evaluateSessionValidity(validSession, now), { isValid: true });

      // 2. Sessione scaduta per inattività (ultimo accesso 35 minuti fa)
      const idleExpiredSession = {
        createdAt: '2026-09-11T09:00:00.000Z',
        lastAccessedAt: '2026-09-11T09:40:00.000Z',
        expiresAt: '2026-09-11T17:00:00.000Z'
      };
      assert.deepStrictEqual(evaluateSessionValidity(idleExpiredSession, now), {
        isValid: false,
        reason: 'EXPIRED_IDLE'
      });

      // 3. Sessione scaduta per absolute timeout
      const absoluteExpiredSession = {
        createdAt: '2026-09-11T01:00:00.000Z',
        lastAccessedAt: '2026-09-11T10:15:00.000Z',
        expiresAt: '2026-09-11T09:00:00.000Z'
      };
      assert.deepStrictEqual(evaluateSessionValidity(absoluteExpiredSession, now), {
        isValid: false,
        reason: 'EXPIRED_ABSOLUTE'
      });

      // 4. Sessione inesistente (null)
      assert.deepStrictEqual(evaluateSessionValidity(null, now), {
        isValid: false,
        reason: 'NOT_FOUND'
      });
    });
  });

  // =========================================================================
  // 4. POSTGRES & IN-MEMORY REPOSITORIES FUNCTIONAL TESTS
  // =========================================================================
  describe('Postgres & InMemory Repositories API Parity', () => {
    it('PostgresSessionRepository: create, findBySessionHash, updateLastAccessedAt, deleteBySessionHash, deleteExpired', async () => {
      const { pool } = createTestDb();
      const migrator = new DatabaseMigrator(pool);
      await migrator.runMigrations();

      const userRepo = new PostgresUserAccountRepository(pool);
      const sessionRepo = new PostgresSessionRepository(pool);

      const user = await userRepo.create({
        email: 'session.user@prolocal.internal',
        passwordHash: 'hash',
        actorType: ActorType.TECHNICAL_ADMIN
      });

      const rawSession = generateRawSessionId();
      const sessionHash = hashSessionId(rawSession);
      const expiresAt = calculateAbsoluteExpiry().toISOString();

      // Create session
      const created = await sessionRepo.create({
        sessionHash,
        userId: user.id,
        expiresAt,
        ipAddress: '192.168.1.50',
        userAgent: 'TestBrowser/1.0'
      });

      assert.strictEqual(created.id, sessionHash);
      assert.strictEqual(created.userId, user.id);
      assert.strictEqual(created.ipAddress, '192.168.1.50');

      // Lookup tramite hash
      const found = await sessionRepo.findBySessionHash(sessionHash);
      assert.strictEqual(found?.id, sessionHash);
      assert.strictEqual(found?.userId, user.id);

      // Aggiornamento lastAccessedAt
      const newAccessTime = new Date().toISOString();
      await sessionRepo.updateLastAccessedAt(sessionHash, newAccessTime);
      const updated = await sessionRepo.findBySessionHash(sessionHash);
      assert(updated?.lastAccessedAt);

      // Cancellazione singola per hash (logout)
      await sessionRepo.deleteBySessionHash(sessionHash);
      const afterDelete = await sessionRepo.findBySessionHash(sessionHash);
      assert.strictEqual(afterDelete, null);

      // Creazione sessioni scadute per test deleteExpired
      const expiredHash = hashSessionId(generateRawSessionId());
      await sessionRepo.create({
        sessionHash: expiredHash,
        userId: user.id,
        expiresAt: new Date(Date.now() - 10000).toISOString()
      });

      const deletedExpiredCount = await sessionRepo.deleteExpired();
      assert.strictEqual(deletedExpiredCount, 1);
    });

    it('InMemory repositories rispettano la stessa interfaccia e comportamento', async () => {
      const inMemUserRepo = new InMemoryUserAccountRepository();
      const inMemSessionRepo = new InMemorySessionRepository();

      const user = await inMemUserRepo.create({
        id: 'usr-inmem-1',
        email: 'inmem@test.it',
        passwordHash: 'hash_inmem',
        actorType: ActorType.TECHNICAL_ADMIN
      });

      assert.strictEqual(user.email, 'inmem@test.it');
      assert.strictEqual(await inMemUserRepo.findByEmail('INMEM@test.it') !== null, true);

      // Lockout state update
      await inMemUserRepo.updateLoginFailureState(user.id, 3, '2026-09-11T12:00:00.000Z');
      const updatedUser = await inMemUserRepo.findById(user.id);
      assert.strictEqual(updatedUser?.failedLoginAttempts, 3);
      assert.strictEqual(updatedUser?.lockedUntil, '2026-09-11T12:00:00.000Z');

      await inMemUserRepo.resetLoginFailureState(user.id);
      const resetUser = await inMemUserRepo.findById(user.id);
      assert.strictEqual(resetUser?.failedLoginAttempts, 0);
      assert.strictEqual(resetUser?.lockedUntil, null);

      // Sessions in memory
      const sHash = hashSessionId('raw1');
      await inMemSessionRepo.create({
        sessionHash: sHash,
        userId: user.id,
        expiresAt: '2026-09-11T20:00:00.000Z'
      });

      assert(await inMemSessionRepo.findBySessionHash(sHash));
      await inMemSessionRepo.deleteByUserId(user.id);
      assert.strictEqual(await inMemSessionRepo.findBySessionHash(sHash), null);
    });
  });
});
