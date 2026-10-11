import { describe, it } from 'node:test';
import assert from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { newDb } from 'pg-mem';
import { DatabaseMigrator, MIGRATIONS } from '../src/db/migrator.ts';
import { PostgresMemberRepository } from '../src/repositories/PostgresMemberRepository.ts';
import { InMemoryMemberRepository } from '../src/repositories/MemberRepository.ts';
import { InMemoryActivityRevisionRepository } from '../src/repositories/ActivityRevisionRepository.ts';
import { PostgresActivityRevisionRepository } from '../src/repositories/PostgresActivityRevisionRepository.ts';
import { AuthService } from '../src/services/AuthService.ts';
import { InMemoryUserAccountRepository } from '../src/repositories/UserAccountRepository.ts';
import { InMemorySessionRepository } from '../src/repositories/SessionRepository.ts';
import { ScryptPasswordHasher } from '../src/auth/PasswordHasher.ts';
import { InMemoryAuditLogRepository } from '../src/repositories/AuditLogRepository.ts';
import {
  MembershipStatus,
  PublicationStatus,
  ActivityCategory,
  RevisionStatus,
  ProLocalRole,
  SystemAction
} from '../src/domain/models.ts';
import type { Member, ActivityRevision } from '../src/domain/models.ts';
import { ActorType } from '../src/domain/auth.ts';
import { AccessControlPolicy } from '../src/domain/policies/AccessControlPolicy.ts';

describe('Fase 1 — Database e Modello di Dominio Tests', () => {
  function createTestDb() {
    const mem = newDb({ noAstCoverageCheck: true });
    const adapter = mem.adapters.createPg();
    const pool = new adapter.Pool();
    return { mem, pool };
  }

  it('File migrazione 005 esiste sul filesystem ed è semanticamente coerente', () => {
    const migrationPath = resolve(process.cwd(), 'backend/src/db/migrations/005_create_activity_revisions_and_president.sql');
    assert.strictEqual(existsSync(migrationPath), true, 'Il file 005_create_activity_revisions_and_president.sql deve esistere');

    const content = readFileSync(migrationPath, 'utf-8');
    assert(content.includes('ALTER TABLE members'), 'Deve alterare members per aggiungere ruolo_direttivo');
    assert(content.includes('uq_presidente_in_carica'), 'Deve definire indice unico parziale per il Presidente');
    assert(content.includes('CREATE TABLE IF NOT EXISTS activity_revisions'), 'Deve creare tabella activity_revisions');
    assert(content.includes('REFERENCES business_activities(id) ON DELETE CASCADE'), 'Deve definire FK cascade verso business_activities');
    assert(content.includes('REFERENCES members(id)'), 'Deve definire FK verso members');
  });

  it('Esegue la migrazione 005 con successo e crea la tabella activity_revisions', async () => {
    const { pool } = createTestDb();
    const migrator = new DatabaseMigrator(pool);

    const res = await migrator.runMigrations();
    assert.strictEqual(res.applied.includes('005_create_activity_revisions_and_president'), true);

    // Verifica colonne su members
    const membersCols = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'members';
    `);
    const colNames = (membersCols.rows as Array<{ column_name: string }>).map((r) => r.column_name);
    assert(colNames.includes('ruolo_direttivo'), 'members deve includere colonna ruolo_direttivo');

    // Verifica colonne su activity_revisions
    const revCols = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'activity_revisions';
    `);
    const revColNames = (revCols.rows as Array<{ column_name: string }>).map((r) => r.column_name);
    assert(revColNames.includes('id'), 'activity_revisions deve includere id');
    assert(revColNames.includes('activity_id'), 'activity_revisions deve includere activity_id');
    assert(revColNames.includes('member_id'), 'activity_revisions deve includere member_id');
    assert(revColNames.includes('revision_status'), 'activity_revisions deve includere revision_status');
    assert(revColNames.includes('review_notes'), 'activity_revisions deve includere review_notes');
  });

  it('Vincolo Unico Presidente: consente soci con NULL ma rifiuta due PRESIDENTE contemporanei', async () => {
    const { pool } = createTestDb();
    const migrator = new DatabaseMigrator(pool);
    await migrator.runMigrations();

    const memberRepo = new PostgresMemberRepository(pool);

    // Inserisce 2 soci senza carica direttiva (ruoloDirettivo = null)
    await memberRepo.create({
      id: 'socio-01',
      codiceSocio: 'SOC-001',
      nomeCognome: 'Socio Uno',
      emailDemo: 'socio1@test.demo',
      dataIscrizione: '2024-01-01',
      statoAssociativo: MembershipStatus.ATTIVO,
      quotaSocialeInRegola: true
    });

    await memberRepo.create({
      id: 'socio-02',
      codiceSocio: 'SOC-002',
      nomeCognome: 'Socio Due',
      emailDemo: 'socio2@test.demo',
      dataIscrizione: '2024-01-02',
      statoAssociativo: MembershipStatus.ATTIVO,
      quotaSocialeInRegola: true
    });

    // Inserisce il primo Presidente
    await memberRepo.create({
      id: 'socio-03',
      codiceSocio: 'SOC-003',
      nomeCognome: 'Presidente Rossi',
      emailDemo: 'presidente@test.demo',
      dataIscrizione: '2024-01-03',
      statoAssociativo: MembershipStatus.ATTIVO,
      quotaSocialeInRegola: true,
      ruoloDirettivo: 'PRESIDENTE'
    });

    // Tentativo di inserire un secondo Presidente deve fallire per violazione dell'indice unico
    await assert.rejects(
      async () => {
        await memberRepo.create({
          id: 'socio-04',
          codiceSocio: 'SOC-004',
          nomeCognome: 'Altro Presidente',
          emailDemo: 'altro.pres@test.demo',
          dataIscrizione: '2024-01-04',
          statoAssociativo: MembershipStatus.ATTIVO,
          quotaSocialeInRegola: true,
          ruoloDirettivo: 'PRESIDENTE'
        });
      },
      /duplicate key value violates unique constraint/i
    );
  });

  it('Integrità referenziale activity_revisions: verifica FK e ON DELETE CASCADE', async () => {
    const { pool } = createTestDb();
    const migrator = new DatabaseMigrator(pool);
    await migrator.runMigrations();

    const memberRepo = new PostgresMemberRepository(pool);
    await memberRepo.create({
      id: 'socio-fk',
      codiceSocio: 'SOC-FK',
      nomeCognome: 'Socio FK',
      emailDemo: 'sociofk@test.demo',
      dataIscrizione: '2024-01-01',
      statoAssociativo: MembershipStatus.ATTIVO,
      quotaSocialeInRegola: true
    });

    await pool.query(`
      INSERT INTO business_activities (
        id, member_id, nome_attivita, categoria, descrizione_breve,
        descrizione_completa, servizi_offerti, localita, publication_status,
        data_ultimo_aggiornamento
      ) VALUES (
        'act-fk', 'socio-fk', 'Attivita FK', 'ARTIGIANATO_RESTAURO', 'Breve',
        'Completa', '[]', 'Roma', 'PUBBLICATA', '2024-01-01'
      );
    `);

    const revRepo = new PostgresActivityRevisionRepository(pool);

    // Creazione revisione valida
    const rev: ActivityRevision = {
      id: 'rev-01',
      activityId: 'act-fk',
      memberId: 'socio-fk',
      nomeAttivita: 'Proposta Modifica',
      categoria: ActivityCategory.ARTIGIANATO_RESTAURO,
      descrizioneBreve: 'Nuova breve',
      descrizioneCompleta: 'Nuova completa',
      serviziOfferti: ['Servizio 1'],
      localita: 'Roma Centro',
      revisionStatus: RevisionStatus.IN_ATTESA_APPROVAZIONE,
      submittedAt: new Date().toISOString()
    };
    await revRepo.create(rev);

    const fetched = await revRepo.findById('rev-01');
    assert.strictEqual(fetched?.id, 'rev-01');
    assert.strictEqual(fetched?.nomeAttivita, 'Proposta Modifica');

    // FK non valida su activity_id
    await assert.rejects(
      async () => {
        await revRepo.create({
          ...rev,
          id: 'rev-invalid-act',
          activityId: 'act-NON-ESISTE'
        });
      },
      /violates foreign key constraint/i
    );

    // FK non valida su member_id
    await assert.rejects(
      async () => {
        await revRepo.create({
          ...rev,
          id: 'rev-invalid-mem',
          memberId: 'socio-NON-ESISTE'
        });
      },
      /violates foreign key constraint/i
    );

    // ON DELETE CASCADE: eliminando l'attività le revisioni collegate vengono rimosse
    await pool.query("DELETE FROM business_activities WHERE id = 'act-fk';");
    const deletedRev = await revRepo.findById('rev-01');
    assert.strictEqual(deletedRev, null, 'La revisione deve essere stata eliminata in cascata');
  });

  it('CRUD PostgresActivityRevisionRepository e InMemoryActivityRevisionRepository', async () => {
    const inMemRepo = new InMemoryActivityRevisionRepository();

    const sampleRev: ActivityRevision = {
      id: 'rev-mem-01',
      activityId: 'act-01',
      memberId: 'socio-01',
      nomeAttivita: 'Bottega v2',
      categoria: ActivityCategory.ARTIGIANATO_RESTAURO,
      descrizioneBreve: 'Desc breve v2',
      descrizioneCompleta: 'Desc completa v2',
      serviziOfferti: ['Restauro'],
      localita: 'Borgo',
      revisionStatus: RevisionStatus.IN_ATTESA_APPROVAZIONE,
      submittedAt: new Date().toISOString()
    };

    await inMemRepo.create(sampleRev);
    const inMemFound = await inMemRepo.findById('rev-mem-01');
    assert.strictEqual(inMemFound?.nomeAttivita, 'Bottega v2');

    const pending = await inMemRepo.findPending();
    assert.strictEqual(pending.length, 1);
    assert.strictEqual(pending[0].id, 'rev-mem-01');

    const pendingForAct = await inMemRepo.findPendingByActivityId('act-01');
    assert.strictEqual(pendingForAct?.id, 'rev-mem-01');

    // Aggiornamento stato
    const updated = await inMemRepo.update({
      ...sampleRev,
      revisionStatus: RevisionStatus.PUBBLICATA,
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'socio-pres'
    });
    assert.strictEqual(updated.revisionStatus, RevisionStatus.PUBBLICATA);

    const pendingAfter = await inMemRepo.findPending();
    assert.strictEqual(pendingAfter.length, 0);
  });

  it('updateRuoloDirettivo aggiorna correttamente la carica del socio in memoria e su Postgres', async () => {
    const inMem = new InMemoryMemberRepository([
      {
        id: 'soc-1',
        codiceSocio: 'COD-1',
        nomeCognome: 'Mario',
        emailDemo: 'mario@test.demo',
        dataIscrizione: '2024-01-01',
        statoAssociativo: MembershipStatus.ATTIVO,
        quotaSocialeInRegola: true
      }
    ]);

    await inMem.updateRuoloDirettivo('soc-1', 'PRESIDENTE');
    const updatedMem = await inMem.findById('soc-1');
    assert.strictEqual(updatedMem?.ruoloDirettivo, 'PRESIDENTE');

    await inMem.updateRuoloDirettivo('soc-1', null);
    const resetMem = await inMem.findById('soc-1');
    assert.strictEqual(resetMem?.ruoloDirettivo, null);
  });

  it('AuthService riconosce runtime il ruolo PRESIDENTE per account MEMBER con ruoloDirettivo PRESIDENTE', async () => {
    const userAccountRepo = new InMemoryUserAccountRepository();
    const sessionRepo = new InMemorySessionRepository();
    const passwordHasher = new ScryptPasswordHasher();
    const auditRepo = new InMemoryAuditLogRepository();

    const memberPresidente: Member = {
      id: 'member-pres-01',
      codiceSocio: 'SOC-PRES',
      nomeCognome: 'Presidente Eletto',
      emailDemo: 'presidente@prolocal.demo',
      dataIscrizione: '2024-01-01',
      statoAssociativo: MembershipStatus.ATTIVO,
      quotaSocialeInRegola: true,
      ruoloDirettivo: 'PRESIDENTE'
    };

    const memberOrdinario: Member = {
      id: 'member-soc-02',
      codiceSocio: 'SOC-ORD',
      nomeCognome: 'Socio Ordinario',
      emailDemo: 'socio@prolocal.demo',
      dataIscrizione: '2024-01-02',
      statoAssociativo: MembershipStatus.ATTIVO,
      quotaSocialeInRegola: true,
      ruoloDirettivo: null
    };

    const memberRepo = new InMemoryMemberRepository([memberPresidente, memberOrdinario]);

    const authService = new AuthService({
      userAccountRepo,
      sessionRepo,
      memberRepo,
      passwordHasher,
      auditLogRepo: auditRepo
    });

    const passHash = await passwordHasher.hash('PresidentPass123!');
    await userAccountRepo.create({
      id: 'user-pres-01',
      email: 'presidente@prolocal.demo',
      passwordHash: passHash,
      actorType: ActorType.MEMBER,
      memberId: 'member-pres-01',
      failedLoginAttempts: 0,
      lockedUntil: null,
      isActive: true
    });

    await userAccountRepo.create({
      id: 'user-soc-02',
      email: 'socio@prolocal.demo',
      passwordHash: passHash,
      actorType: ActorType.MEMBER,
      memberId: 'member-soc-02',
      failedLoginAttempts: 0,
      lockedUntil: null,
      isActive: true
    });

    // Login Presidente
    const presLogin = await authService.authenticate('presidente@prolocal.demo', 'PresidentPass123!');
    const presActor = await authService.resolveAuthenticatedActor(presLogin.rawSessionToken);
    assert.strictEqual(presActor.actorType, ActorType.MEMBER, 'actorType deve rimanere MEMBER');
    assert.strictEqual(presActor.role, ProLocalRole.PRESIDENTE, 'role deve essere risolto come PRESIDENTE');
    assert.strictEqual(presActor.memberId, 'member-pres-01');

    // Login Socio Ordinario
    const socLogin = await authService.authenticate('socio@prolocal.demo', 'PresidentPass123!');
    const socActor = await authService.resolveAuthenticatedActor(socLogin.rawSessionToken);
    assert.strictEqual(socActor.actorType, ActorType.MEMBER);
    assert.strictEqual(socActor.role, ProLocalRole.SOCIO, 'role deve essere SOCIO');
    assert.strictEqual(socActor.memberId, 'member-soc-02');
  });

  it('AccessControlPolicy verifica autorizzazioni e anti-autoapprovazione del Presidente', () => {
    const revisionAltroSocio = { memberId: 'socio-altro' };
    const revisionPropriaPresidente = { memberId: 'socio-presidente' };

    // 1. canApproveRevision
    assert.strictEqual(
      AccessControlPolicy.canApproveRevision('socio-presidente', ProLocalRole.PRESIDENTE, revisionAltroSocio),
      true,
      'Il Presidente deve poter approvare la revisione di un altro socio'
    );

    assert.strictEqual(
      AccessControlPolicy.canApproveRevision('socio-presidente', ProLocalRole.PRESIDENTE, revisionPropriaPresidente),
      false,
      'Anti-autoapprovazione: il Presidente NON può approvare la propria scheda'
    );

    assert.strictEqual(
      AccessControlPolicy.canApproveRevision('socio-ordinario', ProLocalRole.SOCIO, revisionAltroSocio),
      false,
      'Il socio ordinario non può mai approvare'
    );

    assert.strictEqual(
      AccessControlPolicy.canApproveRevision(null, ProLocalRole.AMMINISTRATORE_TECNICO, revisionAltroSocio),
      false,
      'L Amministratore Tecnico non può mai approvare'
    );

    // 2. canRejectRevision
    assert.strictEqual(
      AccessControlPolicy.canRejectRevision('socio-presidente', ProLocalRole.PRESIDENTE, revisionAltroSocio),
      true,
      'Il Presidente deve poter rifiutare la revisione di un altro socio'
    );

    assert.strictEqual(
      AccessControlPolicy.canRejectRevision('socio-presidente', ProLocalRole.PRESIDENTE, revisionPropriaPresidente),
      false,
      'Anti-autoapprovazione: il Presidente NON può rifiutare la propria scheda'
    );

    assert.strictEqual(
      AccessControlPolicy.canRejectRevision('socio-ordinario', ProLocalRole.SOCIO, revisionAltroSocio),
      false,
      'Il socio ordinario non può mai rifiutare'
    );

    assert.strictEqual(
      AccessControlPolicy.canRejectRevision(null, ProLocalRole.AMMINISTRATORE_TECNICO, revisionAltroSocio),
      false,
      'L Amministratore Tecnico non può mai rifiutare'
    );

    // 3. canViewPendingRevisions
    assert.strictEqual(
      AccessControlPolicy.canViewPendingRevisions(ProLocalRole.PRESIDENTE),
      true,
      'Solo il Presidente può visualizzare la coda revisioni pendenti'
    );

    assert.strictEqual(
      AccessControlPolicy.canViewPendingRevisions(ProLocalRole.SOCIO),
      false,
      'Il socio non può visualizzare la coda revisioni pendenti'
    );

    assert.strictEqual(
      AccessControlPolicy.canViewPendingRevisions(ProLocalRole.AMMINISTRATORE_TECNICO),
      false,
      'L Amministratore Tecnico non può visualizzare la coda revisioni pendenti'
    );

    // 4. canEditActivity per il Presidente sulla propria scheda
    assert.strictEqual(
      AccessControlPolicy.canEditActivity('socio-presidente', ProLocalRole.PRESIDENTE, {
        id: 'act-pres',
        memberId: 'socio-presidente'
      } as any),
      true,
      'Il Presidente può modificare la propria scheda attività'
    );

    assert.strictEqual(
      AccessControlPolicy.canEditActivity('socio-presidente', ProLocalRole.PRESIDENTE, {
        id: 'act-altro',
        memberId: 'socio-altro'
      } as any),
      false,
      'Il Presidente non può modificare direttamente schede altrui tramite canEditActivity'
    );
  });
});
