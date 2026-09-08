import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  MembershipStatus,
  PublicationStatus,
  ProLocalRole,
  SystemAction,
  ActivityCategory
} from '../src/domain/models.ts';
import type { BusinessActivity, Member } from '../src/domain/models.ts';
import { AccessControlPolicy } from '../src/domain/policies/AccessControlPolicy.ts';
import { InMemoryMemberRepository } from '../src/repositories/MemberRepository.ts';
import { InMemoryBusinessActivityRepository } from '../src/repositories/BusinessActivityRepository.ts';
import { ShowcaseService } from '../src/services/ShowcaseService.ts';
import { ActivityManagementService } from '../src/services/ActivityManagementService.ts';

describe('Pro-Local Backend Governance & RBAC Security Tests', () => {
  const sampleActivityMemberA: BusinessActivity = {
    id: 'act-01',
    memberId: 'mem-A',
    nomeAttivita: 'Bottega Artigiana A',
    categoria: ActivityCategory.ARTIGIANATO_RESTAURO,
    descrizioneBreve: 'Restauro mobili d\'arte',
    descrizioneCompleta: 'Restauro conservativo e creazioni artistiche',
    serviziOfferti: ['Restauro', 'Lucidatura'],
    localita: 'Borgo Antico',
    statoPubblicazione: PublicationStatus.PUBBLICATA,
    dataUltimoAggiornamento: '2024-05-10'
  };

  const sampleActivityMemberB: BusinessActivity = {
    id: 'act-02',
    memberId: 'mem-B',
    nomeAttivita: 'Studio Professionale B',
    categoria: ActivityCategory.CONSULENZA_PROFESSIONALE,
    descrizioneBreve: 'Consulenza fiscale e societaria',
    descrizioneCompleta: 'Supporto a imprese e liberi professionisti',
    serviziOfferti: ['Contabilità', 'Dichiarazioni'],
    localita: 'Centro Storico',
    statoPubblicazione: PublicationStatus.PUBBLICATA,
    dataUltimoAggiornamento: '2024-05-12'
  };

  // =========================================================================
  // 1. TEST RBAC NEGATIVI: L'AMMINISTRATORE TECNICO NON HA POTERI ASSOCIATIVI
  // =========================================================================

  it('TechnicalAdminCannotAdmitMember', () => {
    const allowed = AccessControlPolicy.canPerformAction(
      ProLocalRole.AMMINISTRATORE_TECNICO,
      SystemAction.AMMISSIONE_SOCIO
    );
    assert.strictEqual(allowed, false, 'L\'Amministratore Tecnico non può ammettere soci');
  });

  it('TechnicalAdminCannotSuspendMember', () => {
    const allowed = AccessControlPolicy.canPerformAction(
      ProLocalRole.AMMINISTRATORE_TECNICO,
      SystemAction.SOSPENSIONE_SOCIO
    );
    assert.strictEqual(allowed, false, 'L\'Amministratore Tecnico non può sospendere soci');
  });

  it('TechnicalAdminCannotExcludeMember', () => {
    const allowed = AccessControlPolicy.canPerformAction(
      ProLocalRole.AMMINISTRATORE_TECNICO,
      SystemAction.ESCLUSIONE_SOCIO
    );
    assert.strictEqual(allowed, false, 'L\'Amministratore Tecnico non può escludere soci');
  });

  it('TechnicalAdminCannotModifyMembershipStatus', () => {
    const allowed = AccessControlPolicy.canPerformAction(
      ProLocalRole.AMMINISTRATORE_TECNICO,
      SystemAction.MODIFICA_STATUS_ASSOCIATIVO
    );
    assert.strictEqual(allowed, false, 'L\'Amministratore Tecnico non può modificare lo status dei soci');
  });

  it('TechnicalAdminCannotElectCouncilMember', () => {
    const allowed = AccessControlPolicy.canPerformAction(
      ProLocalRole.AMMINISTRATORE_TECNICO,
      SystemAction.ELEZIONE_CONSIGLIERE
    );
    assert.strictEqual(allowed, false, 'L\'Amministratore Tecnico non può eleggere consiglieri');
  });

  it('TechnicalAdminCannotRevokeCouncilMember', () => {
    const allowed = AccessControlPolicy.canPerformAction(
      ProLocalRole.AMMINISTRATORE_TECNICO,
      SystemAction.REVOCA_CONSIGLIERE
    );
    assert.strictEqual(allowed, false, 'L\'Amministratore Tecnico non può revocare consiglieri');
  });

  it('TechnicalAdminCannotModifyAssociationRules', () => {
    const allowed = AccessControlPolicy.canPerformAction(
      ProLocalRole.AMMINISTRATORE_TECNICO,
      SystemAction.MODIFICA_STATUTO_REGOLE
    );
    assert.strictEqual(allowed, false, 'L\'Amministratore Tecnico non può modificare le regole statutarie');
  });

  it('TechnicalAdminCannotOverrideAssociativeDecision', () => {
    const allowed = AccessControlPolicy.canPerformAction(
      ProLocalRole.AMMINISTRATORE_TECNICO,
      SystemAction.MODIFICA_DECISIONI_ASSOCIATIVE
    );
    assert.strictEqual(allowed, false, 'L\'Amministratore Tecnico non può scavalcare decisioni associative');
  });

  it('TechnicalAdminCannotForcePublicShowcase', () => {
    const allowed = AccessControlPolicy.canPerformAction(
      ProLocalRole.AMMINISTRATORE_TECNICO,
      SystemAction.FORZATURA_PUBBLICAZIONE_VETRINA
    );
    assert.strictEqual(allowed, false, 'L\'Amministratore Tecnico non può forzare la pubblicazione in vetrina');
  });

  // =========================================================================
  // 2. TEST POSITIVI: OPERAZIONI TECNICHE DELL'AMMINISTRATORE TECNICO
  // =========================================================================

  it('TechnicalAdminCanPerformTechnicalOperations', () => {
    assert.strictEqual(
      AccessControlPolicy.canPerformAction(
        ProLocalRole.AMMINISTRATORE_TECNICO,
        SystemAction.DIAGNOSTICA_SISTEMA
      ),
      true,
      'L\'Amministratore Tecnico deve poter eseguire diagnostica'
    );
    assert.strictEqual(
      AccessControlPolicy.canPerformAction(
        ProLocalRole.AMMINISTRATORE_TECNICO,
        SystemAction.GESTIONE_CONFIGURAZIONE_TECNICA
      ),
      true,
      'L\'Amministratore Tecnico deve poter gestire la configurazione tecnica'
    );
    assert.strictEqual(
      AccessControlPolicy.canPerformAction(
        ProLocalRole.AMMINISTRATORE_TECNICO,
        SystemAction.MANUTENZIONE_INFRASTRUTTURA
      ),
      true,
      'L\'Amministratore Tecnico deve poter eseguire manutenzione tecnica'
    );
    assert.strictEqual(
      AccessControlPolicy.canPerformAction(
        ProLocalRole.AMMINISTRATORE_TECNICO,
        SystemAction.CONSULTAZIONE_LOG_TECNICI
      ),
      true,
      'L\'Amministratore Tecnico deve poter consultare i log tecnici'
    );
  });

  // =========================================================================
  // 3. OWNERSHIP DELLE ATTIVITÀ: SOCIO A vs SOCIO B
  // =========================================================================

  it('MemberCanEditOwnActivity', () => {
    const canEdit = AccessControlPolicy.canEditActivity(
      'mem-A',
      ProLocalRole.SOCIO,
      sampleActivityMemberA
    );
    assert.strictEqual(canEdit, true, 'Il socio A deve poter modificare la propria attività');
  });

  it('MemberCannotEditOtherMemberActivity', () => {
    const canEdit = AccessControlPolicy.canEditActivity(
      'mem-A',
      ProLocalRole.SOCIO,
      sampleActivityMemberB
    );
    assert.strictEqual(canEdit, false, 'Il socio A NON deve poter modificare l\'attività del socio B');
  });

  it('TechnicalAdminCannotEditMemberActivity', () => {
    const canEdit = AccessControlPolicy.canEditActivity(
      'admin-tech',
      ProLocalRole.AMMINISTRATORE_TECNICO,
      sampleActivityMemberA
    );
    assert.strictEqual(canEdit, false, 'L\'Amministratore Tecnico non può modificare schede dei soci');
  });

  it('ActivityManagementServiceEnforcesOwnership', async () => {
    const activityRepo = new InMemoryBusinessActivityRepository([sampleActivityMemberA, sampleActivityMemberB]);
    const service = new ActivityManagementService(activityRepo);

    // Modifica lecita della propria attività
    const updated = await service.updateActivity('mem-A', ProLocalRole.SOCIO, 'act-01', {
      descrizioneBreve: 'Nuova descrizione'
    });
    assert.strictEqual(updated.descrizioneBreve, 'Nuova descrizione');
    assert.strictEqual(updated.statoPubblicazione, PublicationStatus.IN_ATTESA_APPROVAZIONE);

    // Tentativo illecito da parte di socio A su attività di socio B
    await assert.rejects(
      async () => {
        await service.updateActivity('mem-A', ProLocalRole.SOCIO, 'act-02', {
          descrizioneBreve: 'Tentativo non autorizzato'
        });
      },
      /Accesso negato/
    );

    // Tentativo illecito da parte dell'Amministratore Tecnico
    await assert.rejects(
      async () => {
        await service.updateActivity('tech-admin', ProLocalRole.AMMINISTRATORE_TECNICO, 'act-01', {
          descrizioneBreve: 'Tentativo admin tecnico'
        });
      },
      /Accesso negato/
    );
  });

  // =========================================================================
  // 4. STATI ASSOCIATIVI (INCLUSO ESCLUSO) E REGOLE VETRINA
  // =========================================================================

  it('MembershipStatusExclusoCannotPublishActivity', () => {
    const isExclusoAllowed = AccessControlPolicy.isActivityPubliclyVisible(
      sampleActivityMemberA,
      MembershipStatus.ESCLUSO
    );
    assert.strictEqual(isExclusoAllowed, false, 'Lo status ESCLUSO non deve consentire visibilità pubblica');
  });

  it('ShowcaseVisibilityRequiresActiveMemberAndPublishedStatus', async () => {
    // Verifica logica pura di dominio
    assert.strictEqual(
      AccessControlPolicy.isActivityPubliclyVisible(sampleActivityMemberA, MembershipStatus.ATTIVO),
      true,
      'Attività pubblicata e socio ATTIVO deve essere visibile'
    );
    assert.strictEqual(
      AccessControlPolicy.isActivityPubliclyVisible(sampleActivityMemberA, MembershipStatus.IN_ATTESA),
      false,
      'Socio IN_ATTESA non deve essere visibile'
    );
    assert.strictEqual(
      AccessControlPolicy.isActivityPubliclyVisible(sampleActivityMemberA, MembershipStatus.SOSPESO),
      false,
      'Socio SOSPESO non deve essere visibile'
    );
    assert.strictEqual(
      AccessControlPolicy.isActivityPubliclyVisible(sampleActivityMemberA, MembershipStatus.RECEDUTO),
      false,
      'Socio RECEDUTO non deve essere visibile'
    );
    assert.strictEqual(
      AccessControlPolicy.isActivityPubliclyVisible(sampleActivityMemberA, MembershipStatus.ESCLUSO),
      false,
      'Socio ESCLUSO non deve essere visibile'
    );

    // Scheda in BOZZA non deve essere visibile nemmeno con socio ATTIVO
    const draftAct = { ...sampleActivityMemberA, statoPubblicazione: PublicationStatus.BOZZA };
    assert.strictEqual(
      AccessControlPolicy.isActivityPubliclyVisible(draftAct, MembershipStatus.ATTIVO),
      false,
      'Scheda in bozza non deve essere visibile'
    );

    // Verifica attraverso lo ShowcaseService
    const members: Member[] = [
      {
        id: 'mem-A',
        codiceSocio: 'SOC-001',
        nomeCognome: 'Mario Rossi',
        emailDemo: 'mario@demo.it',
        dataIscrizione: '2024-01-01',
        statoAssociativo: MembershipStatus.ATTIVO,
        quotaSocialeInRegola: true
      },
      {
        id: 'mem-B',
        codiceSocio: 'SOC-002',
        nomeCognome: 'Giulia Bianchi',
        emailDemo: 'giulia@demo.it',
        dataIscrizione: '2024-02-01',
        statoAssociativo: MembershipStatus.SOSPESO,
        quotaSocialeInRegola: false
      }
    ];

    const memberRepo = new InMemoryMemberRepository(members);
    const activityRepo = new InMemoryBusinessActivityRepository([sampleActivityMemberA, sampleActivityMemberB]);
    const showcaseService = new ShowcaseService(activityRepo, memberRepo);

    const publicList = await showcaseService.getPublicShowcase();
    assert.strictEqual(publicList.length, 1, 'Solo 1 attività (quella del socio ATTIVO) deve essere visibile');
    assert.strictEqual(publicList[0].id, 'act-01');
    assert.strictEqual(publicList[0].trasparenza.autonomiaAttivita, true);

    // Se il socio A viene sospeso o escluso, la sua attività scompare immediatamente
    await memberRepo.updateStatus('mem-A', MembershipStatus.ESCLUSO);
    const updatedList = await showcaseService.getPublicShowcase();
    assert.strictEqual(updatedList.length, 0, 'Dopo esclusione del socio A, la vetrina deve essere vuota');
  });
});
