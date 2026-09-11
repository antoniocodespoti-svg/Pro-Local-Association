import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createProLocalApp } from '../src/app.ts';
import {
  MembershipStatus,
  PublicationStatus,
  ProLocalRole,
  ActivityCategory
} from '../src/domain/models.ts';
import type { Member, BusinessActivity } from '../src/domain/models.ts';
import { InMemoryMemberRepository } from '../src/repositories/MemberRepository.ts';
import { InMemoryBusinessActivityRepository } from '../src/repositories/BusinessActivityRepository.ts';
import { InMemoryAuditLogRepository } from '../src/repositories/AuditLogRepository.ts';

describe('Pro-Local REST API Integration & Security Tests', () => {
  let server: Server;
  let baseUrl: string;
  let auditRepo: InMemoryAuditLogRepository;

  // Dati di test controllati
  const testMembers: Member[] = [
    {
      id: 'socio-A',
      codiceSocio: 'SOC-TEST-001',
      nomeCognome: 'Socio Alpha',
      emailDemo: 'socio.a@test.demo',
      dataIscrizione: '2024-01-01',
      statoAssociativo: MembershipStatus.ATTIVO,
      quotaSocialeInRegola: true
    },
    {
      id: 'socio-B',
      codiceSocio: 'SOC-TEST-002',
      nomeCognome: 'Socio Beta',
      emailDemo: 'socio.b@test.demo',
      dataIscrizione: '2024-01-02',
      statoAssociativo: MembershipStatus.ATTIVO,
      quotaSocialeInRegola: true
    },
    {
      id: 'socio-Sospeso',
      codiceSocio: 'SOC-TEST-003',
      nomeCognome: 'Socio Gamma (Sospeso)',
      emailDemo: 'socio.sospeso@test.demo',
      dataIscrizione: '2024-01-03',
      statoAssociativo: MembershipStatus.SOSPESO,
      quotaSocialeInRegola: false
    },
    {
      id: 'socio-Escluso',
      codiceSocio: 'SOC-TEST-004',
      nomeCognome: 'Socio Delta (Escluso)',
      emailDemo: 'socio.escluso@test.demo',
      dataIscrizione: '2024-01-04',
      statoAssociativo: MembershipStatus.ESCLUSO,
      quotaSocialeInRegola: false
    },
    {
      id: 'socio-Receduto',
      codiceSocio: 'SOC-TEST-005',
      nomeCognome: 'Socio Epsilon (Receduto)',
      emailDemo: 'socio.receduto@test.demo',
      dataIscrizione: '2024-01-05',
      statoAssociativo: MembershipStatus.RECEDUTO,
      quotaSocialeInRegola: false
    }
  ];

  const testActivities: BusinessActivity[] = [
    {
      id: 'act-pubblica-A',
      memberId: 'socio-A',
      nomeAttivita: 'Attività Pubblica di A',
      categoria: ActivityCategory.ARTIGIANATO_RESTAURO,
      descrizioneBreve: 'Restauro artistico e ligneo',
      descrizioneCompleta: 'Laboratorio artigiano con esperienza decennale nel restauro conservativo.',
      serviziOfferti: ['Restauro d\'arte', 'Falegnameria'],
      localita: 'Borgo Storico',
      telefonoPubblico: '0984 000001',
      statoPubblicazione: PublicationStatus.PUBBLICATA,
      dataUltimoAggiornamento: '2024-05-10'
    },
    {
      id: 'act-pubblica-B',
      memberId: 'socio-B',
      nomeAttivita: 'Attività Pubblica di B',
      categoria: ActivityCategory.CONSULENZA_PROFESSIONALE,
      descrizioneBreve: 'Consulenza gestionale territoriale',
      descrizioneCompleta: 'Supporto a enti e liberi professionisti del territorio.',
      serviziOfferti: ['Consulenza', 'Pianificazione'],
      localita: 'Centro Servizi',
      telefonoPubblico: '0984 000002',
      statoPubblicazione: PublicationStatus.PUBBLICATA,
      dataUltimoAggiornamento: '2024-05-12'
    },
    {
      id: 'act-socio-sospeso',
      memberId: 'socio-Sospeso',
      nomeAttivita: 'Attività del Socio Sospeso',
      categoria: ActivityCategory.ENOGASTRONOMIA_LOCALE,
      descrizioneBreve: 'Degustazione prodotti locali',
      descrizioneCompleta: 'Azienda agricola a conduzione familiare.',
      serviziOfferti: ['Degustazione'],
      localita: 'Colline',
      statoPubblicazione: PublicationStatus.PUBBLICATA,
      dataUltimoAggiornamento: '2024-05-01'
    },
    {
      id: 'act-socio-escluso',
      memberId: 'socio-Escluso',
      nomeAttivita: 'Attività del Socio Escluso',
      categoria: ActivityCategory.BENESSERE_PERSONA,
      descrizioneBreve: 'Cura e benessere della persona',
      descrizioneCompleta: 'Trattamenti olistici e benessere.',
      serviziOfferti: ['Massaggi'],
      localita: 'Borgo',
      statoPubblicazione: PublicationStatus.PUBBLICATA,
      dataUltimoAggiornamento: '2024-05-02'
    },
    {
      id: 'act-socio-receduto',
      memberId: 'socio-Receduto',
      nomeAttivita: 'Attività del Socio Receduto',
      categoria: ActivityCategory.CULTURA_FORMAZIONE,
      descrizioneBreve: 'Corsi culturali e atelier',
      descrizioneCompleta: 'Associazione culturale e formazione.',
      serviziOfferti: ['Corsi'],
      localita: 'Centro',
      statoPubblicazione: PublicationStatus.PUBBLICATA,
      dataUltimoAggiornamento: '2024-05-03'
    },
    {
      id: 'act-bozza-A',
      memberId: 'socio-A',
      nomeAttivita: 'Seconda Attività in Bozza di A',
      categoria: ActivityCategory.INFORMATICA_DIGITALE,
      descrizioneBreve: 'Sviluppo software e siti web locali',
      descrizioneCompleta: 'Progettazione siti e servizi digitali per artigiani.',
      serviziOfferti: ['Siti web'],
      localita: 'Borgo Storico',
      statoPubblicazione: PublicationStatus.BOZZA,
      dataUltimoAggiornamento: '2024-05-15'
    },
    {
      id: 'act-in-attesa-A',
      memberId: 'socio-A',
      nomeAttivita: 'Attività in Attesa Approvazione di A',
      categoria: ActivityCategory.SERVIZI_CASA,
      descrizioneBreve: 'Manutenzione e piccoli restauri domestici',
      descrizioneCompleta: 'Interventi rapidi per la casa.',
      serviziOfferti: ['Manutenzione'],
      localita: 'Borgo Storico',
      statoPubblicazione: PublicationStatus.IN_ATTESA_APPROVAZIONE,
      dataUltimoAggiornamento: '2024-05-16'
    }
  ];

  before((_, done) => {
    const memberRepo = new InMemoryMemberRepository(testMembers);
    const activityRepo = new InMemoryBusinessActivityRepository(testActivities);
    auditRepo = new InMemoryAuditLogRepository();
    const app = createProLocalApp({ memberRepo, activityRepo, auditRepo });

    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      done();
    });
  });

  after((_, done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  // =========================================================================
  // 1. GET /api/showcase (Vetrina pubblica)
  // =========================================================================

  it('GET /api/showcase - restituisce solo attività di soci ATTIVI con stato PUBBLICATA', async () => {
    const res = await fetch(`${baseUrl}/api/showcase`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert(Array.isArray(body), 'La risposta deve essere un array');
    assert.strictEqual(body.length, 2, 'Devono essere presenti solo le 2 attività pubblicate di soci attivi');

    const ids = body.map((a: { id: string }) => a.id);
    assert(ids.includes('act-pubblica-A'), 'Deve includere act-pubblica-A');
    assert(ids.includes('act-pubblica-B'), 'Deve includere act-pubblica-B');

    // Verifica assenza di badge/bollini e presenza nota legale trasparenza
    for (const act of body) {
      assert.strictEqual(act.trasparenza.autonomiaAttivita, true);
      assert(act.trasparenza.notaLegale.includes('Pro-Local'), 'Deve contenere la nota di disaccoppiamento legale');
      assert.strictEqual((act as Record<string, unknown>).badge, undefined, 'Nessun badge ammesso');
      assert.strictEqual((act as Record<string, unknown>).certificato, undefined, 'Nessuna certificazione ammessa');
    }
  });

  it('GET /api/showcase - NON restituisce attività di soci sospesi, esclusi o receduti', async () => {
    const res = await fetch(`${baseUrl}/api/showcase`);
    const body = await res.json();
    const ids = body.map((a: { id: string }) => a.id);

    assert.strictEqual(ids.includes('act-socio-sospeso'), false, 'Non deve includere attività di socio sospeso');
    assert.strictEqual(ids.includes('act-socio-escluso'), false, 'Non deve includere attività di socio escluso');
    assert.strictEqual(ids.includes('act-socio-receduto'), false, 'Non deve includere attività di socio receduto');
  });

  it('GET /api/showcase - NON restituisce schede in bozza o in attesa di approvazione', async () => {
    const res = await fetch(`${baseUrl}/api/showcase`);
    const body = await res.json();
    const ids = body.map((a: { id: string }) => a.id);

    assert.strictEqual(ids.includes('act-bozza-A'), false, 'Non deve includere schede in bozza');
    assert.strictEqual(ids.includes('act-in-attesa-A'), false, 'Non deve includere schede in attesa');
  });

  // =========================================================================
  // 2. GET /api/activities/:id (Dettaglio pubblico attività)
  // =========================================================================

  it('GET /api/activities/:id - attività pubblica restituisce 200 con dati pubblici', async () => {
    const res = await fetch(`${baseUrl}/api/activities/act-pubblica-A`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.id, 'act-pubblica-A');
    assert.strictEqual(body.nomeAttivita, 'Attività Pubblica di A');
    assert.strictEqual(body.trasparenza.autonomiaAttivita, true);
    // Non espone dati privati del socio
    assert.strictEqual(body.codiceSocio, undefined);
    assert.strictEqual(body.quotaSocialeInRegola, undefined);
  });

  it('GET /api/activities/:id - attività non pubblica (socio escluso) restituisce 404 senza bypass', async () => {
    const res = await fetch(`${baseUrl}/api/activities/act-socio-escluso`);
    assert.strictEqual(res.status, 404, 'Deve restituire 404 per non rivelare risorsa non pubblica');
  });

  it('GET /api/activities/:id - attività non pubblica (socio sospeso) restituisce 404', async () => {
    const res = await fetch(`${baseUrl}/api/activities/act-socio-sospeso`);
    assert.strictEqual(res.status, 404);
  });

  it('GET /api/activities/:id - attività in bozza restituisce 404', async () => {
    const res = await fetch(`${baseUrl}/api/activities/act-bozza-A`);
    assert.strictEqual(res.status, 404);
  });

  it('GET /api/activities/:id - attività inesistente restituisce 404', async () => {
    const res = await fetch(`${baseUrl}/api/activities/act-inesistente-999`);
    assert.strictEqual(res.status, 404);
  });

  // =========================================================================
  // 3. GET /api/members/me (Area socio demo)
  // =========================================================================

  it('GET /api/members/me - restituisce i dati del socio demo e la sua attività collegata', async () => {
    const res = await fetch(`${baseUrl}/api/members/me`, {
      headers: {
        'X-Demo-Member-Id': 'socio-A'
      }
    });
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.authMode, 'DEMO_FASE_2_2');
    assert.strictEqual(body.socio.id, 'socio-A');
    assert.strictEqual(body.socio.nomeCognome, 'Socio Alpha');
    assert.strictEqual(body.socio.statoAssociativo, MembershipStatus.ATTIVO);
    assert(body.attivita, 'Deve contenere l\'attività del socio');
    assert.strictEqual(body.attivita.memberId, 'socio-A');
  });

  it('GET /api/members/me - restituisce 404 se il socio demo non esiste', async () => {
    const res = await fetch(`${baseUrl}/api/members/me`, {
      headers: {
        'X-Demo-Member-Id': 'socio-fantasma-non-esistente'
      }
    });
    assert.strictEqual(res.status, 404);
  });

  // =========================================================================
  // 4. PUT /api/activities/:id (Modifica attività, ownership e RBAC)
  // =========================================================================

  it('PUT /api/activities/:id - Socio A modifica con successo la propria attività (Ownership)', async () => {
    const payload = {
      nomeAttivita: 'Bottega Artigiana A (Modificata)',
      descrizioneBreve: 'Nuova descrizione breve valida per il restauro',
      descrizioneCompleta: 'Nuova descrizione completa valida con molti caratteri dettagliati per il test.',
      serviziOfferti: ['Restauro conservativo', 'Lucidatura oro'],
      localita: 'Borgo Storico Riaperto'
    };

    const res = await fetch(`${baseUrl}/api/activities/act-pubblica-A`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Demo-Member-Id': 'socio-A',
        'X-Demo-Role': ProLocalRole.SOCIO
      },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.attivita.nomeAttivita, 'Bottega Artigiana A (Modificata)');
    // Regola fondamentale di workflow: la modifica reimposta a IN_ATTESA_APPROVAZIONE
    assert.strictEqual(
      body.attivita.statoPubblicazione,
      PublicationStatus.IN_ATTESA_APPROVAZIONE,
      'Dopo la modifica la scheda deve passare a IN_ATTESA_APPROVAZIONE'
    );
  });

  it('PUT /api/activities/:id - Socio A tenta di modificare l\'attività di Socio B -> 403 FORBIDDEN', async () => {
    const payload = {
      nomeAttivita: 'Tentativo Illecito Socio A su B',
      descrizioneBreve: 'Descrizione breve valida di prova',
      descrizioneCompleta: 'Descrizione completa valida per testare il rifiuto di autorizzazione.',
      serviziOfferti: ['Test'],
      localita: 'Centro'
    };

    const res = await fetch(`${baseUrl}/api/activities/act-pubblica-B`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Demo-Member-Id': 'socio-A', // Autenticato come A
        'X-Demo-Role': ProLocalRole.SOCIO
      },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 403, 'Deve restituire 403 Forbidden');
    const body = await res.json();
    assert(body.error.includes('Accesso negato'), 'Deve spiegare il rifiuto per mancata ownership');
  });

  it('PUT /api/activities/:id - Amministratore Tecnico tenta di modificare l\'attività -> 403 FORBIDDEN', async () => {
    const payload = {
      nomeAttivita: 'Tentativo Modifica da Admin Tecnico',
      descrizioneBreve: 'Descrizione breve valida di prova',
      descrizioneCompleta: 'Descrizione completa valida per testare il blocco dell\'admin tecnico.',
      serviziOfferti: ['Test'],
      localita: 'Centro'
    };

    const res = await fetch(`${baseUrl}/api/activities/act-pubblica-B`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Demo-Member-Id': 'admin-tech-01',
        'X-Demo-Role': ProLocalRole.AMMINISTRATORE_TECNICO
      },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 403, 'L\'Amministratore Tecnico non può modificare schede dei soci');
  });

  it('PUT /api/activities/:id - Input non valido restituisce 400 Bad Request', async () => {
    const invalidPayload = {
      nomeAttivita: '', // Vuoto -> non valido
      descrizioneBreve: 'Corta', // Meno di 10 caratteri -> non valido
      descrizioneCompleta: '',
      serviziOfferti: [] // Vuoto -> non valido
    };

    const res = await fetch(`${baseUrl}/api/activities/act-pubblica-A`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Demo-Member-Id': 'socio-A',
        'X-Demo-Role': ProLocalRole.SOCIO
      },
      body: JSON.stringify(invalidPayload)
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert(body.error, 'Deve contenere messaggio di errore');
    assert(Array.isArray(body.dettagli), 'Deve contenere la lista degli errori di validazione');
  });

  it('PUT /api/activities/:id - Attività inesistente restituisce 404 Not Found', async () => {
    const payload = {
      nomeAttivita: 'Attività Non Esistente',
      descrizioneBreve: 'Descrizione breve valida di prova',
      descrizioneCompleta: 'Descrizione completa valida con numero congruo di caratteri.',
      serviziOfferti: ['Servizio valido'],
      localita: 'Centro'
    };

    const res = await fetch(`${baseUrl}/api/activities/act-99999-inesistente`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Demo-Member-Id': 'socio-A',
        'X-Demo-Role': ProLocalRole.SOCIO
      },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 404);
  });

  // =========================================================================
  // 6. Audit Trail Logging Tests
  // =========================================================================
  it('PUT /api/activities/:id - operazione autorizzata genera un record in audit_logs', async () => {
    const initialLogs = await auditRepo.findAll();
    const countBefore = initialLogs.length;

    const payload = {
      nomeAttivita: 'Attività Aggiornata con Audit',
      descrizioneBreve: 'Descrizione valida per test audit',
      descrizioneCompleta: 'Descrizione completa valida per verificare la corretta emissione dell audit log.',
      serviziOfferti: ['Servizio 1', 'Servizio 2'],
      localita: 'Borgo Storico'
    };

    const res = await fetch(`${baseUrl}/api/activities/act-pubblica-A`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Demo-Member-Id': 'socio-A',
        'X-Demo-Role': ProLocalRole.SOCIO
      },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 200);

    const allLogs = await auditRepo.findAll();
    assert.strictEqual(allLogs.length, countBefore + 1, 'Deve essere stato aggiunto un solo record di audit');

    const latest = allLogs[allLogs.length - 1];
    assert.strictEqual(latest.actorId, 'socio-A', 'actorId deve corrispondere al socio autenticato');
    assert.strictEqual(latest.resourceId, 'act-pubblica-A', 'resourceId deve corrispondere all attività modificata');
    assert.strictEqual(latest.resourceType, 'BUSINESS_ACTIVITY');
    assert.strictEqual(latest.action, 'MODIFICA_ATTIVITA');
    assert(latest.timestamp, 'timestamp deve essere valorizzato');
    assert(latest.metadata, 'metadata deve essere presente');
    assert.deepStrictEqual((latest.metadata as any).newPublicationStatus, PublicationStatus.IN_ATTESA_APPROVAZIONE);
  });

  it('PUT /api/activities/:id - richiesta non autorizzata o respinta NON genera record in audit_logs', async () => {
    const logsBefore = await auditRepo.findAll();
    const countBefore = logsBefore.length;

    // Tentativo dell'Amministratore Tecnico (bloccato da RBAC / Governance)
    const resTech = await fetch(`${baseUrl}/api/activities/act-pubblica-A`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Demo-Member-Id': 'admin-tecnico-01',
        'X-Demo-Role': ProLocalRole.AMMINISTRATORE_TECNICO
      },
      body: JSON.stringify({
        nomeAttivita: 'Tentativo Forzato Admin Tecnico',
        descrizioneBreve: 'Non deve andare a buon fine',
        descrizioneCompleta: 'Descrizione completa valida per test.',
        serviziOfferti: ['Test'],
        localita: 'Borgo'
      })
    });
    assert.strictEqual(resTech.status, 403);

    // Tentativo di violazione ownership (Socio B su attività di Socio A)
    const resOwnership = await fetch(`${baseUrl}/api/activities/act-pubblica-A`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Demo-Member-Id': 'socio-B',
        'X-Demo-Role': ProLocalRole.SOCIO
      },
      body: JSON.stringify({
        nomeAttivita: 'Tentativo Dirottamento Scheda',
        descrizioneBreve: 'Non deve andare a buon fine',
        descrizioneCompleta: 'Descrizione completa valida per test.',
        serviziOfferti: ['Test'],
        localita: 'Borgo'
      })
    });
    assert.strictEqual(resOwnership.status, 403);

    const logsAfter = await auditRepo.findAll();
    assert.strictEqual(logsAfter.length, countBefore, 'Nessun audit di modifica effettuata deve essere generato per tentativi respinti');
  });
});
