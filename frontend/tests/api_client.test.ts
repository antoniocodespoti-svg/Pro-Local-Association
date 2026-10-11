import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createProLocalApp } from '../../backend/src/app.ts';
import { ProLocalApiClient } from '../src/services/apiClient.ts';
import {
  MembershipStatus,
  PublicationStatus,
  ActivityCategory
} from '../../backend/src/domain/models.ts';
import type { Member, BusinessActivity } from '../../backend/src/domain/models.ts';
import { InMemoryMemberRepository } from '../../backend/src/repositories/MemberRepository.ts';
import { InMemoryBusinessActivityRepository } from '../../backend/src/repositories/BusinessActivityRepository.ts';
import { InMemoryAuditLogRepository } from '../../backend/src/repositories/AuditLogRepository.ts';
import { InMemoryUserAccountRepository } from '../../backend/src/repositories/UserAccountRepository.ts';
import { InMemorySessionRepository } from '../../backend/src/repositories/SessionRepository.ts';
import { ScryptPasswordHasher } from '../../backend/src/auth/PasswordHasher.ts';
import { AuthService } from '../../backend/src/services/AuthService.ts';
import { ActorType } from '../../backend/src/domain/auth.ts';

describe('Pro-Local Frontend API Client Integration Tests', () => {
  let server: Server;
  let client: ProLocalApiClient;
  const originalFetch = globalThis.fetch;
  let sessionCookie: string | null = null;
  const recordedHeaders: Record<string, string>[] = [];

  const testMembers: Member[] = [
    {
      id: 'socio-01',
      codiceSocio: 'SOC-2024-001',
      nomeCognome: 'Mario Rossi',
      emailDemo: 'mario.rossi@demo.it',
      dataIscrizione: '2024-01-15',
      statoAssociativo: MembershipStatus.ATTIVO,
      quotaSocialeInRegola: true
    },
    {
      id: 'socio-02',
      codiceSocio: 'SOC-2024-002',
      nomeCognome: 'Elena Bianchi',
      emailDemo: 'elena.bianchi@demo.it',
      dataIscrizione: '2024-02-10',
      statoAssociativo: MembershipStatus.ATTIVO,
      quotaSocialeInRegola: true
    }
  ];

  const testActivities: BusinessActivity[] = [
    {
      id: 'act-01',
      memberId: 'socio-01',
      nomeAttivita: 'Bottega Restauro Tradizionale',
      categoria: ActivityCategory.ARTIGIANATO_RESTAURO,
      descrizioneBreve: 'Restauro ligneo conservativo di arredi d\'epoca',
      descrizioneCompleta: 'Laboratorio artigiano con oltre venti anni di esperienza nel restauro di arredi antichi e cornici.',
      serviziOfferti: ['Restauro ligneo', 'Lucidatura', 'Trattamento tarlo'],
      localita: 'Cosenza Vecchia',
      telefonoPubblico: '0984 123456',
      statoPubblicazione: PublicationStatus.PUBBLICATA,
      dataUltimoAggiornamento: '2024-05-15'
    }
  ];

  before(async () => {
    const memberRepo = new InMemoryMemberRepository(testMembers);
    const activityRepo = new InMemoryBusinessActivityRepository(testActivities);
    const auditRepo = new InMemoryAuditLogRepository();
    const userAccountRepo = new InMemoryUserAccountRepository();
    const sessionRepo = new InMemorySessionRepository();
    const passwordHasher = new ScryptPasswordHasher({ costN: 2048, blockSizeR: 8, parallelizationP: 1 });

    const passwordHash = await passwordHasher.hash('Password123!');
    await userAccountRepo.create({
      id: 'usr-01',
      email: 'mario.rossi@demo.it',
      passwordHash,
      actorType: ActorType.MEMBER,
      memberId: 'socio-01'
    });

    const authService = new AuthService({
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
        const baseUrl = `http://127.0.0.1:${addr.port}`;
        // Inietta l'URL dell'API per il client di test
        (globalThis as any).__PROLOCAL_API_URL__ = baseUrl;
        if (typeof window === 'undefined') {
          (globalThis as any).window = { __PROLOCAL_API_URL__: baseUrl };
        }
        client = new ProLocalApiClient(baseUrl);
        resolve();
      });
    });

    // Wrapper cookie-jar per Node.js fetch che mantiene sessione reale HttpOnly e traccia header
    globalThis.fetch = async (input, init) => {
      const headers = new Headers(init?.headers || {});
      if (init?.credentials === 'include' && sessionCookie) {
        headers.set('Cookie', sessionCookie);
      }
      const recorded: Record<string, string> = {};
      headers.forEach((val, key) => {
        recorded[key.toLowerCase()] = val;
      });
      recordedHeaders.push(recorded);

      const response = await originalFetch(input, { ...init, headers });
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        const match = setCookie.match(/prolocal_session=([^;]+)/);
        if (match) {
          sessionCookie = `prolocal_session=${match[1]}`;
        }
      }
      return response;
    };
  });

  after((_, done) => {
    globalThis.fetch = originalFetch;
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  it('client.getPublicShowcase - recupera le schede pubbliche dal backend', async () => {
    const showcase = await client.getPublicShowcase();
    assert(Array.isArray(showcase), 'Showcase deve essere un array');
    assert.strictEqual(showcase.length, 1);
    assert.strictEqual(showcase[0].nomeAttivita, 'Bottega Restauro Tradizionale');
    assert.strictEqual(showcase[0].trasparenza.autonomiaAttivita, true);
  });

  it('client.getPublicActivity - recupera il dettaglio pubblico di una specifica attività', async () => {
    const activity = await client.getPublicActivity('act-01');
    assert.strictEqual(activity.id, 'act-01');
    assert.strictEqual(activity.localita, 'Cosenza Vecchia');
    assert(activity.serviziOfferti.includes('Restauro ligneo'));
  });

  it('client.getPublicActivity - solleva eccezione descrittiva se attività inesistente', async () => {
    await assert.rejects(
      async () => {
        await client.getPublicActivity('act-inesistente-404');
      },
      /Attività non trovata o non disponibile/
    );
  });

  it('client.getMemberAreaMe - recupera la dashboard del socio autenticato con sessione reale (senza X-Demo-*)', async () => {
    // Autenticazione HTTP reale (POST /api/auth/login)
    const loginResult = await client.login('mario.rossi@demo.it', 'Password123!');
    assert.strictEqual(loginResult.authenticated, true);

    const me = await client.getMemberAreaMe();
    assert.strictEqual(me.authMode, 'REAL_SESSION', 'authMode deve essere REAL_SESSION');
    assert.strictEqual(me.socio.nomeCognome, 'Mario Rossi');
    assert.strictEqual(me.socio.statoAssociativo, 'ATTIVO');
    assert(me.attivita, 'Deve contenere l\'attività del socio');
    assert.strictEqual(me.attivita.nomeAttivita, 'Bottega Restauro Tradizionale');
  });

  it('client.updateActivity - invia modifiche con credentials: "include" e CSRF (X-Requested-With)', async () => {
    const result = await client.updateActivity('act-01', {
      nomeAttivita: 'Bottega Restauro e Doratura Tradizionale',
      descrizioneBreve: 'Restauro ligneo e doratura a foglia d\'oro zecchino',
      descrizioneCompleta: 'Laboratorio artigiano specializzato in restauro di mobili pregiati, doratura e intaglio.',
      serviziOfferti: ['Restauro ligneo', 'Doratura foglia d\'oro'],
      localita: 'Cosenza Vecchia'
    });

    assert(result.messaggio.includes('successo'));
    assert.strictEqual(
      result.attivita.nomeAttivita,
      'Bottega Restauro Tradizionale'
    );
    assert.strictEqual(
      result.attivita.statoPubblicazione,
      'PUBBLICATA'
    );

    // Verifica che l'ultima chiamata abbia inviato X-Requested-With e nessun X-Demo-*
    const lastHeaders = recordedHeaders[recordedHeaders.length - 1];
    assert.strictEqual(lastHeaders['x-requested-with'], 'ProLocalApp');
    assert.strictEqual(lastHeaders['x-demo-member-id'], undefined);
    assert.strictEqual(lastHeaders['x-demo-role'], undefined);
  });

  it('client.updateActivity - rifiuta aggiornamento con errore descrittivo se dati invalidi', async () => {
    await assert.rejects(
      async () => {
        await client.updateActivity('act-01', {
          nomeAttivita: '',
          descrizioneBreve: 'corta',
          descrizioneCompleta: 'invalida',
          serviziOfferti: [],
          localita: ''
        });
      },
      /Il nome dell'attività|La descrizione/
    );
  });
});
