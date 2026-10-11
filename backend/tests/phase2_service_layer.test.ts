import { describe, it } from 'node:test';
import assert from 'node:assert';
import { newDb } from 'pg-mem';
import { DatabaseMigrator } from '../src/db/migrator.ts';
import { PostgresActivityRevisionRepository } from '../src/repositories/PostgresActivityRevisionRepository.ts';
import { PostgresBusinessActivityRepository } from '../src/repositories/PostgresBusinessActivityRepository.ts';
import { PostgresAuditLogRepository } from '../src/repositories/PostgresAuditLogRepository.ts';
import { InMemoryActivityRevisionRepository } from '../src/repositories/ActivityRevisionRepository.ts';
import { InMemoryBusinessActivityRepository } from '../src/repositories/BusinessActivityRepository.ts';
import { InMemoryAuditLogRepository } from '../src/repositories/AuditLogRepository.ts';
import { ActivityManagementService } from '../src/services/ActivityManagementService.ts';
import {
  PublicationStatus,
  RevisionStatus,
  ActivityCategory,
  ProLocalRole,
  SystemAction
} from '../src/domain/models.ts';
import type { BusinessActivity, AuditLogEntry } from '../src/domain/models.ts';

describe('Fase 2 — Service Layer del Workflow di Approvazione Tests', () => {
  function createTestDb() {
    const mem = newDb({ noAstCoverageCheck: true });
    const adapter = mem.adapters.createPg();
    const pool = new adapter.Pool();
    return { mem, pool };
  }

  function createInitialActivity(overrides: Partial<BusinessActivity> = {}): BusinessActivity {
    return {
      id: 'act-001',
      memberId: 'socio-001',
      nomeAttivita: 'Panificio Tradizionale',
      categoria: ActivityCategory.ENOGASTRONOMIA_LOCALE,
      descrizioneBreve: 'Pane e dolci tipici dal 1950',
      descrizioneCompleta: 'Produzione artigianale con farine locali selezionate',
      serviziOfferti: ['Vendita diretta', 'Consegna a domicilio'],
      localita: 'Roma',
      indirizzoPubblico: 'Via del Corso 1',
      telefonoPubblico: '+39 06 1234567',
      emailPubblica: 'info@panificio.it',
      sitoWeb: 'https://panificio.it',
      statoPubblicazione: PublicationStatus.PUBBLICATA,
      dataUltimoAggiornamento: '2024-01-01',
      ...overrides
    };
  }

  // ==========================================
  // 1. NON-DISTRUTTIVITÀ DI updateActivity()
  // ==========================================

  it('Modifica scheda pubblicata: crea revisione pendente e preserva inalterata la scheda live', async () => {
    const initial = createInitialActivity({ statoPubblicazione: PublicationStatus.PUBBLICATA });
    const actRepo = new InMemoryBusinessActivityRepository([initial]);
    const revRepo = new InMemoryActivityRevisionRepository();
    const auditRepo = new InMemoryAuditLogRepository();

    const service = new ActivityManagementService(actRepo, revRepo, auditRepo);

    const result = await service.updateActivity('socio-001', ProLocalRole.SOCIO, 'act-001', {
      nomeAttivita: 'Panificio Rinnovato 2026',
      descrizioneBreve: 'Nuova descrizione proposta'
    });

    // La scheda live restituita e conservata nel repo principale NON deve essere cambiata
    assert.strictEqual(result.nomeAttivita, 'Panificio Tradizionale');
    assert.strictEqual(result.statoPubblicazione, PublicationStatus.PUBBLICATA);

    const inRepo = await actRepo.findById('act-001');
    assert.strictEqual(inRepo?.nomeAttivita, 'Panificio Tradizionale');
    assert.strictEqual(inRepo?.descrizioneBreve, 'Pane e dolci tipici dal 1950');

    // La revisione pendente deve essere stata creata
    const pending = await revRepo.findPendingByActivityId('act-001');
    assert.notStrictEqual(pending, null);
    assert.strictEqual(pending?.nomeAttivita, 'Panificio Rinnovato 2026');
    assert.strictEqual(pending?.revisionStatus, RevisionStatus.IN_ATTESA_APPROVAZIONE);

    // Audit log di modifica prodotto con flag liveActivityPreserved
    const logs = await auditRepo.findAll();
    const actLogs = logs.filter((l: AuditLogEntry) => l.resourceId === 'act-001');
    assert.strictEqual(actLogs.length, 1);
    assert.strictEqual(actLogs[0].action, SystemAction.MODIFICA_ATTIVITA);
    assert.strictEqual(actLogs[0].metadata?.liveActivityPreserved, true);
  });

  it('Seconda modifica: aggiorna la revisione pendente esistente senza duplicazioni', async () => {
    const initial = createInitialActivity();
    const actRepo = new InMemoryBusinessActivityRepository([initial]);
    const revRepo = new InMemoryActivityRevisionRepository();
    const service = new ActivityManagementService(actRepo, revRepo);

    // Prima modifica
    await service.updateActivity('socio-001', ProLocalRole.SOCIO, 'act-001', {
      nomeAttivita: 'Proposta V1'
    });
    const rev1 = await revRepo.findPendingByActivityId('act-001');
    assert.strictEqual(rev1?.nomeAttivita, 'Proposta V1');

    // Seconda modifica prima dell approvazione
    await service.updateActivity('socio-001', ProLocalRole.SOCIO, 'act-001', {
      nomeAttivita: 'Proposta V2'
    });

    const pendingAll = await revRepo.findByActivityId('act-001');
    assert.strictEqual(pendingAll.length, 1, 'Non devono esistere revisioni concorrenti duplicate');
    assert.strictEqual(pendingAll[0].id, rev1?.id, 'Deve aggiornare lo stesso record');
    assert.strictEqual(pendingAll[0].nomeAttivita, 'Proposta V2');
  });

  it('Modifica scheda BOZZA: crea revisione pendente senza pubblicare la scheda', async () => {
    const initial = createInitialActivity({ statoPubblicazione: PublicationStatus.BOZZA });
    const actRepo = new InMemoryBusinessActivityRepository([initial]);
    const revRepo = new InMemoryActivityRevisionRepository();
    const service = new ActivityManagementService(actRepo, revRepo);

    await service.updateActivity('socio-001', ProLocalRole.SOCIO, 'act-001', {
      nomeAttivita: 'Bozza Modificata'
    });

    const act = await actRepo.findById('act-001');
    assert.strictEqual(act?.statoPubblicazione, PublicationStatus.BOZZA, 'La scheda deve rimanere BOZZA');

    const rev = await revRepo.findPendingByActivityId('act-001');
    assert.strictEqual(rev?.revisionStatus, RevisionStatus.IN_ATTESA_APPROVAZIONE);
  });

  it('Revisione precedente RIFIUTATA: una nuova sottomissione crea una nuova revisione nello storico', async () => {
    const initial = createInitialActivity();
    const actRepo = new InMemoryBusinessActivityRepository([initial]);
    const revRepo = new InMemoryActivityRevisionRepository([
      {
        id: 'rev-vecchia-rifiutata',
        activityId: 'act-001',
        memberId: 'socio-001',
        nomeAttivita: 'Proposta Sbagliata',
        categoria: ActivityCategory.ENOGASTRONOMIA_LOCALE,
        descrizioneBreve: 'Errata',
        descrizioneCompleta: 'Errata',
        serviziOfferti: [],
        localita: 'Roma',
        revisionStatus: RevisionStatus.RIFIUTATA,
        submittedAt: '2024-01-01',
        reviewNotes: 'Motivazione valida di rifiuto'
      }
    ]);
    const service = new ActivityManagementService(actRepo, revRepo);

    await service.updateActivity('socio-001', ProLocalRole.SOCIO, 'act-001', {
      nomeAttivita: 'Proposta Corretta V2'
    });

    const allRevs = await revRepo.findByActivityId('act-001');
    assert.strictEqual(allRevs.length, 2, 'Lo storico deve preservare la revisione rifiutata e contenere la nuova');
    const pending = await revRepo.findPendingByActivityId('act-001');
    assert.strictEqual(pending?.nomeAttivita, 'Proposta Corretta V2');
    assert.notStrictEqual(pending?.id, 'rev-vecchia-rifiutata');
  });

  // ==========================================
  // 2. APPROVAZIONE (approveRevision)
  // ==========================================

  it('Presidente approva revisione di altro socio: aggiorna activity a PUBBLICATA ed emette audit', async () => {
    const initial = createInitialActivity({ nomeAttivita: 'Nome Vecchio' });
    const actRepo = new InMemoryBusinessActivityRepository([initial]);
    const revRepo = new InMemoryActivityRevisionRepository();
    const auditRepo = new InMemoryAuditLogRepository();
    const service = new ActivityManagementService(actRepo, revRepo, auditRepo);

    // Sottomissione da parte di socio-001
    await service.updateActivity('socio-001', ProLocalRole.SOCIO, 'act-001', {
      nomeAttivita: 'Nome Approvato',
      descrizioneBreve: 'Nuova breve approvata'
    });
    const pending = await revRepo.findPendingByActivityId('act-001');
    assert(pending);

    // Approvazione da parte del Presidente (socio-pres-01)
    const result = await service.approveRevision('socio-pres-01', ProLocalRole.PRESIDENTE, pending.id);

    assert.strictEqual(result.revision.revisionStatus, RevisionStatus.PUBBLICATA);
    assert.strictEqual(result.revision.reviewedBy, 'socio-pres-01');
    assert.strictEqual(result.activity.nomeAttivita, 'Nome Approvato');
    assert.strictEqual(result.activity.statoPubblicazione, PublicationStatus.PUBBLICATA);

    // Verifica persistenza in repository
    const actSaved = await actRepo.findById('act-001');
    assert.strictEqual(actSaved?.nomeAttivita, 'Nome Approvato');
    assert.strictEqual(actSaved?.statoPubblicazione, PublicationStatus.PUBBLICATA);

    // Verifica audit trail
    const logs = await auditRepo.findAll();
    const approveLog = logs.find((l: AuditLogEntry) => l.action === SystemAction.APPROVAZIONE_REVISIONE_ATTIVITA);
    assert(approveLog);
    assert.strictEqual(approveLog.actorId, 'socio-pres-01');
    assert.strictEqual(approveLog.metadata?.revisionId, pending.id);
  });

  it('Anti-autoapprovazione: il Presidente NON può approvare la propria scheda economica', async () => {
    const presActivity = createInitialActivity({
      id: 'act-pres',
      memberId: 'socio-presidente',
      nomeAttivita: 'Attività del Presidente'
    });
    const actRepo = new InMemoryBusinessActivityRepository([presActivity]);
    const revRepo = new InMemoryActivityRevisionRepository();
    const service = new ActivityManagementService(actRepo, revRepo);

    await service.updateActivity('socio-presidente', ProLocalRole.PRESIDENTE, 'act-pres', {
      nomeAttivita: 'Modifica Presidente'
    });
    const pending = await revRepo.findPendingByActivityId('act-pres');
    assert(pending);

    // Tentativo di auto-approvazione
    await assert.rejects(
      async () => {
        await service.approveRevision('socio-presidente', ProLocalRole.PRESIDENTE, pending.id);
      },
      /conflitto di interessi/i
    );
  });

  it('Divieto di approvazione per ruoli non autorizzati: SOCIO e AMMINISTRATORE_TECNICO', async () => {
    const actRepo = new InMemoryBusinessActivityRepository([createInitialActivity()]);
    const revRepo = new InMemoryActivityRevisionRepository();
    const service = new ActivityManagementService(actRepo, revRepo);

    await service.updateActivity('socio-001', ProLocalRole.SOCIO, 'act-001', {
      nomeAttivita: 'Nuova Proposta'
    });
    const pending = await revRepo.findPendingByActivityId('act-001');
    assert(pending);

    // Socio ordinario
    await assert.rejects(
      async () => {
        await service.approveRevision('socio-002', ProLocalRole.SOCIO, pending.id);
      },
      /Accesso negato/i
    );

    // Amministratore Tecnico
    await assert.rejects(
      async () => {
        await service.approveRevision('admin-tech', ProLocalRole.AMMINISTRATORE_TECNICO, pending.id);
      },
      /Accesso negato/i
    );
  });

  // ==========================================
  // 3. RIFIUTO (rejectRevision)
  // ==========================================

  it('Presidente rifiuta revisione con motivazione valida (>= 10 caratteri): scheda live non modificata', async () => {
    const initial = createInitialActivity({ nomeAttivita: 'Panificio Live' });
    const actRepo = new InMemoryBusinessActivityRepository([initial]);
    const revRepo = new InMemoryActivityRevisionRepository();
    const auditRepo = new InMemoryAuditLogRepository();
    const service = new ActivityManagementService(actRepo, revRepo, auditRepo);

    await service.updateActivity('socio-001', ProLocalRole.SOCIO, 'act-001', {
      nomeAttivita: 'Proposta Irregolare'
    });
    const pending = await revRepo.findPendingByActivityId('act-001');
    assert(pending);

    const validReason = 'Descrizione non conforme alle linee guida dello statuto associativo';
    const rejected = await service.rejectRevision('socio-pres-01', ProLocalRole.PRESIDENTE, pending.id, validReason);

    assert.strictEqual(rejected.revisionStatus, RevisionStatus.RIFIUTATA);
    assert.strictEqual(rejected.reviewNotes, validReason);
    assert.strictEqual(rejected.reviewedBy, 'socio-pres-01');

    // La scheda live NON deve essere stata minimamente toccata
    const liveAct = await actRepo.findById('act-001');
    assert.strictEqual(liveAct?.nomeAttivita, 'Panificio Live');

    // Audit log di rifiuto
    const logs = await auditRepo.findAll();
    const rejectLog = logs.find((l: AuditLogEntry) => l.action === SystemAction.RIFIUTO_REVISIONE_ATTIVITA);
    assert(rejectLog);
    assert.strictEqual(rejectLog.actorId, 'socio-pres-01');
    assert.strictEqual(rejectLog.metadata?.motivazione, validReason);
  });

  it('Rifiuto fallisce se la motivazione è assente o inferiore a 10 caratteri significativi', async () => {
    const actRepo = new InMemoryBusinessActivityRepository([createInitialActivity()]);
    const revRepo = new InMemoryActivityRevisionRepository();
    const service = new ActivityManagementService(actRepo, revRepo);

    await service.updateActivity('socio-001', ProLocalRole.SOCIO, 'act-001', { nomeAttivita: 'P' });
    const pending = await revRepo.findPendingByActivityId('act-001');
    assert(pending);

    await assert.rejects(
      async () => {
        await service.rejectRevision('socio-pres-01', ProLocalRole.PRESIDENTE, pending.id, 'Corta');
      },
      /almeno 10 caratteri/i
    );

    await assert.rejects(
      async () => {
        await service.rejectRevision('socio-pres-01', ProLocalRole.PRESIDENTE, pending.id, '         ');
      },
      /almeno 10 caratteri/i
    );
  });

  it('Anti-autorifiuto: il Presidente NON può rifiutare la propria scheda economica', async () => {
    const presAct = createInitialActivity({ id: 'act-pres', memberId: 'socio-pres-01' });
    const actRepo = new InMemoryBusinessActivityRepository([presAct]);
    const revRepo = new InMemoryActivityRevisionRepository();
    const service = new ActivityManagementService(actRepo, revRepo);

    await service.updateActivity('socio-pres-01', ProLocalRole.PRESIDENTE, 'act-pres', { nomeAttivita: 'P' });
    const pending = await revRepo.findPendingByActivityId('act-pres');
    assert(pending);

    await assert.rejects(
      async () => {
        await service.rejectRevision(
          'socio-pres-01',
          ProLocalRole.PRESIDENTE,
          pending.id,
          'Motivazione valida ma su se stesso'
        );
      },
      /Accesso negato/i
    );
  });

  // ==========================================
  // 4. CONSULTAZIONE CODA (getPendingRevisions)
  // ==========================================

  it('Solo il Presidente può consultare la coda delle revisioni pendenti', async () => {
    const actRepo = new InMemoryBusinessActivityRepository([createInitialActivity()]);
    const revRepo = new InMemoryActivityRevisionRepository();
    const service = new ActivityManagementService(actRepo, revRepo);

    await service.updateActivity('socio-001', ProLocalRole.SOCIO, 'act-001', { nomeAttivita: 'Proposta' });

    // Presidente autorizzato
    const queue = await service.getPendingRevisions(ProLocalRole.PRESIDENTE);
    assert.strictEqual(queue.length, 1);

    // Socio ordinario bloccato
    await assert.rejects(
      async () => {
        await service.getPendingRevisions(ProLocalRole.SOCIO);
      },
      /Accesso negato/i
    );

    // Admin Tecnico bloccato
    await assert.rejects(
      async () => {
        await service.getPendingRevisions(ProLocalRole.AMMINISTRATORE_TECNICO);
      },
      /Accesso negato/i
    );
  });

  // ==========================================
  // 5. ROLLBACK ATOMICO (InMemory e PostgreSQL)
  // ==========================================

  it('Rollback InMemory se audit approvazione fallisce: activity e revision tornano allo stato originario', async () => {
    const initial = createInitialActivity({ nomeAttivita: 'Panificio Originale' });
    const actRepo = new InMemoryBusinessActivityRepository([initial]);
    const revRepo = new InMemoryActivityRevisionRepository();

    let shouldFail = false;
    const faultyAuditRepo: any = {
      log: async () => {
        if (shouldFail) {
          throw new Error('Database audit log disk full');
        }
      },
      findAll: async () => []
    };

    const service = new ActivityManagementService(actRepo, revRepo, faultyAuditRepo);
    await service.updateActivity('socio-001', ProLocalRole.SOCIO, 'act-001', {
      nomeAttivita: 'Nuovo Nome Mai Committato'
    });
    const pending = await revRepo.findPendingByActivityId('act-001');
    assert(pending);

    // Attiviamo il fallimento dell'audit per verificare il rollback dell'approvazione
    shouldFail = true;

    // L approvazione deve fallire
    await assert.rejects(
      async () => {
        await service.approveRevision('socio-pres-01', ProLocalRole.PRESIDENTE, pending.id);
      },
      /disk full/i
    );

    // Verifica che l activity sia rimasta invariata
    const actAfter = await actRepo.findById('act-001');
    assert.strictEqual(actAfter?.nomeAttivita, 'Panificio Originale');

    // Verifica che la revisione sia tornata in IN_ATTESA_APPROVAZIONE
    const revAfter = await revRepo.findById(pending.id);
    assert.strictEqual(revAfter?.revisionStatus, RevisionStatus.IN_ATTESA_APPROVAZIONE);
    assert.strictEqual(revAfter?.reviewedBy, undefined);
  });

  it('Rollback InMemory se audit rifiuto fallisce: revisione torna allo stato originario', async () => {
    const initial = createInitialActivity();
    const actRepo = new InMemoryBusinessActivityRepository([initial]);
    const revRepo = new InMemoryActivityRevisionRepository();

    let shouldFail = false;
    const faultyAuditRepo: any = {
      log: async () => {
        if (shouldFail) {
          throw new Error('Audit failure on reject');
        }
      },
      findAll: async () => []
    };

    const service = new ActivityManagementService(actRepo, revRepo, faultyAuditRepo);
    await service.updateActivity('socio-001', ProLocalRole.SOCIO, 'act-001', { nomeAttivita: 'Proposta' });
    const pending = await revRepo.findPendingByActivityId('act-001');
    assert(pending);

    shouldFail = true;

    await assert.rejects(
      async () => {
        await service.rejectRevision(
          'socio-pres-01',
          ProLocalRole.PRESIDENTE,
          pending.id,
          'Motivazione valida ma audit fallisce'
        );
      },
      /Audit failure/i
    );

    const revAfter = await revRepo.findById(pending.id);
    assert.strictEqual(revAfter?.revisionStatus, RevisionStatus.IN_ATTESA_APPROVAZIONE);
    assert.strictEqual(revAfter?.reviewNotes, undefined);
  });

  it('Transazione PostgreSQL reale: rollback atomico se audit fallisce e isolamento delle tabelle', async () => {
    const { pool } = createTestDb();
    const migrator = new DatabaseMigrator(pool);
    await migrator.runMigrations();

    // Creiamo socio e attività in Postgres
    await pool.query(`
      INSERT INTO members (id, codice_socio, nome_cognome, email_demo, data_iscrizione, membership_status, quota_sociale_in_regola, ruolo_direttivo)
      VALUES 
        ('soc-10', 'COD-10', 'Socio 10', 's10@test.it', '2024-01-01', 'ATTIVO', true, null),
        ('pres-10', 'COD-PRES-10', 'Presidente 10', 'pres10@test.it', '2024-01-01', 'ATTIVO', true, 'PRESIDENTE');

      INSERT INTO business_activities (id, member_id, nome_attivita, categoria, descrizione_breve, descrizione_completa, servizi_offerti, localita, publication_status, data_ultimo_aggiornamento)
      VALUES ('act-pg-1', 'soc-10', 'Attivita Live Postgres', 'ARTIGIANATO_RESTAURO', 'Breve', 'Completa', '[]', 'Roma', 'PUBBLICATA', '2024-01-01');
    `);

    const pgActRepo = new PostgresBusinessActivityRepository(pool);
    const pgRevRepo = new PostgresActivityRevisionRepository(pool);

    let shouldFail = false;
    const faultyPgAuditRepo: any = {
      log: async () => {
        if (shouldFail) {
          throw new Error('Transazione abortita su audit');
        }
      },
      findAll: async () => []
    };

    const service = new ActivityManagementService(pgActRepo, pgRevRepo, faultyPgAuditRepo, pool);

    await service.updateActivity('soc-10', ProLocalRole.SOCIO, 'act-pg-1', {
      nomeAttivita: 'Proposta Modifica Postgres'
    });
    const pending = await pgRevRepo.findPendingByActivityId('act-pg-1');
    assert(pending);

    shouldFail = true;

    // L approvazione fallisce a causa dell audit
    await assert.rejects(
      async () => {
        await service.approveRevision('pres-10', ProLocalRole.PRESIDENTE, pending.id);
      },
      /Transazione abortita/i
    );

    // Verifica su Postgres: la scheda deve essere rimasta "Attivita Live Postgres"
    const actAfter = await pgActRepo.findById('act-pg-1');
    assert.strictEqual(actAfter?.nomeAttivita, 'Attivita Live Postgres');

    // La revisione deve essere ancora IN_ATTESA_APPROVAZIONE
    const revAfter = await pgRevRepo.findById(pending.id);
    assert.strictEqual(revAfter?.revisionStatus, RevisionStatus.IN_ATTESA_APPROVAZIONE);
  });

  // ==========================================
  // 6. CONCORRENZA E DOPPIA APPROVAZIONE
  // ==========================================

  it('Doppia approvazione concorrente: una sola ha successo, la seconda rileva stato già consumato', async () => {
    const initial = createInitialActivity();
    const actRepo = new InMemoryBusinessActivityRepository([initial]);
    const revRepo = new InMemoryActivityRevisionRepository();
    const auditRepo = new InMemoryAuditLogRepository();
    const service = new ActivityManagementService(actRepo, revRepo, auditRepo);

    await service.updateActivity('socio-001', ProLocalRole.SOCIO, 'act-001', {
      nomeAttivita: 'Nome Concorrente'
    });
    const pending = await revRepo.findPendingByActivityId('act-001');
    assert(pending);

    // Prima approvazione ha successo
    const res1 = await service.approveRevision('socio-pres-01', ProLocalRole.PRESIDENTE, pending.id);
    assert.strictEqual(res1.revision.revisionStatus, RevisionStatus.PUBBLICATA);

    // Seconda approvazione sulla stessa revisione deve fallire immediatamente
    await assert.rejects(
      async () => {
        await service.approveRevision('socio-pres-01', ProLocalRole.PRESIDENTE, pending.id);
      },
      /non è in attesa di approvazione/i
    );

    // Nessun doppio audit log
    const logs = await auditRepo.findAll();
    const approveLogs = logs.filter((l: AuditLogEntry) => l.action === SystemAction.APPROVAZIONE_REVISIONE_ATTIVITA);
    assert.strictEqual(approveLogs.length, 1, 'Deve essere registrato ESATTAMENTE un solo audit log di approvazione');
  });

  it('Retrocompatibilità costruttore: new ActivityManagementService(activityRepo, auditRepo) funziona regolarmente', async () => {
    const actRepo = new InMemoryBusinessActivityRepository([createInitialActivity()]);
    const auditRepo = new InMemoryAuditLogRepository();

    // Vecchia istanziazione senza revisionRepo
    const legacyService = new ActivityManagementService(actRepo, auditRepo);

    const res = await legacyService.updateActivity('socio-001', ProLocalRole.SOCIO, 'act-001', {
      nomeAttivita: 'Proposta Legacy'
    });

    assert(res);
    assert.strictEqual(res.id, 'act-001');
  });

  it('getRevisionById restituisce la revisione richiesta o null se non esiste', async () => {
    const revRepo = new InMemoryActivityRevisionRepository([
      {
        id: 'rev-xyz',
        activityId: 'act-001',
        memberId: 'socio-001',
        nomeAttivita: 'Bottega XYZ',
        categoria: ActivityCategory.ARTIGIANATO_RESTAURO,
        descrizioneBreve: 'Breve',
        descrizioneCompleta: 'Completa',
        serviziOfferti: [],
        localita: 'Roma',
        revisionStatus: RevisionStatus.IN_ATTESA_APPROVAZIONE,
        submittedAt: '2024-01-01'
      }
    ]);
    const actRepo = new InMemoryBusinessActivityRepository();
    const service = new ActivityManagementService(actRepo, revRepo);

    const found = await service.getRevisionById('rev-xyz');
    assert.strictEqual(found?.id, 'rev-xyz');

    const notFound = await service.getRevisionById('rev-non-esiste');
    assert.strictEqual(notFound, null);
  });
});
