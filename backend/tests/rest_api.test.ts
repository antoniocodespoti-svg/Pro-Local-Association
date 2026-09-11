import { describe, it } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
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

// Helper di richiesta HTTP reale contro server in ascolto su porta effimera
function makeRequest(
  server: http.Server,
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: any
): Promise<{ status: number; body: any }> {
  const address = server.address() as any;
  const port = address.port;

  return new Promise((resolve, reject) => {
    const serializedBody = body ? JSON.stringify(body) : undefined;
    const reqHeaders: Record<string, string> = {
      ...headers
    };
    if (serializedBody) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(serializedBody).toString();
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: reqHeaders
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsed: any = null;
          try {
            parsed = rawData ? JSON.parse(rawData) : null;
          } catch {
            parsed = rawData;
          }
          resolve({ status: res.statusCode || 500, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (serializedBody) {
      req.write(serializedBody);
    }
    req.end();
  });
}

describe('Pro-Local Phase 2.2 REST API & Security Tests', () => {
  const members: Member[] = [
    {
      id: 'socio-A',
      codiceSocio: 'SOC-001',
      nomeCognome: 'Mario Rossi',
      emailDemo: 'mario@demo.it',
      dataIscrizione: '2024-01-01',
      statoAssociativo: MembershipStatus.ATTIVO,
      quotaSocialeInRegola: true
    },
    {
      id: 'socio-B',
      codiceSocio: 'SOC-002',
      nomeCognome: 'Giulia Bianchi',
      emailDemo: 'giulia@demo.it',
      dataIscrizione: '2024-02-01',
      statoAssociativo: MembershipStatus.ATTIVO,
      quotaSocialeInRegola: true
    },
    {
      id: 'socio-Sospeso',
      codiceSocio: 'SOC-003',
      nomeCognome: 'Franco Sospeso',
      emailDemo: 'franco@demo.it',
      dataIscrizione: '2024-03-01',
      statoAssociativo: MembershipStatus.SOSPESO,
      quotaSocialeInRegola: false
    },
    {
      id: 'socio-Escluso',
      codiceSocio: 'SOC-004',
      nomeCognome: 'Lucia Esclusa',
      emailDemo: 'lucia@demo.it',
      dataIscrizione: '2024-04-01',
      statoAssociativo: MembershipStatus.ESCLUSO,
      quotaSocialeInRegola: false
    }
  ];

  const activities: BusinessActivity[] = [
    {
      id: 'act-A',
      memberId: 'socio-A',
      nomeAttivita: 'Bottega Artigiana A',
      categoria: ActivityCategory.ARTIGIANATO_RESTAURO,
      descrizioneBreve: 'Restauro mobili d\'arte antica',
      descrizioneCompleta: 'Restauro conservativo con prodotti naturali e tecniche tradizionali.',
      serviziOfferti: ['Restauro', 'Lucidatura'],
      localita: 'Borgo Antico',
      statoPubblicazione: PublicationStatus.PUBBLICATA,
      dataUltimoAggiornamento: '2024-05-10'
    },
    {
      id: 'act-B',
      memberId: 'socio-B',
      nomeAttivita: 'Studio Professionale B',
      categoria: ActivityCategory.CONSULENZA_PROFESSIONALE,
      descrizioneBreve: 'Consulenza fiscale e societaria per enti',
      descrizioneCompleta: 'Supporto a enti associativi e liberi professionisti.',
      serviziOfferti: ['Contabilità', 'Dichiarazioni'],
      localita: 'Centro Storico',
      statoPubblicazione: PublicationStatus.PUBBLICATA,
      dataUltimoAggiornamento: '2024-05-12'
    },
    {
      id: 'act-Sospeso',
      memberId: 'socio-Sospeso',
      nomeAttivita: 'Attività Socio Sospeso',
      categoria: ActivityCategory.SERVIZI_CASA,
      descrizioneBreve: 'Servizi di riparazione',
      descrizioneCompleta: 'Riparazioni domestiche varie e manutenzioni ordinarie.',
      serviziOfferti: ['Riparazioni'],
      localita: 'Periferia',
      statoPubblicazione: PublicationStatus.PUBBLICATA,
      dataUltimoAggiornamento: '2024-05-01'
    },
    {
      id: 'act-Escluso',
      memberId: 'socio-Escluso',
      nomeAttivita: 'Attività Socio Escluso',
      categoria: ActivityCategory.BENESSERE_PERSONA,
      descrizioneBreve: 'Trattamenti benessere',
      descrizioneCompleta: 'Trattamenti e massaggi olistici.',
      serviziOfferti: ['Massaggi'],
      localita: 'Borgo Basso',
      statoPubblicazione: PublicationStatus.PUBBLICATA,
      dataUltimoAggiornamento: '2024-05-02'
    },
    {
      id: 'act-Bozza',
      memberId: 'socio-A',
      nomeAttivita: 'Seconda Attività in Bozza',
      categoria: ActivityCategory.CULTURA_FORMAZIONE,
      descrizioneBreve: 'Corsi e laboratori',
      descrizioneCompleta: 'Attività didattiche per giovani e adulti.',
      serviziOfferti: ['Corsi'],
      localita: 'Borgo Antico',
      statoPubblicazione: PublicationStatus.BOZZA,
      dataUltimoAggiornamento: '2024-05-03'
    }
  ];

  function startTestServer(): Promise<{ server: http.Server; close: () => Promise<void> }> {
    const memberRepo = new InMemoryMemberRepository(members);
    const activityRepo = new InMemoryBusinessActivityRepository(activities);
    const app = createProLocalApp({ memberRepo, activityRepo });
    const server = http.createServer(app);

    return new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        resolve({
          server,
          close: () => new Promise<void>((r) => server.close(() => r()))
        });
      });
    });
  }

  // =========================================================================
  // 1. GET /api/showcase: Regola di Dominio Vetrina
  // =========================================================================
  it('GET /api/showcase restituisce solo attività con schede PUBBLICATE e soci ATTIVI', async () => {
    const { server, close } = await startTestServer();
    try {
      const res = await makeRequest(server, 'GET', '/api/showcase');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(Array.isArray(res.body), true);

      const ids = res.body.map((a: any) => a.id);
      assert.strictEqual(ids.includes('act-A'), true, 'act-A (pubblicata, socio attivo) deve apparire');
      assert.strictEqual(ids.includes('act-B'), true, 'act-B (pubblicata, socio attivo) deve apparire');

      assert.strictEqual(ids.includes('act-Sospeso'), false, 'Attività di socio SOSPESO non deve apparire');
      assert.strictEqual(ids.includes('act-Escluso'), false, 'Attività di socio ESCLUSO non deve apparire');
      assert.strictEqual(ids.includes('act-Bozza'), false, 'Attività in BOZZA non deve apparire');
    } finally {
      await close();
    }
  });

  // =========================================================================
  // 2. GET /api/activities/:id: Dettaglio Pubblico e Protezione Bypass
  // =========================================================================
  it('GET /api/activities/:id restituisce l\'attività pubblica esistente', async () => {
    const { server, close } = await startTestServer();
    try {
      const res = await makeRequest(server, 'GET', '/api/activities/act-A');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.id, 'act-A');
      assert.strictEqual(res.body.trasparenza.autonomiaAttivita, true);
    } finally {
      await close();
    }
  });

  it('GET /api/activities/:id restituisce 404 per attività non pubblica (no bypass)', async () => {
    const { server, close } = await startTestServer();
    try {
      // Attività di socio escluso
      const resEscluso = await makeRequest(server, 'GET', '/api/activities/act-Escluso');
      assert.strictEqual(resEscluso.status, 404, 'Non deve rivelare attività di socio escluso');

      // Attività in bozza
      const resBozza = await makeRequest(server, 'GET', '/api/activities/act-Bozza');
      assert.strictEqual(resBozza.status, 404, 'Non deve rivelare attività in bozza');

      // Attività inesistente
      const resInesistente = await makeRequest(server, 'GET', '/api/activities/act-non-esistente');
      assert.strictEqual(resInesistente.status, 404, 'Attività inesistente restituisce 404');
    } finally {
      await close();
    }
  });

  // =========================================================================
  // 3. GET /api/members/me: Area Socio Demo
  // =========================================================================
  it('GET /api/members/me restituisce il profilo socio demo e l\'attività collegata', async () => {
    const { server, close } = await startTestServer();
    try {
      const res = await makeRequest(server, 'GET', '/api/members/me', {
        'X-Demo-Member-Id': 'socio-A'
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.authMode, 'DEMO_FASE_2_2');
      assert.strictEqual(res.body.socio.id, 'socio-A');
      assert.strictEqual(res.body.attivita.id, 'act-A');
    } finally {
      await close();
    }
  });

  // =========================================================================
  // 4. PUT /api/activities/:id: Ownership, RBAC e Workflow di Stato
  // =========================================================================
  it('Socio A può modificare con successo la propria attività A', async () => {
    const { server, close } = await startTestServer();
    try {
      const validPayload = {
        nomeAttivita: 'Bottega Artigiana A (Rinnovata)',
        descrizioneBreve: 'Restauro artistico mobili antichi di pregio',
        descrizioneCompleta: 'Restauro conservativo tradizionale e lucidatura d\'epoca accurata.',
        serviziOfferti: ['Restauro mobili', 'Doratura', 'Lucidatura tampone'],
        localita: 'Borgo Antico Storico'
      };

      const res = await makeRequest(
        server,
        'PUT',
        '/api/activities/act-A',
        {
          'X-Demo-Member-Id': 'socio-A',
          'X-Demo-Role': ProLocalRole.SOCIO
        },
        validPayload
      );

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.attivita.nomeAttivita, 'Bottega Artigiana A (Rinnovata)');
      // Regola di workflow: torna in IN_ATTESA_APPROVAZIONE
      assert.strictEqual(res.body.attivita.statoPubblicazione, PublicationStatus.IN_ATTESA_APPROVAZIONE);
    } finally {
      await close();
    }
  });

  it('Socio A NON può modificare l\'attività B di Socio B (403 Forbidden)', async () => {
    const { server, close } = await startTestServer();
    try {
      const payload = {
        nomeAttivita: 'Tentativo Manomissione',
        descrizioneBreve: 'Descrizione non autorizzata dal socio A',
        descrizioneCompleta: 'Test di tentativo modifica scheda altrui non consentito.',
        serviziOfferti: ['Nessuno'],
        localita: 'Centro'
      };

      const res = await makeRequest(
        server,
        'PUT',
        '/api/activities/act-B',
        {
          'X-Demo-Member-Id': 'socio-A',
          'X-Demo-Role': ProLocalRole.SOCIO
        },
        payload
      );

      assert.strictEqual(res.status, 403, 'Deve restituire 403 Forbidden');
      assert.strictEqual(res.body.error.includes('Accesso negato'), true);
    } finally {
      await close();
    }
  });

  it('Amministratore Tecnico NON può modificare l\'attività dei soci (403 Forbidden)', async () => {
    const { server, close } = await startTestServer();
    try {
      const payload = {
        nomeAttivita: 'Modifica da Admin Tecnico',
        descrizioneBreve: 'Descrizione inserita da personale tecnico',
        descrizioneCompleta: 'Descrizione completa inserita illegittimamente da un operatore tecnico.',
        serviziOfferti: ['Manutenzione'],
        localita: 'Borgo'
      };

      const res = await makeRequest(
        server,
        'PUT',
        '/api/activities/act-A',
        {
          'X-Demo-Member-Id': 'admin-tecnico-01',
          'X-Demo-Role': ProLocalRole.AMMINISTRATORE_TECNICO
        },
        payload
      );

      assert.strictEqual(res.status, 403, 'L\'amministratore tecnico deve ricevere 403');
      assert.strictEqual(res.body.error.includes('Accesso negato'), true);
    } finally {
      await close();
    }
  });

  it('PUT /api/activities/:id rifiuta payload con campi non validi (400 Bad Request)', async () => {
    const { server, close } = await startTestServer();
    try {
      const invalidPayload = {
        nomeAttivita: '', // Nome vuoto non valido
        descrizioneBreve: 'corta', // Meno di 10 caratteri
        localita: ''
      };

      const res = await makeRequest(
        server,
        'PUT',
        '/api/activities/act-A',
        {
          'X-Demo-Member-Id': 'socio-A',
          'X-Demo-Role': ProLocalRole.SOCIO
        },
        invalidPayload
      );

      assert.strictEqual(res.status, 400, 'Deve restituire 400 Bad Request');
      assert.strictEqual(Array.isArray(res.body.dettagli), true);
      assert.strictEqual(res.body.dettagli.length >= 2, true);
    } finally {
      await close();
    }
  });

  it('PUT /api/activities/:id restituisce 404 se l\'attività non esiste', async () => {
    const { server, close } = await startTestServer();
    try {
      const validPayload = {
        nomeAttivita: 'Nome Valido Attività',
        descrizioneBreve: 'Descrizione valida sufficientemente lunga',
        descrizioneCompleta: 'Descrizione completa valida per superare tutti i controlli di validazione.',
        serviziOfferti: ['Servizio 1'],
        localita: 'Località Valida'
      };

      const res = await makeRequest(
        server,
        'PUT',
        '/api/activities/act-non-esistente',
        {
          'X-Demo-Member-Id': 'socio-A',
          'X-Demo-Role': ProLocalRole.SOCIO
        },
        validPayload
      );

      assert.strictEqual(res.status, 404, 'Deve restituire 404 per attività inesistente');
    } finally {
      await close();
    }
  });
});
