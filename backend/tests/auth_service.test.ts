import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AuthService } from '../src/services/AuthService.ts';
import { InMemoryUserAccountRepository } from '../src/repositories/UserAccountRepository.ts';
import { InMemorySessionRepository } from '../src/repositories/SessionRepository.ts';
import { InMemoryMemberRepository } from '../src/repositories/MemberRepository.ts';
import { InMemoryAuditLogRepository } from '../src/repositories/AuditLogRepository.ts';
import { ScryptPasswordHasher } from '../src/auth/PasswordHasher.ts';
import { ActorType } from '../src/domain/auth.ts';
import {
  MembershipStatus,
  ProLocalRole
} from '../src/domain/models.ts';
import type { Member } from '../src/domain/models.ts';
import {
  InvalidCredentialsError,
  AccountLockedError,
  AccountInactiveError,
  SessionInvalidError
} from '../src/domain/authErrors.ts';
import { hashSessionId } from '../src/auth/SessionManager.ts';

describe('AuthService Application Service Tests (Fase 3.3)', () => {
  const hasher = new ScryptPasswordHasher({ costN: 2048, blockSizeR: 8, parallelizationP: 1 }); // parametri veloci per test unitari

  async function createTestContext(members: Member[] = []) {
    const userAccountRepo = new InMemoryUserAccountRepository();
    const sessionRepo = new InMemorySessionRepository();
    const memberRepo = new InMemoryMemberRepository(members);
    const auditLogRepo = new InMemoryAuditLogRepository();

    const authService = new AuthService({
      userAccountRepo,
      sessionRepo,
      memberRepo,
      passwordHasher: hasher,
      auditLogRepo
    });

    return {
      userAccountRepo,
      sessionRepo,
      memberRepo,
      auditLogRepo,
      authService
    };
  }

  // =========================================================================
  // 1. LOGIN TESTS
  // =========================================================================
  describe('Login & Authentication Flow', () => {
    it('login con successo: email normalizzata (trim e lowercase), credenziali corrette, restituisce token raw e sessione creata', async () => {
      const { userAccountRepo, sessionRepo, auditLogRepo, authService } = await createTestContext();

      const pwd = 'PasswordSegreta123!';
      const hash = await hasher.hash(pwd);

      await userAccountRepo.create({
        id: 'usr-admin-1',
        email: 'admin.tech@prolocal.internal',
        passwordHash: hash,
        actorType: ActorType.TECHNICAL_ADMIN,
        memberId: null
      });

      // Login con maiuscole e spazi attorno all'email
      const result = await authService.authenticate(
        '  ADMIN.TECH@ProLocal.Internal  ',
        pwd,
        { ipAddress: '10.0.0.1', userAgent: 'NodeTestAgent' }
      );

      assert(result.rawSessionToken, 'Deve restituire il rawSessionToken');
      assert.strictEqual(result.rawSessionToken.length, 64, 'Token raw a 32 byte (64 hex characters)');
      assert.strictEqual(result.userAccount.email, 'admin.tech@prolocal.internal');
      assert.strictEqual(result.userAccount.actorType, ActorType.TECHNICAL_ADMIN);

      // Verifica che il raw token NON sia memorizzato nel database/repository delle sessioni
      const sessionHash = hashSessionId(result.rawSessionToken);
      const sessionInDb = await sessionRepo.findBySessionHash(sessionHash);
      assert(sessionInDb, 'La sessione deve essere trovata tramite hash SHA-256');
      assert.strictEqual(sessionInDb.id, sessionHash);
      assert.strictEqual(sessionInDb.userId, 'usr-admin-1');

      // Verifica che la sessione non sia trovabile cercando il raw token
      const rawInDb = await sessionRepo.findBySessionHash(result.rawSessionToken);
      assert.strictEqual(rawInDb, null, 'Il token raw non deve essere memorizzato come ID di sessione');

      // Verifica audit log LOGIN_SUCCESS (senza password né token)
      const logs = await auditLogRepo.findAll();
      const successLog = logs.find((l) => l.action === 'LOGIN_SUCCESS');
      assert(successLog, 'Deve essere registrato LOGIN_SUCCESS');
      assert.strictEqual(successLog.actorId, 'usr-admin-1');
      assert.strictEqual(JSON.stringify(successLog).includes(pwd), false, 'La password non deve essere nei log');
      assert.strictEqual(JSON.stringify(successLog).includes(result.rawSessionToken), false, 'Il token raw non deve essere nei log');
    });

    it('login fallito con email inesistente: solleva InvalidCredentialsError generico e registra audit LOGIN_FAILED', async () => {
      const { auditLogRepo, authService } = await createTestContext();

      await assert.rejects(
        async () => {
          await authService.authenticate('non.esistente@test.it', 'qualsiasiPassword', { ipAddress: '10.0.0.2' });
        },
        (err: any) => {
          assert(err instanceof InvalidCredentialsError);
          assert.strictEqual(err.message, 'Credenziali non valide.');
          return true;
        }
      );

      const logs = await auditLogRepo.findAll();
      const failLog = logs.find((l) => l.action === 'LOGIN_FAILED');
      assert(failLog);
      assert.strictEqual(failLog.actorId, 'anonymous');
      assert.strictEqual((failLog.metadata as any)?.reason, 'USER_NOT_FOUND');
    });

    it('login fallito con password errata: incrementa failed_login_attempts senza azzerare e solleva InvalidCredentialsError', async () => {
      const { userAccountRepo, auditLogRepo, authService } = await createTestContext();

      const pwd = 'PasswordCorretta!';
      const hash = await hasher.hash(pwd);

      const user = await userAccountRepo.create({
        email: 'socio.test@prolocal.it',
        passwordHash: hash,
        actorType: ActorType.TECHNICAL_ADMIN
      });

      await assert.rejects(
        async () => {
          await authService.authenticate('socio.test@prolocal.it', 'PasswordSbagliata');
        },
        (err: any) => err instanceof InvalidCredentialsError
      );

      const updatedUser = await userAccountRepo.findById(user.id);
      assert.strictEqual(updatedUser?.failedLoginAttempts, 1);
      assert.strictEqual(updatedUser?.lockedUntil, null);

      const logs = await auditLogRepo.findAll();
      const failLog = logs.find((l) => l.action === 'LOGIN_FAILED');
      assert(failLog);
      assert.strictEqual((failLog.metadata as any)?.failedAttempts, 1);
    });

    it('login fallito con account inattivo (isActive=false): solleva AccountInactiveError', async () => {
      const { userAccountRepo, authService } = await createTestContext();

      const pwd = 'Pwd!';
      const hash = await hasher.hash(pwd);

      await userAccountRepo.create({
        email: 'inattivo@prolocal.it',
        passwordHash: hash,
        actorType: ActorType.TECHNICAL_ADMIN,
        isActive: false
      });

      await assert.rejects(
        async () => {
          await authService.authenticate('inattivo@prolocal.it', pwd);
        },
        (err: any) => err instanceof AccountInactiveError
      );
    });
  });

  // =========================================================================
  // 2. ACCOUNT LOCKOUT TESTS
  // =========================================================================
  describe('Account Lockout & Recovery', () => {
    it('5 tentativi consecutivi falliti attivano il blocco di 15 minuti; sesto tentativo negato', async () => {
      const { userAccountRepo, authService } = await createTestContext();

      const pwd = 'MiaPassword123!';
      const hash = await hasher.hash(pwd);

      const user = await userAccountRepo.create({
        email: 'lockout.test@prolocal.it',
        passwordHash: hash,
        actorType: ActorType.TECHNICAL_ADMIN
      });

      const baseTime = new Date('2026-09-11T10:00:00.000Z');

      // Tentativi 1..4: falliscono con InvalidCredentialsError
      for (let i = 1; i <= 4; i++) {
        await assert.rejects(
          async () => authService.authenticate('lockout.test@prolocal.it', 'errata', undefined, baseTime),
          (err: any) => err instanceof InvalidCredentialsError
        );
        const u = await userAccountRepo.findById(user.id);
        assert.strictEqual(u?.failedLoginAttempts, i);
        assert.strictEqual(u?.lockedUntil, null);
      }

      // Quinto tentativo fallito: fa scattare AccountLockedError con blocco a 15 min
      await assert.rejects(
        async () => authService.authenticate('lockout.test@prolocal.it', 'errata', undefined, baseTime),
        (err: any) => {
          assert(err instanceof AccountLockedError);
          const expectedLock = new Date(baseTime.getTime() + 15 * 60 * 1000).toISOString();
          assert.strictEqual(err.lockedUntil, expectedLock);
          return true;
        }
      );

      const userAfter5 = await userAccountRepo.findById(user.id);
      assert.strictEqual(userAfter5?.failedLoginAttempts, 5);
      assert(userAfter5?.lockedUntil);

      // Sesto tentativo anche con password CORRETTA durante il lockout: negato con AccountLockedError
      const duringLockoutTime = new Date('2026-09-11T10:10:00.000Z'); // 10 min dopo (ancora bloccato)
      await assert.rejects(
        async () => authService.authenticate('lockout.test@prolocal.it', pwd, undefined, duringLockoutTime),
        (err: any) => err instanceof AccountLockedError
      );

      // Login dopo scadenza del blocco (16 minuti dopo): deve avere successo e resettare il contatore
      const afterLockoutTime = new Date('2026-09-11T10:16:00.000Z');
      const loginSuccess = await authService.authenticate('lockout.test@prolocal.it', pwd, undefined, afterLockoutTime);
      assert(loginSuccess.rawSessionToken);

      const userUnlocked = await userAccountRepo.findById(user.id);
      assert.strictEqual(userUnlocked?.failedLoginAttempts, 0, 'Il contatore fallimenti deve essere azzerato');
      assert.strictEqual(userUnlocked?.lockedUntil, null, 'lockedUntil deve essere resettato a null');
    });

    it('login corretto azzera tentativi falliti accumulati inferiori a 5', async () => {
      const { userAccountRepo, authService } = await createTestContext();

      const pwd = 'PasswordSicura!';
      const hash = await hasher.hash(pwd);

      const user = await userAccountRepo.create({
        email: 'accumulo@prolocal.it',
        passwordHash: hash,
        actorType: ActorType.TECHNICAL_ADMIN
      });

      // 3 tentativi falliti
      await assert.rejects(async () => authService.authenticate('accumulo@prolocal.it', 'err1'), (err) => err instanceof InvalidCredentialsError);
      await assert.rejects(async () => authService.authenticate('accumulo@prolocal.it', 'err2'), (err) => err instanceof InvalidCredentialsError);
      await assert.rejects(async () => authService.authenticate('accumulo@prolocal.it', 'err3'), (err) => err instanceof InvalidCredentialsError);

      let u = await userAccountRepo.findById(user.id);
      assert.strictEqual(u?.failedLoginAttempts, 3);

      // Quarto tentativo con password giusta: successo e reset a 0
      const res = await authService.authenticate('accumulo@prolocal.it', pwd);
      assert(res.rawSessionToken);

      u = await userAccountRepo.findById(user.id);
      assert.strictEqual(u?.failedLoginAttempts, 0);
      assert.strictEqual(u?.lockedUntil, null);
    });
  });

  // =========================================================================
  // 3. ACTOR RESOLUTION & ROLE DERIVATION TESTS
  // =========================================================================
  describe('Authenticated Actor Resolution', () => {
    it('risolve TECHNICAL_ADMIN con ruolo AMMINISTRATORE_TECNICO e memberId null (non interroga tabella members)', async () => {
      const { userAccountRepo, authService } = await createTestContext();

      const pwd = 'AdminTechPassword!';
      const hash = await hasher.hash(pwd);

      await userAccountRepo.create({
        id: 'usr-admin-01',
        email: 'tech.admin@prolocal.internal',
        passwordHash: hash,
        actorType: ActorType.TECHNICAL_ADMIN,
        memberId: null
      });

      const { rawSessionToken } = await authService.authenticate('tech.admin@prolocal.internal', pwd);

      const actor = await authService.resolveAuthenticatedActor(rawSessionToken);
      assert.strictEqual(actor.userId, 'usr-admin-01');
      assert.strictEqual(actor.actorType, ActorType.TECHNICAL_ADMIN);
      assert.strictEqual(actor.role, ProLocalRole.AMMINISTRATORE_TECNICO);
      assert.strictEqual(actor.memberId, null);
      assert.strictEqual(actor.member, null);
      assert.strictEqual(actor.membershipStatus, null);
    });

    it('risolve MEMBER recuperando il Member dal DB: ruolo SOCIO e stato associativo derivato dinamicamente da members', async () => {
      const testMember: Member = {
        id: 'mem-real-01',
        codiceSocio: 'SOC-2024-001',
        nomeCognome: 'Mario Rossi',
        emailDemo: 'mario@test.it',
        dataIscrizione: '2024-01-01',
        statoAssociativo: MembershipStatus.ATTIVO,
        quotaSocialeInRegola: true
      };

      const { userAccountRepo, memberRepo, authService } = await createTestContext([testMember]);

      const pwd = 'MemberPassword!';
      const hash = await hasher.hash(pwd);

      await userAccountRepo.create({
        id: 'usr-member-01',
        email: 'mario@test.it',
        passwordHash: hash,
        actorType: ActorType.MEMBER,
        memberId: 'mem-real-01'
      });

      const { rawSessionToken } = await authService.authenticate('mario@test.it', pwd);

      // Risoluzione iniziale: socio ATTIVO
      const actor = await authService.resolveAuthenticatedActor(rawSessionToken);
      assert.strictEqual(actor.userId, 'usr-member-01');
      assert.strictEqual(actor.actorType, ActorType.MEMBER);
      assert.strictEqual(actor.role, ProLocalRole.SOCIO);
      assert.strictEqual(actor.memberId, 'mem-real-01');
      assert.strictEqual(actor.member?.id, 'mem-real-01');
      assert.strictEqual(actor.membershipStatus, MembershipStatus.ATTIVO);

      // Mutazione stato nel repository members (ad es. Consiglio Direttivo sospende il socio)
      await memberRepo.updateStatus('mem-real-01', MembershipStatus.SOSPESO);

      // Nuova risoluzione: lo stato associativo DEVE riflettere SOSPESO senza richiedere un nuovo login
      const actorSuspended = await authService.resolveAuthenticatedActor(rawSessionToken);
      assert.strictEqual(actorSuspended.membershipStatus, MembershipStatus.SOSPESO);
      assert.strictEqual(actorSuspended.member?.statoAssociativo, MembershipStatus.SOSPESO);
    });

    it('se il Member associato viene cancellato o non trovato, solleva SessionInvalidError e revoca la sessione', async () => {
      const { userAccountRepo, sessionRepo, authService } = await createTestContext(); // Nessun member registrato

      const pwd = 'OrphanPassword!';
      const hash = await hasher.hash(pwd);

      await userAccountRepo.create({
        id: 'usr-orphan',
        email: 'orphan@test.it',
        passwordHash: hash,
        actorType: ActorType.MEMBER,
        memberId: 'mem-non-esistente'
      });

      const { rawSessionToken } = await authService.authenticate('orphan@test.it', pwd);

      await assert.rejects(
        async () => authService.resolveAuthenticatedActor(rawSessionToken),
        (err: any) => err instanceof SessionInvalidError
      );

      // Verifica che la sessione sia stata rimossa
      const sessionHash = hashSessionId(rawSessionToken);
      assert.strictEqual(await sessionRepo.findBySessionHash(sessionHash), null);
    });
  });

  // =========================================================================
  // 4. SESSION TIMEOUTS & LIFECYCLE TESTS
  // =========================================================================
  describe('Session Lifecycle, Expirations & Token Manipulation', () => {
    it('rifiuta token inesistente, token vuoto o token manomesso', async () => {
      const { authService } = await createTestContext();

      await assert.rejects(async () => authService.resolveAuthenticatedActor(''), (err) => err instanceof SessionInvalidError);
      await assert.rejects(async () => authService.resolveAuthenticatedActor('token-inesistente-12345'), (err) => err instanceof SessionInvalidError);
      await assert.rejects(async () => authService.resolveAuthenticatedActor('11223344556677889900aabbccddeeff'), (err) => err instanceof SessionInvalidError);
    });

    it('aggiorna lastAccessedAt ad ogni accesso valido senza estendere l expires_at assoluto', async () => {
      const { userAccountRepo, sessionRepo, authService } = await createTestContext();

      const pwd = 'Pwd!';
      const hash = await hasher.hash(pwd);

      await userAccountRepo.create({
        id: 'usr-time-test',
        email: 'time@test.it',
        passwordHash: hash,
        actorType: ActorType.TECHNICAL_ADMIN
      });

      const t0 = new Date('2026-09-11T10:00:00.000Z');
      const { rawSessionToken, sessionExpiresAt } = await authService.authenticate('time@test.it', pwd, undefined, t0);

      // Accesso dopo 10 minuti
      const t1 = new Date('2026-09-11T10:10:00.000Z');
      const actor1 = await authService.resolveAuthenticatedActor(rawSessionToken, t1);
      assert.strictEqual(actor1.session.lastAccessedAt, '2026-09-11T10:10:00.000Z');
      assert.strictEqual(actor1.session.expiresAt, sessionExpiresAt, 'expiresAt assoluto NON deve essere modificato');

      // Accesso dopo altri 15 minuti (25 min da t0)
      const t2 = new Date('2026-09-11T10:25:00.000Z');
      const actor2 = await authService.resolveAuthenticatedActor(rawSessionToken, t2);
      assert.strictEqual(actor2.session.lastAccessedAt, '2026-09-11T10:25:00.000Z');
      assert.strictEqual(actor2.session.expiresAt, sessionExpiresAt, 'expiresAt assoluto rimane fisso a 8 ore');

      const storedSession = await sessionRepo.findBySessionHash(hashSessionId(rawSessionToken));
      assert.strictEqual(storedSession?.lastAccessedAt, '2026-09-11T10:25:00.000Z');
    });

    it('idle timeout (30 minuti di inattività): sessione negata ed eliminata', async () => {
      const { userAccountRepo, sessionRepo, authService } = await createTestContext();

      const pwd = 'Pwd!';
      const hash = await hasher.hash(pwd);

      await userAccountRepo.create({
        id: 'usr-idle-test',
        email: 'idle@test.it',
        passwordHash: hash,
        actorType: ActorType.TECHNICAL_ADMIN
      });

      const t0 = new Date('2026-09-11T10:00:00.000Z');
      const { rawSessionToken } = await authService.authenticate('idle@test.it', pwd, undefined, t0);

      // Accesso 31 minuti dopo (inattivo per più di 30 min)
      const tIdleExpired = new Date('2026-09-11T10:31:00.000Z');
      await assert.rejects(
        async () => authService.resolveAuthenticatedActor(rawSessionToken, tIdleExpired),
        (err: any) => {
          assert(err instanceof SessionInvalidError);
          assert.strictEqual(err.reason, 'EXPIRED_IDLE');
          return true;
        }
      );

      // La sessione deve essere stata rimossa dal repository
      const s = await sessionRepo.findBySessionHash(hashSessionId(rawSessionToken));
      assert.strictEqual(s, null, 'Sessione scaduta per inattività deve essere revocata');
    });

    it('absolute timeout (8 ore dalla creazione): sessione negata ed eliminata anche se c è stata attività recente', async () => {
      const { userAccountRepo, sessionRepo, authService } = await createTestContext();

      const pwd = 'Pwd!';
      const hash = await hasher.hash(pwd);

      await userAccountRepo.create({
        id: 'usr-abs-test',
        email: 'abs@test.it',
        passwordHash: hash,
        actorType: ActorType.TECHNICAL_ADMIN
      });

      const t0 = new Date('2026-09-11T10:00:00.000Z');
      const { rawSessionToken } = await authService.authenticate('abs@test.it', pwd, undefined, t0);

      // Accessi intermedi periodici (es. ogni 20 minuti) per mantenere la sessione attiva ed evitare l'idle timeout (30m)
      let currentTime = new Date(t0.getTime());
      // Avanziamo fino a 7 ore e 40 minuti con ping periodici ogni 20 minuti
      for (let i = 0; i < 23; i++) {
        currentTime = new Date(currentTime.getTime() + 20 * 60 * 1000);
        await authService.resolveAuthenticatedActor(rawSessionToken, currentTime);
      }

      // Ultimo accesso valido a 7 ore e 50 minuti dalla creazione (10 minuti dopo l'ultimo ping a 7h40m)
      const t7h50 = new Date(t0.getTime() + (7 * 60 + 50) * 60 * 1000);
      const validActor = await authService.resolveAuthenticatedActor(rawSessionToken, t7h50);
      assert(validActor);

      // Accesso a 8 ore e 1 minuto dalla creazione (superato absolute timeout di 8h, sebbene l'ultimo accesso fosse di soli 11 min fa)
      const t8h01 = new Date(t0.getTime() + (8 * 60 + 1) * 60 * 1000);
      await assert.rejects(
        async () => authService.resolveAuthenticatedActor(rawSessionToken, t8h01),
        (err: any) => {
          assert(err instanceof SessionInvalidError);
          assert.strictEqual(err.reason, 'EXPIRED_ABSOLUTE');
          return true;
        }
      );

      const s = await sessionRepo.findBySessionHash(hashSessionId(rawSessionToken));
      assert.strictEqual(s, null, 'Sessione superata il limite assoluto di 8 ore deve essere revocata');
    });
  });

  // =========================================================================
  // 5. LOGOUT TESTS
  // =========================================================================
  describe('Logout & Idempotency', () => {
    it('logout revoca la sessione, registra audit LOGOUT, ed è idempotente su chiamate ripetute', async () => {
      const { userAccountRepo, sessionRepo, auditLogRepo, authService } = await createTestContext();

      const pwd = 'Pwd!';
      const hash = await hasher.hash(pwd);

      await userAccountRepo.create({
        id: 'usr-logout-test',
        email: 'logout@test.it',
        passwordHash: hash,
        actorType: ActorType.TECHNICAL_ADMIN
      });

      const { rawSessionToken } = await authService.authenticate('logout@test.it', pwd);
      const sessionHash = hashSessionId(rawSessionToken);

      assert(await sessionRepo.findBySessionHash(sessionHash));

      // Primo logout
      await authService.logout(rawSessionToken, { ipAddress: '192.168.1.10' });
      assert.strictEqual(await sessionRepo.findBySessionHash(sessionHash), null, 'La sessione deve essere cancellata');

      // Verifica audit log di logout
      const logs = await auditLogRepo.findAll();
      const logoutLog = logs.find((l) => l.action === 'LOGOUT');
      assert(logoutLog);
      assert.strictEqual(logoutLog.actorId, 'usr-logout-test');

      // Secondo logout ripetuto: NON deve sollevare eccezioni (idempotente)
      await authService.logout(rawSessionToken);
      await authService.logout('');
      await authService.logout('qualsiasi-token-inesistente');
    });
  });
});
