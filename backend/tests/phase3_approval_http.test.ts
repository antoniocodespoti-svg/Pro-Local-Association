import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { newDb } from 'pg-mem';
import { createProLocalApp } from '../src/app.ts';
import { DatabaseMigrator } from '../src/db/migrator.ts';
import { InMemoryMemberRepository } from '../src/repositories/MemberRepository.ts';
import { InMemoryBusinessActivityRepository } from '../src/repositories/BusinessActivityRepository.ts';
import { InMemoryActivityRevisionRepository } from '../src/repositories/ActivityRevisionRepository.ts';
import { InMemoryAuditLogRepository } from '../src/repositories/AuditLogRepository.ts';
import { InMemoryUserAccountRepository } from '../src/repositories/UserAccountRepository.ts';
import { InMemorySessionRepository } from '../src/repositories/SessionRepository.ts';
import { PostgresMemberRepository } from '../src/repositories/PostgresMemberRepository.ts';
import { PostgresBusinessActivityRepository } from '../src/repositories/PostgresBusinessActivityRepository.ts';
import { PostgresActivityRevisionRepository } from '../src/repositories/PostgresActivityRevisionRepository.ts';
import { PostgresAuditLogRepository } from '../src/repositories/PostgresAuditLogRepository.ts';
import { PostgresUserAccountRepository } from '../src/repositories/PostgresUserAccountRepository.ts';
import { PostgresSessionRepository } from '../src/repositories/PostgresSessionRepository.ts';
import { ScryptPasswordHasher } from '../src/auth/PasswordHasher.ts';
import { AuthService } from '../src/services/AuthService.ts';
import { ActorType } from '../src/domain/auth.ts';
import {
  MembershipStatus,
  PublicationStatus,
  RevisionStatus,
  ProLocalRole,
  ActivityCategory,
  SystemAction
} from '../src/domain/models.ts';
import type { Member, BusinessActivity, AuditLogEntry } from '../src/domain/models.ts';

describe('Fase 3 — Cablaggio REST del Workflow di Approvazione del Presidente', () => {
  let server: Server;
  let baseUrl: string;
  let memberRepo: InMemoryMemberRepository;
  let activityRepo: InMemoryBusinessActivityRepository;
  let revisionRepo: InMemoryActivityRevisionRepository;
  let auditRepo: InMemoryAuditLogRepository;
  let userAccountRepo: InMemoryUserAccountRepository;
  let sessionRepo: InMemorySessionRepository;
  let passwordHasher: ScryptPasswordHasher;
  let authService: AuthService;

  const PWD_SOCIO_A = 'PasswordSocioA123!';
  const PWD_SOCIO_B = 'PasswordSocioB123!';
  const PWD_PRESIDENTE = 'PasswordPresidente123!';
  const PWD_ADMIN = 'PasswordAdminTech456!';

  let cookieSocioA = '';
  let cookieSocioB = '';
  let cookiePresidente = '';
  let cookieAdmin = '';

  const initialMembers: Member[] = [
    {
      id: 'socio-a',
      codiceSocio: 'SOC-2026-001',
      nomeCognome: 'Mario Rossi',
      emailDemo: 'mario.rossi@prolocal.test',
      dataIscrizione: '2024-01-10',
      statoAssociativo: MembershipStatus.ATTIVO,
      quotaSocialeInRegola: true,
      ruoloDirettivo: null
    },
    {
      id: 'socio-b',
      codiceSocio: 'SOC-2026-002',
      nomeCognome: 'Giulia Verdi',
      emailDemo: 'giulia.verdi@prolocal.test',
      dataIscrizione: '2024-01-15',
      statoAssociativo: MembershipStatus.ATTIVO,
      quotaSocialeInRegola: true,
      ruoloDirettivo: null
    },
    {
      id: 'socio-presidente',
      codiceSocio: 'SOC-2026-PRES',
      nomeCognome: 'Elena Bianchi (Presidente)',
      emailDemo: 'presidente@prolocal.test',
      dataIscrizione: '2024-01-01',
      statoAssociativo: MembershipStatus.ATTIVO,
      quotaSocialeInRegola: true,
      ruoloDirettivo: 'PRESIDENTE'
    }
  ];

  const initialActivities: BusinessActivity[] = [
    {
      id: 'act-socio-a',
      memberId: 'socio-a',
      nomeAttivita: 'Bottega Storica di Mario',
      categoria: ActivityCategory.ARTIGIANATO_RESTAURO,
      descrizioneBreve: 'Restauro ligneo tradizionale e conservativo nel centro storico',
      descrizioneCompleta:
        'Laboratorio artigianale specializzato nel recupero di mobili antichi, doratura e lucidatura a tampone.',
      serviziOfferti: ['Restauro mobili', 'Lucidatura a spirito'],
      localita: 'Borgo Antico',
      indirizzoPubblico: 'Via degli Artigiani 10',
      telefonoPubblico: '0984 111222',
      emailPubblica: 'info@bottegamario.test',
      statoPubblicazione: PublicationStatus.PUBBLICATA,
      dataUltimoAggiornamento: '2024-05-01'
    },
    {
      id: 'act-socio-b',
      memberId: 'socio-b',
      nomeAttivita: 'Fattoria Bio di Giulia',
      categoria: ActivityCategory.ENOGASTRONOMIA_LOCALE,
      descrizioneBreve: 'Olio extravergine biologico e conserve tradizionali del territorio',
      descrizioneCompleta:
        'Azienda agricola biologica a conduzione familiare specializzata nella produzione di olio EVO e confetture.',
      serviziOfferti: ['Vendita diretta', 'Degustazioni'],
      localita: 'Colline Verdi',
      indirizzoPubblico: 'Contrada Ulivi 5',
      telefonoPubblico: '0984 333444',
      emailPubblica: 'info@fattoriagiulia.test',
      statoPubblicazione: PublicationStatus.PUBBLICATA,
      dataUltimoAggiornamento: '2024-05-02'
    },
    {
      id: 'act-presidente',
      memberId: 'socio-presidente',
      nomeAttivita: 'Studio Consulenza Elena',
      categoria: ActivityCategory.CONSULENZA_PROFESSIONALE,
      descrizioneBreve: 'Consulenza amministrativa e progettuale per imprese del territorio',
      descrizioneCompleta:
        'Studio professionale dedicato alla consulenza gestionale e allo sviluppo sostenibile locale.',
      serviziOfferti: ['Consulenza gestionale', 'Bandi territoriali'],
      localita: 'Centro Storico',
      indirizzoPubblico: 'Piazza Municipio 2',
      telefonoPubblico: '0984 555666',
      emailPubblica: 'studio@elenabianchi.test',
      statoPubblicazione: PublicationStatus.PUBBLICATA,
      dataUltimoAggiornamento: '2024-05-03'
    }
  ];

  function extractSessionCookie(res: Response): string {
    const rawSetCookie = res.headers.get('set-cookie');
    assert(rawSetCookie, 'Cookie di sessione mancante nella risposta di login');
    const match = rawSetCookie.match(/prolocal_session=([^;]+)/);
    assert(match && match[1], 'Valore prolocal_session non trovato');
    return `prolocal_session=${match[1]}`;
  }

  async function loginAndGetCookie(url: string, email: string, password: string): Promise<string> {
    const res = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    assert.strictEqual(res.status, 200, `Login fallito per ${email}`);
    return extractSessionCookie(res);
  }

  before(async () => {
    passwordHasher = new ScryptPasswordHasher({ costN: 2048, blockSizeR: 8, parallelizationP: 1 });
    memberRepo = new InMemoryMemberRepository(initialMembers);
    activityRepo = new InMemoryBusinessActivityRepository(initialActivities);
    revisionRepo = new InMemoryActivityRevisionRepository();
    auditRepo = new InMemoryAuditLogRepository();
    userAccountRepo = new InMemoryUserAccountRepository();
    sessionRepo = new InMemorySessionRepository();

    await userAccountRepo.create({
      id: 'usr-socio-a',
      email: 'mario.rossi@prolocal.test',
      passwordHash: await passwordHasher.hash(PWD_SOCIO_A),
      actorType: ActorType.MEMBER,
      memberId: 'socio-a'
    });

    await userAccountRepo.create({
      id: 'usr-socio-b',
      email: 'giulia.verdi@prolocal.test',
      passwordHash: await passwordHasher.hash(PWD_SOCIO_B),
      actorType: ActorType.MEMBER,
      memberId: 'socio-b'
    });

    await userAccountRepo.create({
      id: 'usr-presidente',
      email: 'presidente@prolocal.test',
      passwordHash: await passwordHasher.hash(PWD_PRESIDENTE),
      actorType: ActorType.MEMBER,
      memberId: 'socio-presidente'
    });

    await userAccountRepo.create({
      id: 'usr-admin',
      email: 'admin.tech@prolocal.test',
      passwordHash: await passwordHasher.hash(PWD_ADMIN),
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
      revisionRepo,
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

    cookieSocioA = await loginAndGetCookie(baseUrl, 'mario.rossi@prolocal.test', PWD_SOCIO_A);
    cookieSocioB = await loginAndGetCookie(baseUrl, 'giulia.verdi@prolocal.test', PWD_SOCIO_B);
    cookiePresidente = await loginAndGetCookie(baseUrl, 'presidente@prolocal.test', PWD_PRESIDENTE);
    cookieAdmin = await loginAndGetCookie(baseUrl, 'admin.tech@prolocal.test', PWD_ADMIN);
  });

  after((_, done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  // =========================================================================
  // 1 - 5: GET /api/president/revisions/pending
  // =========================================================================
  describe('A. Coda Revisioni Pendenti (GET /api/president/revisions/pending)', () => {
    it('1. GET /api/president/revisions/pending senza sessione -> 401', async () => {
      const res = await fetch(`${baseUrl}/api/president/revisions/pending`);
      assert.strictEqual(res.status, 401);
    });

    it('2. GET /api/president/revisions/pending come Socio ordinario -> 403', async () => {
      const res = await fetch(`${baseUrl}/api/president/revisions/pending`, {
        headers: { Cookie: cookieSocioA }
      });
      assert.strictEqual(res.status, 403);
    });

    it('3. GET /api/president/revisions/pending come Amministratore Tecnico -> 403', async () => {
      const res = await fetch(`${baseUrl}/api/president/revisions/pending`, {
        headers: { Cookie: cookieAdmin }
      });
      assert.strictEqual(res.status, 403);
    });

    it('4. GET /api/president/revisions/pending come Presidente con stato associativo non attivo -> 401/403', async () => {
      await memberRepo.updateStatus('socio-presidente', MembershipStatus.SOSPESO);

      try {
        const res = await fetch(`${baseUrl}/api/president/revisions/pending`, {
          headers: { Cookie: cookiePresidente }
        });
        assert(
          res.status === 401 || res.status === 403,
          `Atteso 401 o 403 per Presidente sospeso, ricevuto ${res.status}`
        );
      } finally {
        await memberRepo.updateStatus('socio-presidente', MembershipStatus.ATTIVO);
      }
    });

    it('5. GET /api/president/revisions/pending come Presidente attivo -> 200, elenco revisioni pendenti e audit log CONSULTAZIONE_CODA_REVISIONI', async () => {
      // Socio A invia una modifica alla propria attività per generare una revisione pendente
      const putRes = await fetch(`${baseUrl}/api/activities/act-socio-a`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieSocioA,
          'X-Requested-With': 'ProLocalApp'
        },
        body: JSON.stringify({
          nomeAttivita: 'Bottega Storica di Mario — Nuova Proposta',
          descrizioneBreve: 'Restauro ligneo tradizionale, doratura e intarsio artistico',
          descrizioneCompleta:
            'Laboratorio artigianale specializzato nel recupero di mobili antichi, doratura e lucidatura a tampone.',
          localita: 'Borgo Antico',
          serviziOfferti: ['Restauro mobili', 'Lucidatura a spirito', 'Intarsio']
        })
      });
      assert.strictEqual(putRes.status, 200);

      const res = await fetch(`${baseUrl}/api/president/revisions/pending`, {
        headers: { Cookie: cookiePresidente }
      });
      assert.strictEqual(res.status, 200);

      const body = await res.json();
      assert.strictEqual(body.total, 1);
      assert(Array.isArray(body.revisions));
      assert.strictEqual(body.revisions.length, 1);
      assert.strictEqual(body.revisions[0].activityId, 'act-socio-a');
      assert.strictEqual(body.revisions[0].nomeAttivita, 'Bottega Storica di Mario — Nuova Proposta');
      assert.strictEqual(body.revisions[0].revisionStatus, RevisionStatus.IN_ATTESA_APPROVAZIONE);

      const logs = await auditRepo.findAll();
      const consultLog = logs.find(
        (l: AuditLogEntry) =>
          l.action === SystemAction.CONSULTAZIONE_CODA_REVISIONI &&
          l.actorId === 'socio-presidente'
      );
      assert(consultLog, 'Deve essere registrato audit log CONSULTAZIONE_CODA_REVISIONI');
    });
  });

  // =========================================================================
  // 6 - 8: GET /api/president/revisions/:id
  // =========================================================================
  describe('B. Dettaglio Revisione (GET /api/president/revisions/:id)', () => {
    it('6. GET /api/president/revisions/:id come Presidente -> 200, restituisce revision, currentActivity e canReview: true per revisione di altro socio', async () => {
      const pendingRevision = await revisionRepo.findPendingByActivityId('act-socio-a');
      assert(pendingRevision);

      const res = await fetch(`${baseUrl}/api/president/revisions/${pendingRevision.id}`, {
        headers: { Cookie: cookiePresidente }
      });
      assert.strictEqual(res.status, 200);

      const body = await res.json();
      assert.strictEqual(body.revision.id, pendingRevision.id);
      assert.strictEqual(body.revision.nomeAttivita, 'Bottega Storica di Mario — Nuova Proposta');
      assert.strictEqual(body.currentActivity.id, 'act-socio-a');
      assert.strictEqual(body.currentActivity.nomeAttivita, 'Bottega Storica di Mario');
      assert.strictEqual(body.canReview, true);
    });

    it('7. GET /api/president/revisions/:id su revisione propria del Presidente -> 200, canReview: false', async () => {
      // Il Presidente modifica la propria scheda attività come socio owner
      const putRes = await fetch(`${baseUrl}/api/activities/act-presidente`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookiePresidente,
          'X-Requested-With': 'ProLocalApp'
        },
        body: JSON.stringify({
          nomeAttivita: 'Studio Consulenza Elena — Nuova Revisione',
          descrizioneBreve: 'Consulenza amministrativa e progettuale per imprese del territorio',
          descrizioneCompleta:
            'Studio professionale dedicato alla consulenza gestionale e allo sviluppo sostenibile locale.',
          localita: 'Centro Storico',
          serviziOfferti: ['Consulenza gestionale', 'Bandi territoriali']
        })
      });
      assert.strictEqual(putRes.status, 200);

      const presRevision = await revisionRepo.findPendingByActivityId('act-presidente');
      assert(presRevision);

      const res = await fetch(`${baseUrl}/api/president/revisions/${presRevision.id}`, {
        headers: { Cookie: cookiePresidente }
      });
      assert.strictEqual(res.status, 200);

      const body = await res.json();
      assert.strictEqual(body.revision.id, presRevision.id);
      assert.strictEqual(body.currentActivity.id, 'act-presidente');
      assert.strictEqual(body.canReview, false, 'Il Presidente non può revisionare la propria scheda');
    });

    it('8. GET /api/president/revisions/:id inesistente -> 404', async () => {
      const res = await fetch(`${baseUrl}/api/president/revisions/rev-inesistente-999`, {
        headers: { Cookie: cookiePresidente }
      });
      assert.strictEqual(res.status, 404);
    });
  });

  // =========================================================================
  // 9 - 14: POST /api/president/revisions/:id/approve
  // =========================================================================
  describe('C. Approvazione Revisione (POST /api/president/revisions/:id/approve)', () => {
    it('9. POST /api/president/revisions/:id/approve senza header CSRF X-Requested-With: ProLocalApp -> 403', async () => {
      const pendingRevision = await revisionRepo.findPendingByActivityId('act-socio-a');
      assert(pendingRevision);

      const res = await fetch(`${baseUrl}/api/president/revisions/${pendingRevision.id}/approve`, {
        method: 'POST',
        headers: { Cookie: cookiePresidente }
      });
      assert.strictEqual(res.status, 403);
    });

    it('10. POST /api/president/revisions/:id/approve da parte di Socio ordinario -> 403', async () => {
      const pendingRevision = await revisionRepo.findPendingByActivityId('act-socio-a');
      assert(pendingRevision);

      const res = await fetch(`${baseUrl}/api/president/revisions/${pendingRevision.id}/approve`, {
        method: 'POST',
        headers: {
          Cookie: cookieSocioA,
          'X-Requested-With': 'ProLocalApp'
        }
      });
      assert.strictEqual(res.status, 403);
    });

    it('11. POST /api/president/revisions/:id/approve da parte di Amministratore Tecnico -> 403', async () => {
      const pendingRevision = await revisionRepo.findPendingByActivityId('act-socio-a');
      assert(pendingRevision);

      const res = await fetch(`${baseUrl}/api/president/revisions/${pendingRevision.id}/approve`, {
        method: 'POST',
        headers: {
          Cookie: cookieAdmin,
          'X-Requested-With': 'ProLocalApp'
        }
      });
      assert.strictEqual(res.status, 403);
    });

    it('12. POST /api/president/revisions/:id/approve da parte del Presidente sulla propria attività -> 403 (auto-approvazione vietata)', async () => {
      const presRevision = await revisionRepo.findPendingByActivityId('act-presidente');
      assert(presRevision);

      const res = await fetch(`${baseUrl}/api/president/revisions/${presRevision.id}/approve`, {
        method: 'POST',
        headers: {
          Cookie: cookiePresidente,
          'X-Requested-With': 'ProLocalApp'
        }
      });
      assert.strictEqual(res.status, 403);

      // Verifica che la scheda del Presidente non sia cambiata
      const presAct = await activityRepo.findById('act-presidente');
      assert.strictEqual(presAct?.nomeAttivita, 'Studio Consulenza Elena');
    });

    it('13. POST /api/president/revisions/:id/approve valido su revisione di Socio A -> 200, pubblica modifiche, aggiorna vetrina e audit log', async () => {
      const pendingRevision = await revisionRepo.findPendingByActivityId('act-socio-a');
      assert(pendingRevision);

      const res = await fetch(`${baseUrl}/api/president/revisions/${pendingRevision.id}/approve`, {
        method: 'POST',
        headers: {
          Cookie: cookiePresidente,
          'X-Requested-With': 'ProLocalApp'
        }
      });
      assert.strictEqual(res.status, 200);

      const body = await res.json();
      assert.strictEqual(
        body.messaggio,
        'Revisione approvata con successo. La scheda attività pubblicata è stata aggiornata.'
      );
      assert.strictEqual(body.revisione.id, pendingRevision.id);
      assert.strictEqual(body.revisione.revisionStatus, RevisionStatus.PUBBLICATA);
      assert.strictEqual(body.revisione.reviewedBy, 'socio-presidente');
      assert.strictEqual(body.attivita.id, 'act-socio-a');
      assert.strictEqual(body.attivita.nomeAttivita, 'Bottega Storica di Mario — Nuova Proposta');
      assert.strictEqual(body.attivita.statoPubblicazione, PublicationStatus.PUBBLICATA);

      // Verifica che GET /api/showcase mostri i nuovi dati approvati
      const showcaseRes = await fetch(`${baseUrl}/api/showcase`);
      assert.strictEqual(showcaseRes.status, 200);
      const showcaseItems = await showcaseRes.json();
      const updatedInShowcase = showcaseItems.find((item: any) => item.id === 'act-socio-a');
      assert(updatedInShowcase, 'Scheda act-socio-a deve essere visibile in vetrina');
      assert.strictEqual(
        updatedInShowcase.nomeAttivita,
        'Bottega Storica di Mario — Nuova Proposta'
      );

      // Verifica scrittura audit log APPROVAZIONE_REVISIONE_ATTIVITA
      const logs = await auditRepo.findAll();
      const approveLog = logs.find(
        (l: AuditLogEntry) =>
          l.action === SystemAction.APPROVAZIONE_REVISIONE_ATTIVITA &&
          l.actorId === 'socio-presidente' &&
          l.resourceId === 'act-socio-a'
      );
      assert(approveLog, 'Deve essere registrato audit log APPROVAZIONE_REVISIONE_ATTIVITA');
      assert.strictEqual(approveLog.metadata?.revisionId, pendingRevision.id);
    });

    it('14. POST /api/president/revisions/:id/approve ripetuto su revisione già approvata -> 409', async () => {
      const revs = await revisionRepo.findByActivityId('act-socio-a');
      const approvedRevision = revs.find((r) => r.revisionStatus === RevisionStatus.PUBBLICATA);
      assert(approvedRevision);

      const res = await fetch(
        `${baseUrl}/api/president/revisions/${approvedRevision.id}/approve`,
        {
          method: 'POST',
          headers: {
            Cookie: cookiePresidente,
            'X-Requested-With': 'ProLocalApp'
          }
        }
      );
      assert.strictEqual(res.status, 409);
    });
  });

  // =========================================================================
  // 15 - 17: POST /api/president/revisions/:id/reject
  // =========================================================================
  describe('D. Rifiuto Revisione (POST /api/president/revisions/:id/reject)', () => {
    let pendingSocioBRevId = '';

    before(async () => {
      // Socio B invia una modifica alla propria attività
      const putRes = await fetch(`${baseUrl}/api/activities/act-socio-b`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieSocioB,
          'X-Requested-With': 'ProLocalApp'
        },
        body: JSON.stringify({
          nomeAttivita: 'Fattoria Bio di Giulia — Modifica Da Rifiutare',
          descrizioneBreve: 'Descrizione modificata in attesa di verifica presidenziale',
          descrizioneCompleta:
            'Azienda agricola biologica a conduzione familiare specializzata nella produzione di olio EVO e confetture.',
          localita: 'Colline Verdi',
          serviziOfferti: ['Vendita diretta', 'Degustazioni']
        })
      });
      assert.strictEqual(putRes.status, 200);

      const pending = await revisionRepo.findPendingByActivityId('act-socio-b');
      assert(pending);
      pendingSocioBRevId = pending.id;
    });

    it('15. POST /api/president/revisions/:id/reject con motivazione assente o < 10 caratteri -> 400', async () => {
      // Motivazione assente
      const resEmpty = await fetch(
        `${baseUrl}/api/president/revisions/${pendingSocioBRevId}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookiePresidente,
            'X-Requested-With': 'ProLocalApp'
          },
          body: JSON.stringify({})
        }
      );
      assert.strictEqual(resEmpty.status, 400);

      // Motivazione < 10 caratteri
      const resTooShort = await fetch(
        `${baseUrl}/api/president/revisions/${pendingSocioBRevId}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookiePresidente,
            'X-Requested-With': 'ProLocalApp'
          },
          body: JSON.stringify({ reason: 'Corto' })
        }
      );
      assert.strictEqual(resTooShort.status, 400);
    });

    it('16. POST /api/president/revisions/:id/reject da parte del Presidente sulla propria attività -> 403 (auto-rifiuto vietato)', async () => {
      const presRevision = await revisionRepo.findPendingByActivityId('act-presidente');
      assert(presRevision);

      const res = await fetch(
        `${baseUrl}/api/president/revisions/${presRevision.id}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookiePresidente,
            'X-Requested-With': 'ProLocalApp'
          },
          body: JSON.stringify({
            reason: 'Motivazione formalmente valida ma su revisione propria'
          })
        }
      );
      assert.strictEqual(res.status, 403);
    });

    it('17. POST /api/president/revisions/:id/reject valido con motivazione >= 10 caratteri -> 200, stato RIFIUTATA, scheda live invariata e audit log', async () => {
      const reason = 'La denominazione proposta non rispetta le linee guida editoriali Pro-Local.';

      const res = await fetch(
        `${baseUrl}/api/president/revisions/${pendingSocioBRevId}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookiePresidente,
            'X-Requested-With': 'ProLocalApp'
          },
          body: JSON.stringify({ motivazione: reason })
        }
      );
      assert.strictEqual(res.status, 200);

      const body = await res.json();
      assert.strictEqual(
        body.messaggio,
        'Revisione rifiutata. La scheda attività pubblicata è rimasta invariata.'
      );
      assert.strictEqual(body.revisione.id, pendingSocioBRevId);
      assert.strictEqual(body.revisione.revisionStatus, RevisionStatus.RIFIUTATA);
      assert.strictEqual(body.revisione.reviewNotes, reason);
      assert.strictEqual(body.revisione.reviewedBy, 'socio-presidente');

      // Verifica che la scheda pubblicata nel repository principale sia rimasta invariata
      const liveAct = await activityRepo.findById('act-socio-b');
      assert.strictEqual(liveAct?.nomeAttivita, 'Fattoria Bio di Giulia');

      // Verifica che GET /api/showcase continui a mostrare la versione precedente
      const showcaseRes = await fetch(`${baseUrl}/api/showcase`);
      assert.strictEqual(showcaseRes.status, 200);
      const showcaseItems = await showcaseRes.json();
      const socioBInShowcase = showcaseItems.find((item: any) => item.id === 'act-socio-b');
      assert(socioBInShowcase);
      assert.strictEqual(socioBInShowcase.nomeAttivita, 'Fattoria Bio di Giulia');

      // Verifica scrittura audit log RIFIUTO_REVISIONE_ATTIVITA
      const logs = await auditRepo.findAll();
      const rejectLog = logs.find(
        (l: AuditLogEntry) =>
          l.action === SystemAction.RIFIUTO_REVISIONE_ATTIVITA &&
          l.actorId === 'socio-presidente' &&
          l.resourceId === 'act-socio-b'
      );
      assert(rejectLog, 'Deve essere registrato audit log RIFIUTO_REVISIONE_ATTIVITA');
      assert.strictEqual(rejectLog.metadata?.revisionId, pendingSocioBRevId);
      assert.strictEqual(rejectLog.metadata?.motivazione, reason);
    });
  });

  // =========================================================================
  // 18: GET /api/members/me (Area Socio — Ciclo revisione pendente, rifiuto e nuova proposta)
  // =========================================================================
  describe('E. Area Socio GET /api/members/me — Stato Revisioni e Storico', () => {
    it('18. GET /api/members/me espone revisionePendente, ultimaRevisione RIFIUTATA con reviewNotes, e consente nuova PUT preservando lo storico', async () => {
      // 18a. Subito dopo il rifiuto nel test 17, Socio B vede revisionePendente === null e ultimaRevisione RIFIUTATA con reviewNotes
      const meAfterRejectRes = await fetch(`${baseUrl}/api/members/me`, {
        headers: { Cookie: cookieSocioB }
      });
      assert.strictEqual(meAfterRejectRes.status, 200);
      const meAfterReject = await meAfterRejectRes.json();

      assert.strictEqual(meAfterReject.attivita.nomeAttivita, 'Fattoria Bio di Giulia');
      assert.strictEqual(meAfterReject.revisionePendente, null);
      assert(meAfterReject.ultimaRevisione, 'ultimaRevisione deve essere valorizzata');
      assert.strictEqual(meAfterReject.ultimaRevisione.revisionStatus, RevisionStatus.RIFIUTATA);
      assert.strictEqual(
        meAfterReject.ultimaRevisione.reviewNotes,
        'La denominazione proposta non rispetta le linee guida editoriali Pro-Local.'
      );
      assert(Array.isArray(meAfterReject.revisioniPerAttivita['act-socio-b']));
      assert.strictEqual(meAfterReject.revisioniPerAttivita['act-socio-b'].length, 1);

      // 18b. Socio B invia una nuova PUT /api/activities/:id dopo il rifiuto
      const putRetryRes = await fetch(`${baseUrl}/api/activities/act-socio-b`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieSocioB,
          'X-Requested-With': 'ProLocalApp'
        },
        body: JSON.stringify({
          nomeAttivita: 'Fattoria Biologica Giulia Verdi',
          descrizioneBreve: 'Olio extravergine biologico certificato e conserve artigianali',
          descrizioneCompleta:
            'Azienda agricola biologica a conduzione familiare specializzata nella produzione di olio EVO e confetture.',
          localita: 'Colline Verdi',
          serviziOfferti: ['Vendita diretta', 'Degustazioni']
        })
      });
      assert.strictEqual(putRetryRes.status, 200);

      // 18c. Ora GET /api/members/me mostra la nuova revisionePendente IN_ATTESA_APPROVAZIONE e lo storico di 2 revisioni
      const meAfterRetryRes = await fetch(`${baseUrl}/api/members/me`, {
        headers: { Cookie: cookieSocioB }
      });
      assert.strictEqual(meAfterRetryRes.status, 200);
      const meAfterRetry = await meAfterRetryRes.json();

      assert(meAfterRetry.revisionePendente, 'revisionePendente deve essere presente');
      assert.strictEqual(
        meAfterRetry.revisionePendente.revisionStatus,
        RevisionStatus.IN_ATTESA_APPROVAZIONE
      );
      assert.strictEqual(
        meAfterRetry.revisionePendente.nomeAttivita,
        'Fattoria Biologica Giulia Verdi'
      );
      assert.strictEqual(
        meAfterRetry.ultimaRevisione.id,
        meAfterRetry.revisionePendente.id
      );
      assert.strictEqual(
        meAfterRetry.revisioniPerAttivita['act-socio-b'].length,
        2,
        'Lo storico deve contenere sia la revisione rifiutata sia la nuova pendente'
      );
    });
  });

  // =========================================================================
  // 19: Test HTTP end-to-end con repository PostgreSQL (pg-mem + migrazioni)
  // =========================================================================
  describe('F. End-to-End HTTP su PostgreSQL (pg-mem + migrazioni reali)', () => {
    it('19. Ciclo completo su PostgreSQL: PUT /api/activities/:id -> GET /api/president/revisions/pending -> POST /api/president/revisions/:id/approve -> GET /api/showcase', async () => {
      const mem = newDb({ noAstCoverageCheck: true });
      const adapter = mem.adapters.createPg();
      const pool = new adapter.Pool();

      const migrator = new DatabaseMigrator(pool);
      await migrator.runMigrations();

      const pgMemberRepo = new PostgresMemberRepository(pool);
      const pgActivityRepo = new PostgresBusinessActivityRepository(pool);
      const pgRevisionRepo = new PostgresActivityRevisionRepository(pool);
      const pgAuditRepo = new PostgresAuditLogRepository(pool);
      const pgUserAccountRepo = new PostgresUserAccountRepository(pool);
      const pgSessionRepo = new PostgresSessionRepository(pool);
      const pgHasher = new ScryptPasswordHasher({
        costN: 2048,
        blockSizeR: 8,
        parallelizationP: 1
      });

      // Popolamento soci (Socio A + Presidente)
      await pgMemberRepo.create({
        id: 'pg-socio-a',
        codiceSocio: 'PG-SOC-001',
        nomeCognome: 'Luca Neri',
        emailDemo: 'luca.neri@pg-prolocal.test',
        dataIscrizione: '2024-01-10',
        statoAssociativo: MembershipStatus.ATTIVO,
        quotaSocialeInRegola: true,
        ruoloDirettivo: null
      });

      await pgMemberRepo.create({
        id: 'pg-presidente',
        codiceSocio: 'PG-SOC-PRES',
        nomeCognome: 'Marco Conti (Presidente)',
        emailDemo: 'presidente@pg-prolocal.test',
        dataIscrizione: '2024-01-01',
        statoAssociativo: MembershipStatus.ATTIVO,
        quotaSocialeInRegola: true,
        ruoloDirettivo: 'PRESIDENTE'
      });

      // Popolamento attività pubblicata di Socio A
      await pgActivityRepo.create({
        id: 'pg-act-01',
        memberId: 'pg-socio-a',
        nomeAttivita: 'Ceramiche Tradizionali Neri',
        categoria: ActivityCategory.ARTIGIANATO_RESTAURO,
        descrizioneBreve: 'Lavorazione tradizionale della ceramica artistica locale',
        descrizioneCompleta:
          'Laboratorio ceramico con forno a legna per la produzione di maioliche tradizionali.',
        serviziOfferti: ['Maioliche', 'Restauro ceramico'],
        localita: 'Borgo Antico',
        statoPubblicazione: PublicationStatus.PUBBLICATA,
        dataUltimoAggiornamento: '2024-06-01'
      });

      await pgUserAccountRepo.create({
        id: 'pg-usr-socio-a',
        email: 'luca.neri@pg-prolocal.test',
        passwordHash: await pgHasher.hash(PWD_SOCIO_A),
        actorType: ActorType.MEMBER,
        memberId: 'pg-socio-a'
      });

      await pgUserAccountRepo.create({
        id: 'pg-usr-presidente',
        email: 'presidente@pg-prolocal.test',
        passwordHash: await pgHasher.hash(PWD_PRESIDENTE),
        actorType: ActorType.MEMBER,
        memberId: 'pg-presidente'
      });

      const pgAuthService = new AuthService({
        userAccountRepo: pgUserAccountRepo,
        sessionRepo: pgSessionRepo,
        memberRepo: pgMemberRepo,
        passwordHasher: pgHasher,
        auditLogRepo: pgAuditRepo
      });

      const pgApp = createProLocalApp({
        memberRepo: pgMemberRepo,
        activityRepo: pgActivityRepo,
        revisionRepo: pgRevisionRepo,
        auditRepo: pgAuditRepo,
        userAccountRepo: pgUserAccountRepo,
        sessionRepo: pgSessionRepo,
        passwordHasher: pgHasher,
        authService: pgAuthService,
        dbClient: pool
      });

      let pgServer: Server | null = null;
      let pgBaseUrl = '';

      await new Promise<void>((resolve) => {
        pgServer = pgApp.listen(0, '127.0.0.1', () => {
          const addr = (pgServer as Server).address() as AddressInfo;
          pgBaseUrl = `http://127.0.0.1:${addr.port}`;
          resolve();
        });
      });

      try {
        const pgCookieSocioA = await loginAndGetCookie(
          pgBaseUrl,
          'luca.neri@pg-prolocal.test',
          PWD_SOCIO_A
        );
        const pgCookiePres = await loginAndGetCookie(
          pgBaseUrl,
          'presidente@pg-prolocal.test',
          PWD_PRESIDENTE
        );

        // 1. PUT /api/activities/:id da parte di Socio A
        const putRes = await fetch(`${pgBaseUrl}/api/activities/pg-act-01`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: pgCookieSocioA,
            'X-Requested-With': 'ProLocalApp'
          },
          body: JSON.stringify({
            nomeAttivita: 'Ceramiche Artistiche Neri — Nuova Collezione',
            descrizioneBreve: 'Ceramiche d’arte e maioliche dipinte a mano su commissione',
            descrizioneCompleta:
              'Laboratorio ceramico con forno a legna per la produzione di maioliche tradizionali e artistiche.',
            localita: 'Borgo Antico',
            serviziOfferti: ['Maioliche', 'Restauro ceramico']
          })
        });
        assert.strictEqual(putRes.status, 200);

        // Verifica che la vetrina pubblica serva ancora i dati originali prima dell'approvazione
        const showcaseBeforeRes = await fetch(`${pgBaseUrl}/api/showcase`);
        const showcaseBefore = await showcaseBeforeRes.json();
        assert.strictEqual(showcaseBefore[0].nomeAttivita, 'Ceramiche Tradizionali Neri');

        // 2. GET /api/president/revisions/pending da parte del Presidente
        const pendingRes = await fetch(`${pgBaseUrl}/api/president/revisions/pending`, {
          headers: { Cookie: pgCookiePres }
        });
        assert.strictEqual(pendingRes.status, 200);
        const pendingBody = await pendingRes.json();
        assert.strictEqual(pendingBody.total, 1);
        const revId = pendingBody.revisions[0].id;
        assert.strictEqual(
          pendingBody.revisions[0].nomeAttivita,
          'Ceramiche Artistiche Neri — Nuova Collezione'
        );

        // 3. POST /api/president/revisions/:id/approve da parte del Presidente (transazionale su PostgreSQL)
        const approveRes = await fetch(
          `${pgBaseUrl}/api/president/revisions/${revId}/approve`,
          {
            method: 'POST',
            headers: {
              Cookie: pgCookiePres,
              'X-Requested-With': 'ProLocalApp'
            }
          }
        );
        assert.strictEqual(approveRes.status, 200);
        const approveBody = await approveRes.json();
        assert.strictEqual(approveBody.revisione.revisionStatus, RevisionStatus.PUBBLICATA);
        assert.strictEqual(
          approveBody.attivita.nomeAttivita,
          'Ceramiche Artistiche Neri — Nuova Collezione'
        );

        // 4. GET /api/showcase mostra i nuovi dati pubblicati
        const showcaseAfterRes = await fetch(`${pgBaseUrl}/api/showcase`);
        assert.strictEqual(showcaseAfterRes.status, 200);
        const showcaseAfter = await showcaseAfterRes.json();
        assert.strictEqual(showcaseAfter.length, 1);
        assert.strictEqual(
          showcaseAfter[0].nomeAttivita,
          'Ceramiche Artistiche Neri — Nuova Collezione'
        );
        assert.strictEqual(
          showcaseAfter[0].descrizioneBreve,
          'Ceramiche d’arte e maioliche dipinte a mano su commissione'
        );
      } finally {
        if (pgServer) {
          await new Promise<void>((resolve) => (pgServer as Server).close(() => resolve()));
        }
        await pool.end();
      }
    });
  });
});
