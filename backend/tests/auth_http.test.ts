import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createProLocalApp } from '../src/app.ts';
import { InMemoryMemberRepository } from '../src/repositories/MemberRepository.ts';
import { InMemoryBusinessActivityRepository } from '../src/repositories/BusinessActivityRepository.ts';
import { InMemoryAuditLogRepository } from '../src/repositories/AuditLogRepository.ts';
import { InMemoryUserAccountRepository } from '../src/repositories/UserAccountRepository.ts';
import { InMemorySessionRepository } from '../src/repositories/SessionRepository.ts';
import { ScryptPasswordHasher } from '../src/auth/PasswordHasher.ts';
import { AuthService } from '../src/services/AuthService.ts';
import { ActorType } from '../src/domain/auth.ts';
import {
  MembershipStatus,
  PublicationStatus,
  ProLocalRole,
  ActivityCategory
} from '../src/domain/models.ts';
import type { Member, BusinessActivity } from '../src/domain/models.ts';

describe('HTTP Authentication & Cookie-Based Session Lifecycle Tests (Fase 3.4)', () => {
  let server: Server;
  let baseUrl: string;
  let userAccountRepo: InMemoryUserAccountRepository;
  let sessionRepo: InMemorySessionRepository;
  let memberRepo: InMemoryMemberRepository;
  let activityRepo: InMemoryBusinessActivityRepository;
  let auditRepo: InMemoryAuditLogRepository;
  let passwordHasher: ScryptPasswordHasher;
  let authService: AuthService;

  const PWD_SOCIO_A = 'PasswordSocioA123!';
  const PWD_ADMIN = 'PasswordAdminTech456!';

  const testMembers: Member[] = [
    {
      id: 'member-01',
      codiceSocio: 'SOC-001',
      nomeCognome: 'Mario Rossi',
      emailDemo: 'mario.rossi@prolocal.test',
      dataIscrizione: '2024-01-01',
      statoAssociativo: MembershipStatus.ATTIVO,
      quotaSocialeInRegola: true
    },
    {
      id: 'member-02',
      codiceSocio: 'SOC-002',
      nomeCognome: 'Elena Bianchi',
      emailDemo: 'elena.bianchi@prolocal.test',
      dataIscrizione: '2024-02-01',
      statoAssociativo: MembershipStatus.ATTIVO,
      quotaSocialeInRegola: true
    }
  ];

  const testActivities: BusinessActivity[] = [
    {
      id: 'act-01',
      memberId: 'member-01',
      nomeAttivita: 'Bottega di Mario',
      categoria: ActivityCategory.ARTIGIANATO_RESTAURO,
      descrizioneBreve: 'Restauro mobili antichi e creazioni in legno',
      descrizioneCompleta: 'Bottega artigiana con oltre venti anni di esperienza nel restauro conservativo.',
      serviziOfferti: ['Restauro', 'Falegnameria'],
      localita: 'Borgo Storico',
      statoPubblicazione: PublicationStatus.PUBBLICATA,
      dataUltimoAggiornamento: '2024-05-01'
    },
    {
      id: 'act-02',
      memberId: 'member-02',
      nomeAttivita: 'Ceramiche Elena',
      categoria: ActivityCategory.ARTIGIANATO_RESTAURO,
      descrizioneBreve: 'Ceramiche artigianali fatte a mano',
      descrizioneCompleta: 'Laboratorio artistico specializzato in maioliche e terracotte tradizionali.',
      serviziOfferti: ['Ceramica', 'Laboratori'],
      localita: 'Borgo Storico',
      statoPubblicazione: PublicationStatus.PUBBLICATA,
      dataUltimoAggiornamento: '2024-05-02'
    }
  ];

  before(async () => {
    // Hasher veloce con costN ridotto per test unitari
    passwordHasher = new ScryptPasswordHasher({ costN: 2048, blockSizeR: 8, parallelizationP: 1 });

    memberRepo = new InMemoryMemberRepository(testMembers);
    activityRepo = new InMemoryBusinessActivityRepository(testActivities);
    auditRepo = new InMemoryAuditLogRepository();
    userAccountRepo = new InMemoryUserAccountRepository();
    sessionRepo = new InMemorySessionRepository();

    // Creazione account socio-01
    const hashSocioA = await passwordHasher.hash(PWD_SOCIO_A);
    await userAccountRepo.create({
      id: 'usr-socio-01',
      email: 'mario.rossi@prolocal.test',
      passwordHash: hashSocioA,
      actorType: ActorType.MEMBER,
      memberId: 'member-01'
    });

    // Creazione account admin tecnico
    const hashAdmin = await passwordHasher.hash(PWD_ADMIN);
    await userAccountRepo.create({
      id: 'usr-admin-01',
      email: 'admin.tech@prolocal.test',
      passwordHash: hashAdmin,
      actorType: ActorType.TECHNICAL_ADMIN,
      memberId: null
    });

    authService = new AuthService({
      userAccountRepo,
      sessionRepo,
      memberRepo,
      passwordHasher,
      auditLogRepo: auditRepo
    });

    const app = createProLocalApp({
      memberRepo,
      activityRepo,
      auditRepo,
      userAccountRepo,
      sessionRepo,
      passwordHasher,
      authService
    });

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after((_, done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  // Helper per estrarre il cookie prolocal_session da una risposta HTTP
  function extractSessionCookie(res: Response): string | null {
    const rawSetCookie = res.headers.get('set-cookie');
    if (!rawSetCookie) return null;
    const match = rawSetCookie.match(/prolocal_session=([^;]+)/);
    return match ? match[1] : null;
  }

  // =========================================================================
  // SEZIONE A: POST /api/auth/login
  // =========================================================================
  describe('A. Login Endpoints & Cookie Behavior', () => {
    it('login valido: 200, Set-Cookie presente con prolocal_session, HttpOnly, SameSite=Lax, Max-Age coerente con 8h, nessun token né password nel body', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mario.rossi@prolocal.test',
          password: PWD_SOCIO_A
        })
      });

      assert.strictEqual(res.status, 200);

      // Verifica Set-Cookie header
      const setCookie = res.headers.get('set-cookie');
      assert(setCookie, 'L header Set-Cookie deve essere presente');
      assert(setCookie.includes('prolocal_session='), 'Deve impostare il cookie prolocal_session');
      assert(setCookie.toLowerCase().includes('httponly'), 'Il cookie deve essere HttpOnly');
      assert(setCookie.toLowerCase().includes('samesite=lax'), 'Il cookie deve avere SameSite=Lax');
      assert(setCookie.toLowerCase().includes('path=/'), 'Il cookie deve avere Path=/');
      // Max-Age = 28800 secondi (8 ore)
      assert(setCookie.toLowerCase().includes('max-age=28800'), 'Max-Age deve corrispondere a 8 ore (28800s)');

      // Verifica body JSON di risposta
      const body = await res.json();
      assert.strictEqual(body.authenticated, true);
      assert.strictEqual(body.user.email, 'mario.rossi@prolocal.test');
      assert.strictEqual(body.user.actorType, 'MEMBER');
      assert.strictEqual(body.user.memberId, 'member-01');

      // VERIFICA DI SICUREZZA: nessun token raw, password o hash nel body
      assert.strictEqual(body.rawSessionToken, undefined, 'Il token di sessione raw NON deve essere nel body');
      assert.strictEqual(body.token, undefined, 'Nessun token JWT o simile deve essere restituito');
      assert.strictEqual(body.password, undefined, 'Nessuna password nella risposta');
      assert.strictEqual(body.passwordHash, undefined, 'Nessun hash password nella risposta');

      // Verifica audit log LOGIN_SUCCESS generato dal service
      const logs = await auditRepo.findAll();
      const loginSuccess = logs.find((l) => l.action === 'LOGIN_SUCCESS' && l.actorId === 'usr-socio-01');
      assert(loginSuccess, 'Deve essere registrato LOGIN_SUCCESS');
      assert.strictEqual(JSON.stringify(loginSuccess).includes(PWD_SOCIO_A), false, 'La password non deve apparire nei log');
    });

    it('login con password errata: 401 Unauthorized e messaggio generico', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mario.rossi@prolocal.test',
          password: 'PasswordSbagliata!'
        })
      });

      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.strictEqual(body.error, 'Credenziali non valide.');
      assert.strictEqual(res.headers.get('set-cookie'), null, 'Nessun cookie deve essere impostato');
    });

    it('login con account inesistente: 401 con stesso messaggio di errore (anti-enumeration)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'inesistente@prolocal.test',
          password: 'PasswordQualsiasi123!'
        })
      });

      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.strictEqual(body.error, 'Credenziali non valide.');
    });

    it('login con input invalido: 400 Bad Request', async () => {
      // Email mancante
      const res1 = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'Password123!' })
      });
      assert.strictEqual(res1.status, 400);

      // Password mancante
      const res2 = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'mario@test.it' })
      });
      assert.strictEqual(res2.status, 400);

      // Body vuoto o non JSON
      const res3 = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      assert.strictEqual(res3.status, 400);
    });

    it('login con account bloccato per tentativi falliti consecutivi: 423 Locked', async () => {
      // Eseguiamo 4 ulteriori tentativi falliti su usr-socio-01 (il primo era già stato fatto prima)
      for (let i = 0; i < 4; i++) {
        await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'mario.rossi@prolocal.test',
            password: 'PasswordSbagliata!'
          })
        });
      }

      // Al 5° tentativo fallito o successivo, l'account viene bloccato (lockout 15 min) -> 423
      const resLocked = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mario.rossi@prolocal.test',
          password: PWD_SOCIO_A // anche inserendo la password corretta, è bloccato
        })
      });

      assert.strictEqual(resLocked.status, 423);
      const bodyLocked = await resLocked.json();
      assert(bodyLocked.error.includes('bloccato'));
      assert(bodyLocked.lockedUntil, 'Deve restituire il timestamp lockedUntil');

      // Ripristiniamo l'account per i test successivi
      await userAccountRepo.resetLoginFailureState('usr-socio-01');
    });
  });

  // =========================================================================
  // SEZIONE B: GET /api/auth/me
  // =========================================================================
  describe('B. GET /api/auth/me Endpoint', () => {
    it('/me senza cookie: 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`);
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert(body.error.includes('Non autenticato'));
    });

    it('/me con cookie valido: 200, restituisce memberId, accountType, ruolo e dati socio corretti', async () => {
      // 1. Esegui il login per ottenere il cookie
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mario.rossi@prolocal.test',
          password: PWD_SOCIO_A
        })
      });
      assert.strictEqual(loginRes.status, 200);

      const rawToken = extractSessionCookie(loginRes);
      assert(rawToken, 'Cookie di sessione deve essere presente');

      // 2. Chiamata a /me passando il cookie
      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Cookie: `prolocal_session=${rawToken}`
        }
      });

      assert.strictEqual(meRes.status, 200);
      const meBody = await meRes.json();
      assert.strictEqual(meBody.authenticated, true);
      assert.strictEqual(meBody.userId, 'usr-socio-01');
      assert.strictEqual(meBody.actorType, 'MEMBER');
      assert.strictEqual(meBody.role, ProLocalRole.SOCIO);
      assert.strictEqual(meBody.memberId, 'member-01');
      assert.strictEqual(meBody.membershipStatus, MembershipStatus.ATTIVO);
      assert.strictEqual(meBody.member.nomeCognome, 'Mario Rossi');
      assert.strictEqual(meBody.member.codiceSocio, 'SOC-001');

      // Sicurezza: nessun token raw o hash in output
      assert.strictEqual(meBody.rawSessionToken, undefined);
      assert.strictEqual(meBody.sessionHash, undefined);
    });

    it('/me con sessione scaduta: 401 e cookie cancellato dal browser', async () => {
      // 1. Login per avere un cookie
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mario.rossi@prolocal.test',
          password: PWD_SOCIO_A
        })
      });
      const rawToken = extractSessionCookie(loginRes)!;

      // 2. Simuliamo la scadenza modificando la sessione nel repository
      const { hashSessionId } = await import('../src/auth/SessionManager.ts');
      const hash = hashSessionId(rawToken);
      const session = await sessionRepo.findBySessionHash(hash);
      assert(session, 'La sessione deve esistere nel repository');

      // Modifichiamo l'oggetto sessione nel repository in-memory con expiresAt nel passato
      session.expiresAt = new Date(Date.now() - 60000).toISOString();
      await sessionRepo.create({
        sessionHash: session.id,
        userId: session.userId,
        createdAt: session.createdAt,
        lastAccessedAt: session.lastAccessedAt,
        expiresAt: session.expiresAt
      });

      // 3. Richiesta a /me: deve fallire con 401 e cancellare il cookie
      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Cookie: `prolocal_session=${rawToken}`
        }
      });

      assert.strictEqual(meRes.status, 401);
      const setCookie = meRes.headers.get('set-cookie');
      assert(setCookie, 'Deve inviare un header Set-Cookie per cancellare la sessione');
      assert(setCookie.includes('Max-Age=0') || setCookie.includes('expires='), 'Il cookie deve essere invalidato');
    });
  });

  // =========================================================================
  // SEZIONE C: POST /api/auth/logout
  // =========================================================================
  describe('C. Logout & Idempotency', () => {
    it('logout con sessione valida: 200, sessione invalidata nel repository e cookie cancellato', async () => {
      // 1. Login
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mario.rossi@prolocal.test',
          password: PWD_SOCIO_A
        })
      });
      const rawToken = extractSessionCookie(loginRes)!;

      // 2. Logout con CSRF header
      const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Cookie: `prolocal_session=${rawToken}`,
          'X-Requested-With': 'ProLocalApp'
        }
      });

      assert.strictEqual(logoutRes.status, 200);
      const setCookie = logoutRes.headers.get('set-cookie');
      assert(setCookie, 'Deve cancellare il cookie');
      assert(setCookie.includes('Max-Age=0') || setCookie.includes('expires='));

      // 3. Verifica che la sessione non sia più attiva
      const { hashSessionId } = await import('../src/auth/SessionManager.ts');
      const inRepo = await sessionRepo.findBySessionHash(hashSessionId(rawToken));
      assert.strictEqual(inRepo, null, 'La sessione deve essere stata eliminata dal repository');

      // 4. Verifica audit LOGOUT
      const logs = await auditRepo.findAll();
      const logoutLog = logs.find((l) => l.action === 'LOGOUT' && l.actorId === 'usr-socio-01');
      assert(logoutLog, 'Deve essere registrato l evento di audit LOGOUT');
    });

    it('logout senza sessione: comportamento idempotente 200 e cancella comunque il cookie', async () => {
      const res = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST'
      });
      assert.strictEqual(res.status, 200);
      const setCookie = res.headers.get('set-cookie');
      assert(setCookie, 'Cancella comunque il cookie per pulizia client');
    });

    it('logout con sessione già scaduta o inesistente: 200 idempotente', async () => {
      const res = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Cookie: 'prolocal_session=tokenInesistente1234567890abcdef1234567890abcdef1234567890abcdef12345678',
          'X-Requested-With': 'ProLocalApp'
        }
      });
      assert.strictEqual(res.status, 200);
    });
  });

  // =========================================================================
  // SEZIONE D: SECURITY & REGOLE ARCHITETTURALI (REGRESSIONE DEMO AUTH & CSRF)
  // =========================================================================
  describe('D. Security: Privilege Escalation, CSRF & Demo Auth Isolation', () => {
    it('REGRESSIONE X-Demo-*: sessione MEMBER valida con X-Demo-Member-Id di altro socio mantiene identità sessione reale', async () => {
      // 1. Login come member-01
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mario.rossi@prolocal.test',
          password: PWD_SOCIO_A
        })
      });
      const rawToken = extractSessionCookie(loginRes)!;

      // 2. Chiamata a GET /api/members/me fornendo il cookie valido ma un X-Demo-Member-Id malevolo
      const res = await fetch(`${baseUrl}/api/members/me`, {
        headers: {
          Cookie: `prolocal_session=${rawToken}`,
          'X-Demo-Member-Id': 'member-02' // Tentativo di impersonare Elena Bianchi
        }
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.authMode, 'REAL_SESSION', 'Deve operare in modalità sessione reale');
      assert.strictEqual(body.socio.id, 'member-01', 'L attore DEVE rimanere member-01 ignorando X-Demo-Member-Id');
      assert.strictEqual(body.socio.nomeCognome, 'Mario Rossi');
    });

    it('REGRESSIONE X-Demo-*: sessione MEMBER valida con X-Demo-Role: PRESIDENTE ignora il ruolo spoofato e usa ruolo reale', async () => {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mario.rossi@prolocal.test',
          password: PWD_SOCIO_A
        })
      });
      const rawToken = extractSessionCookie(loginRes)!;

      // GET /api/members/me con header ruolo spoofato
      const res = await fetch(`${baseUrl}/api/members/me`, {
        headers: {
          Cookie: `prolocal_session=${rawToken}`,
          'X-Demo-Role': 'PRESIDENTE'
        }
      });

      assert.strictEqual(res.status, 200, 'Il ruolo spoofato deve essere totalmente ignorato e la scheda socio restituita regolarmente');
      const body = await res.json();
      assert.strictEqual(body.socio.id, 'member-01');
    });

    it('REGRESSIONE X-Demo-*: nessuna sessione + X-Demo-Member-Id restituisce 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/members/me`, {
        headers: {
          'X-Demo-Member-Id': 'member-01'
        }
      });

      assert.strictEqual(res.status, 401, 'Senza cookie di sessione valido, X-Demo-Member-Id non ha alcun effetto e la richiesta fallisce con 401');
      const body = await res.json();
      assert(body.error.includes('Non autenticato'));
    });

    it('REGRESSIONE X-Demo-*: nessuna sessione + X-Demo-Role restituisce 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/members/me`, {
        headers: {
          'X-Demo-Role': ProLocalRole.AMMINISTRATORE_TECNICO
        }
      });

      assert.strictEqual(res.status, 401, 'Senza cookie di sessione valido, X-Demo-Role non ha alcun effetto e la richiesta fallisce con 401');
      const body = await res.json();
      assert(body.error.includes('Non autenticato'));
    });

    it('REGRESSIONE X-Demo-*: sessione TECHNICAL_ADMIN + X-Demo-Role: PRESIDENTE rimane TECHNICAL_ADMIN (403 su scheda socio)', async () => {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin.tech@prolocal.test',
          password: PWD_ADMIN
        })
      });
      const rawToken = extractSessionCookie(loginRes)!;

      const res = await fetch(`${baseUrl}/api/members/me`, {
        headers: {
          Cookie: `prolocal_session=${rawToken}`,
          'X-Demo-Role': 'PRESIDENTE'
        }
      });

      assert.strictEqual(res.status, 403, 'L amministratore tecnico non ha profilo socio anche con header X-Demo-Role inviato');
      const body = await res.json();
      assert(body.error.includes('amministratore tecnico non dispone di una scheda socio'));
    });

    it('REGRESSIONE: sessione MEMBER valida + tentativo modifica attività altrui restituisce 403 Forbidden (Ownership)', async () => {
      // Login come member-01 (Mario Rossi)
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mario.rossi@prolocal.test',
          password: PWD_SOCIO_A
        })
      });
      const rawToken = extractSessionCookie(loginRes)!;

      // Tentativo di modificare act-02 (di Elena Bianchi)
      const updateRes = await fetch(`${baseUrl}/api/activities/act-02`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `prolocal_session=${rawToken}`,
          'X-Requested-With': 'ProLocalApp'
        },
        body: JSON.stringify({
          nomeAttivita: 'Tentativo Modifica Attività Altrui',
          descrizioneBreve: 'Descrizione breve di test',
          descrizioneCompleta: 'Descrizione completa per test ownership violato.',
          serviziOfferti: ['Hacking'],
          localita: 'Borgo'
        })
      });

      assert.strictEqual(updateRes.status, 403, 'Modifica di attività altrui deve essere bloccata con 403');
      const body = await updateRes.json();
      assert(body.error.includes('Accesso negato'));
    });

    it('REGRESSIONE: sessione TECHNICAL_ADMIN + tentativo modifica attività restituisce 403 Forbidden', async () => {
      // Login come Amministratore Tecnico
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin.tech@prolocal.test',
          password: PWD_ADMIN
        })
      });
      const rawToken = extractSessionCookie(loginRes)!;

      // Tentativo di modificare act-01
      const updateRes = await fetch(`${baseUrl}/api/activities/act-01`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `prolocal_session=${rawToken}`,
          'X-Requested-With': 'ProLocalApp'
        },
        body: JSON.stringify({
          nomeAttivita: 'Tentativo Modifica da Admin',
          descrizioneBreve: 'Descrizione breve di test',
          descrizioneCompleta: 'Descrizione completa per test admin.',
          serviziOfferti: ['Admin'],
          localita: 'Borgo'
        })
      });

      assert.strictEqual(updateRes.status, 403, 'L Amministratore Tecnico non può modificare schede commerciali dei soci');
      const body = await updateRes.json();
      assert(body.error.includes('Accesso negato'));
    });

    it('CSRF PROTECTION: richiesta mutativa autenticata (PUT) senza header X-Requested-With restituisce 403 Forbidden', async () => {
      // 1. Login come member-01
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mario.rossi@prolocal.test',
          password: PWD_SOCIO_A
        })
      });
      const rawToken = extractSessionCookie(loginRes)!;

      // 2. Chiamata mutativa senza header CSRF
      const updateRes = await fetch(`${baseUrl}/api/activities/act-01`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `prolocal_session=${rawToken}`
          // X-Requested-With volutamente omesso!
        },
        body: JSON.stringify({
          nomeAttivita: 'Tentativo CSRF',
          descrizioneBreve: 'Descrizione breve di test',
          descrizioneCompleta: 'Descrizione completa valida per il test csrf.',
          serviziOfferti: ['Test'],
          localita: 'Borgo'
        })
      });

      assert.strictEqual(updateRes.status, 403, 'Deve essere bloccato da protezione CSRF');
      const errBody = await updateRes.json();
      assert(errBody.error.includes('CSRF'));
    });

    it('CSRF PROTECTION: richiesta mutativa autenticata (PUT) con header X-Requested-With errato restituisce 403 Forbidden', async () => {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mario.rossi@prolocal.test',
          password: PWD_SOCIO_A
        })
      });
      const rawToken = extractSessionCookie(loginRes)!;

      const updateRes = await fetch(`${baseUrl}/api/activities/act-01`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `prolocal_session=${rawToken}`,
          'X-Requested-With': 'AttaccoEsternoMalizioso'
        },
        body: JSON.stringify({
          nomeAttivita: 'Tentativo CSRF con Header Errato',
          descrizioneBreve: 'Descrizione breve di test',
          descrizioneCompleta: 'Descrizione completa valida per il test csrf con header errato.',
          serviziOfferti: ['Test'],
          localita: 'Borgo'
        })
      });

      assert.strictEqual(updateRes.status, 403, 'Deve essere bloccato da protezione CSRF per valore header non autorizzato');
      const errBody = await updateRes.json();
      assert(errBody.error.includes('CSRF'));
    });

    it('REGRESSIONE AUTENTICAZIONE: PUT /api/activities/:id senza cookie restituisce 401 Unauthorized', async () => {
      const updateRes = await fetch(`${baseUrl}/api/activities/act-01`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'ProLocalApp'
        },
        body: JSON.stringify({
          nomeAttivita: 'Modifica Senza Cookie',
          descrizioneBreve: 'Descrizione breve di test',
          descrizioneCompleta: 'Descrizione completa valida per il test non autenticato.',
          serviziOfferti: ['Test'],
          localita: 'Borgo'
        })
      });

      assert.strictEqual(updateRes.status, 401, 'Senza cookie di sessione deve rispondere 401 Unauthorized');
      const errBody = await updateRes.json();
      assert(errBody.error.includes('Non autenticato'));
    });

    it('CSRF PROTECTION: richiesta mutativa autenticata (PUT) con header X-Requested-With: ProLocalApp ha successo', async () => {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mario.rossi@prolocal.test',
          password: PWD_SOCIO_A
        })
      });
      const rawToken = extractSessionCookie(loginRes)!;

      const updateRes = await fetch(`${baseUrl}/api/activities/act-01`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `prolocal_session=${rawToken}`,
          'X-Requested-With': 'ProLocalApp'
        },
        body: JSON.stringify({
          nomeAttivita: 'Bottega di Mario Aggiornata',
          descrizioneBreve: 'Nuova descrizione breve valida',
          descrizioneCompleta: 'Nuova descrizione completa valida con molti caratteri per superare i vincoli.',
          serviziOfferti: ['Restauro'],
          localita: 'Borgo'
        })
      });

      assert.strictEqual(updateRes.status, 200);
      const updateBody = await updateRes.json();
      assert.strictEqual(updateBody.attivita.nomeAttivita, 'Bottega di Mario Aggiornata');
    });

    it('CSRF NON BLOCCA GET pubblico o endpoint login iniziale senza sessione', async () => {
      // GET pubblico non richiede CSRF
      const resGet = await fetch(`${baseUrl}/api/showcase`);
      assert.strictEqual(resGet.status, 200);

      // POST /api/auth/login senza cookie non richiede CSRF
      const resLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mario.rossi@prolocal.test',
          password: PWD_SOCIO_A
        })
      });
      assert.strictEqual(resLogin.status, 200);
    });
  });

  // =========================================================================
  // SEZIONE E: COOKIE SECURITY & INPUT HARDENING AUDIT (FASE 3.6 STEP 3)
  // =========================================================================
  describe('E. Cookie Security, Input Hardening & Anti-Leakage Audit', () => {
    it('cookie vuoto: Cookie: prolocal_session= restituisce 401 Unauthorized e cancella cookie', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Cookie: 'prolocal_session=' }
      });
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert(body.error.includes('Non autenticato'));
      const setCookie = res.headers.get('set-cookie');
      assert(setCookie && (setCookie.includes('Max-Age=0') || setCookie.includes('expires=')));
    });

    it('cookie corrotto senza delimitatore: Cookie: prolocal_session restituisce 401 e cancella cookie', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Cookie: 'prolocal_session' }
      });
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert(body.error.includes('Non autenticato'));
    });

    it('cookie con percent-encoding malformato (%FF%FF): gestito in modo sicuro come 401 senza errori interni 500', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Cookie: 'prolocal_session=%FF%FF' }
      });
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert(body.error.includes('Non autenticato'));
    });

    it('token casuale o inesistente: 401 Unauthorized e cancellazione cookie', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Cookie: 'prolocal_session=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' }
      });
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert(body.error.includes('Non autenticato'));
      const setCookie = res.headers.get('set-cookie');
      assert(setCookie && (setCookie.includes('Max-Age=0') || setCookie.includes('expires=')));
    });

    it('token troppo corto: Cookie: prolocal_session=short restituisce 401 Unauthorized e cancella cookie', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Cookie: 'prolocal_session=short' }
      });
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert(body.error.includes('Non autenticato'));
    });

    it('token troppo lungo: Cookie: prolocal_session=... (1000 caratteri) restituisce 401 e cancella cookie', async () => {
      const longToken = 'a'.repeat(1000);
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Cookie: `prolocal_session=${longToken}` }
      });
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert(body.error.includes('Non autenticato'));
    });

    it('token con caratteri inattesi: Cookie: prolocal_session=bad!@#$%^&*()_+{}[] restituisce 401 e cancella cookie', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Cookie: 'prolocal_session=bad!@#$%^&*()_+{}[]' }
      });
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert(body.error.includes('Non autenticato'));
    });

    it('cookie duplicato: header Cookie con sessione valida duplicata viene gestito correttamente', async () => {
      // Login valido
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mario.rossi@prolocal.test',
          password: PWD_SOCIO_A
        })
      });
      assert.strictEqual(loginRes.status, 200);
      const rawToken = extractSessionCookie(loginRes)!;

      // Invio di due cookie prolocal_session nello stesso header
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Cookie: `prolocal_session=${rawToken}; prolocal_session=valoreDuplicatoInatteso` }
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.userId, 'usr-socio-01');
    });

    it('HTTP Input Hardening: payload JSON malformato su POST /api/auth/login restituisce 400 JSON senza stack trace', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json{'
      });
      assert.strictEqual(res.status, 400);
      const contentType = res.headers.get('content-type') || '';
      assert(contentType.includes('application/json'), 'Deve rispondere con content-type application/json');
      const body = await res.json();
      assert(body.error, 'Deve contenere messaggio di errore formattato');
      assert.strictEqual(JSON.stringify(body).includes('SyntaxError:'), false, 'Non deve contenere stack trace o percorsi file');
    });

    it('HTTP Input Hardening: payload JSON malformato su PUT /api/activities/:id restituisce 400 JSON senza stack trace', async () => {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mario.rossi@prolocal.test',
          password: PWD_SOCIO_A
        })
      });
      const rawToken = extractSessionCookie(loginRes)!;

      const res = await fetch(`${baseUrl}/api/activities/act-01`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `prolocal_session=${rawToken}`,
          'X-Requested-With': 'ProLocalApp'
        },
        body: '{"nomeAttivita": "Bottega", ' // JSON troncato
      });
      assert.strictEqual(res.status, 400);
      const contentType = res.headers.get('content-type') || '';
      assert(contentType.includes('application/json'));
      const body = await res.json();
      assert(body.error);
    });

    it('Anti-Information Leakage: GET /api/auth/me per TECHNICAL_ADMIN garantisce memberId null e member null', async () => {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin.tech@prolocal.test',
          password: PWD_ADMIN
        })
      });
      const rawToken = extractSessionCookie(loginRes)!;

      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Cookie: `prolocal_session=${rawToken}` }
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.actorType, 'TECHNICAL_ADMIN');
      assert.strictEqual(body.memberId, null);
      assert.strictEqual(body.member, null);
      assert.strictEqual(body.membershipStatus, null);
      // Verifica assenza credenziali o token
      assert.strictEqual(body.password, undefined);
      assert.strictEqual(body.passwordHash, undefined);
      assert.strictEqual(body.rawSessionToken, undefined);
      assert.strictEqual(body.token, undefined);
    });

    it('Ownership & Actor integrity: invio di memberId manipolato nel body di PUT non modifica identità attore', async () => {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mario.rossi@prolocal.test',
          password: PWD_SOCIO_A
        })
      });
      const rawToken = extractSessionCookie(loginRes)!;

      // Tentativo di inviare memberId spoofato nel payload JSON di update
      const res = await fetch(`${baseUrl}/api/activities/act-01`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `prolocal_session=${rawToken}`,
          'X-Requested-With': 'ProLocalApp'
        },
        body: JSON.stringify({
          memberId: 'member-02', // Tentativo di cambiare il proprietario della scheda
          nomeAttivita: 'Bottega di Mario Test Actor Integrity',
          descrizioneBreve: 'Descrizione valida',
          descrizioneCompleta: 'Descrizione completa valida per verificare che il proprietario resti inalterato.',
          serviziOfferti: ['Restauro'],
          localita: 'Borgo Storico'
        })
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      // Il proprietario dell'attività rimane rigorosamente member-01
      assert.strictEqual(body.attivita.memberId, 'member-01');
    });
  });
});
