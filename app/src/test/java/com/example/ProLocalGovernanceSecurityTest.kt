package com.example

import com.example.core.model.ActivityCategory
import com.example.core.model.BusinessActivity
import com.example.core.model.MembershipStatus
import com.example.core.model.PublicationStatus
import com.example.core.security.AccessControlPolicy
import com.example.core.security.ProLocalRole
import com.example.core.security.SystemAction
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Suite di test automatizzati per verificare i requisiti di Governance, RBAC,
 * Subordinazione del Ruolo Tecnico, Ownership delle attività e Regole Vetrina.
 */
class ProLocalGovernanceSecurityTest {

    private val sampleActivityMemberA = BusinessActivity(
        id = "act-01",
        memberId = "mem-A",
        nomeAttivita = "Bottega Artigiana A",
        categoria = ActivityCategory.ARTIGIANATO_RESTAURO,
        descrizioneBreve = "Lavorazioni in legno",
        descrizioneCompleta = "Descrizione completa bottega",
        serviziOfferti = listOf("Restauro", "Falegnameria"),
        localita = "Borgo Storico",
        statoPubblicazione = PublicationStatus.PUBBLICATA,
        dataUltimoAggiornamento = "2024-05-10"
    )

    private val sampleActivityMemberB = BusinessActivity(
        id = "act-02",
        memberId = "mem-B",
        nomeAttivita = "Studio Professionale B",
        categoria = ActivityCategory.CONSULENZA_PROFESSIONALE,
        descrizioneBreve = "Consulenza aziendale",
        descrizioneCompleta = "Consulenza strategica",
        serviziOfferti = listOf("Pianificazione", "Consulenza"),
        localita = "Centro",
        statoPubblicazione = PublicationStatus.PUBBLICATA,
        dataUltimoAggiornamento = "2024-05-12"
    )

    // =========================================================================
    // TEST RBAC NEGATIVI: L'AMMINISTRATORE TECNICO NON HA POTERI ASSOCIATIVI
    // =========================================================================

    @Test
    fun technicalAdminCannotAdmitMember() {
        val allowed = AccessControlPolicy.canPerformAction(
            role = ProLocalRole.AMMINISTRATORE_TECNICO,
            action = SystemAction.AMMISSIONE_SOCIO
        )
        assertFalse("L'Amministratore Tecnico non può ammettere soci", allowed)
    }

    @Test
    fun technicalAdminCannotSuspendMember() {
        val allowed = AccessControlPolicy.canPerformAction(
            role = ProLocalRole.AMMINISTRATORE_TECNICO,
            action = SystemAction.SOSPENSIONE_SOCIO
        )
        assertFalse("L'Amministratore Tecnico non può sospendere soci", allowed)
    }

    @Test
    fun technicalAdminCannotExcludeMember() {
        val allowed = AccessControlPolicy.canPerformAction(
            role = ProLocalRole.AMMINISTRATORE_TECNICO,
            action = SystemAction.ESCLUSIONE_SOCIO
        )
        assertFalse("L'Amministratore Tecnico non può escludere soci", allowed)
    }

    @Test
    fun technicalAdminCannotModifyMembershipStatus() {
        val allowed = AccessControlPolicy.canPerformAction(
            role = ProLocalRole.AMMINISTRATORE_TECNICO,
            action = SystemAction.MODIFICA_STATUS_ASSOCIATIVO
        )
        assertFalse("L'Amministratore Tecnico non può modificare lo status associativo", allowed)
    }

    @Test
    fun technicalAdminCannotElectCouncilMember() {
        val allowed = AccessControlPolicy.canPerformAction(
            role = ProLocalRole.AMMINISTRATORE_TECNICO,
            action = SystemAction.ELEZIONE_CONSIGLIERE
        )
        assertFalse("L'Amministratore Tecnico non può eleggere consiglieri", allowed)
    }

    @Test
    fun technicalAdminCannotRevokeCouncilMember() {
        val allowed = AccessControlPolicy.canPerformAction(
            role = ProLocalRole.AMMINISTRATORE_TECNICO,
            action = SystemAction.REVOCA_CONSIGLIERE
        )
        assertFalse("L'Amministratore Tecnico non può revocare consiglieri", allowed)
    }

    @Test
    fun technicalAdminCannotModifyAssociationRules() {
        val allowed = AccessControlPolicy.canPerformAction(
            role = ProLocalRole.AMMINISTRATORE_TECNICO,
            action = SystemAction.MODIFICA_STATUTO_REGOLE
        )
        assertFalse("L'Amministratore Tecnico non può modificare regole statutarie", allowed)
    }

    @Test
    fun technicalAdminCannotOverrideAssociativeDecision() {
        val allowed = AccessControlPolicy.canPerformAction(
            role = ProLocalRole.AMMINISTRATORE_TECNICO,
            action = SystemAction.MODIFICA_DECISIONI_ASSOCIATIVE
        )
        assertFalse("L'Amministratore Tecnico non può scavalcare decisioni associative", allowed)
    }

    @Test
    fun technicalAdminCannotForcePublicShowcase() {
        val allowed = AccessControlPolicy.canPerformAction(
            role = ProLocalRole.AMMINISTRATORE_TECNICO,
            action = SystemAction.FORZATURA_PUBBLICAZIONE_VETRINA
        )
        assertFalse("L'Amministratore Tecnico non può forzare la pubblicazione in vetrina ignorando le regole", allowed)
    }

    // =========================================================================
    // TEST POSITIVI PER OPERAZIONI TECNICHE DELL'AMMINISTRATORE TECNICO
    // =========================================================================

    @Test
    fun technicalAdminCanPerformTechnicalOperations() {
        assertTrue(
            "L'Amministratore Tecnico può eseguire diagnostica",
            AccessControlPolicy.canPerformAction(ProLocalRole.AMMINISTRATORE_TECNICO, SystemAction.DIAGNOSTICA_SISTEMA)
        )
        assertTrue(
            "L'Amministratore Tecnico può gestire la configurazione tecnica",
            AccessControlPolicy.canPerformAction(ProLocalRole.AMMINISTRATORE_TECNICO, SystemAction.GESTIONE_CONFIGURAZIONE_TECNICA)
        )
        assertTrue(
            "L'Amministratore Tecnico può eseguire manutenzione infrastruttura",
            AccessControlPolicy.canPerformAction(ProLocalRole.AMMINISTRATORE_TECNICO, SystemAction.MANUTENZIONE_INFRASTRUTTURA)
        )
        assertTrue(
            "L'Amministratore Tecnico può consultare log tecnici",
            AccessControlPolicy.canPerformAction(ProLocalRole.AMMINISTRATORE_TECNICO, SystemAction.CONSULTAZIONE_LOG_TECNICI)
        )
    }

    // =========================================================================
    // TEST OWNERSHIP DELLE ATTIVITÀ (SOCIO A vs SOCIO B)
    // =========================================================================

    @Test
    fun memberCanEditOwnActivity() {
        val canEditOwn = AccessControlPolicy.canEditActivity(
            actorMemberId = "mem-A",
            actorRole = ProLocalRole.SOCIO,
            activity = sampleActivityMemberA
        )
        assertTrue("Il socio A deve poter modificare la propria attività", canEditOwn)
    }

    @Test
    fun memberCannotEditOtherMemberActivity() {
        val canEditOther = AccessControlPolicy.canEditActivity(
            actorMemberId = "mem-A",
            actorRole = ProLocalRole.SOCIO,
            activity = sampleActivityMemberB
        )
        assertFalse("Il socio A NON deve poter modificare l'attività del socio B", canEditOther)
    }

    @Test
    fun technicalAdminCannotEditMemberActivity() {
        val canAdminEdit = AccessControlPolicy.canEditActivity(
            actorMemberId = "admin-tech",
            actorRole = ProLocalRole.AMMINISTRATORE_TECNICO,
            activity = sampleActivityMemberA
        )
        assertFalse("L'Amministratore Tecnico non può modificare schede dei soci", canAdminEdit)
    }

    // =========================================================================
    // TEST STATI ASSOCIATIVI E VISIBILITÀ VETRINA (INCLUSO ESCLUSO)
    // =========================================================================

    @Test
    fun membershipStatusExclusoCannotPublishActivity() {
        assertFalse("Lo status ESCLUSO non deve consentire la pubblicazione", MembershipStatus.ESCLUSO.canPublishActivity)
    }

    @Test
    fun showcaseVisibilityRequiresActiveMemberAndPublishedStatus() {
        // Pubblicata + ATTIVO -> VISIBILE
        assertTrue(
            "Attività pubblicata e socio ATTIVO deve essere visibile",
            sampleActivityMemberA.isVisibileInVetrina(MembershipStatus.ATTIVO)
        )

        // Pubblicata + IN_ATTESA -> NON VISIBILE
        assertFalse(
            "Attività pubblicata ma socio IN_ATTESA non deve essere visibile",
            sampleActivityMemberA.isVisibileInVetrina(MembershipStatus.IN_ATTESA)
        )

        // Pubblicata + SOSPESO -> NON VISIBILE
        assertFalse(
            "Attività pubblicata ma socio SOSPESO non deve essere visibile",
            sampleActivityMemberA.isVisibileInVetrina(MembershipStatus.SOSPESO)
        )

        // Pubblicata + RECEDUTO -> NON VISIBILE
        assertFalse(
            "Attività pubblicata ma socio RECEDUTO non deve essere visibile",
            sampleActivityMemberA.isVisibileInVetrina(MembershipStatus.RECEDUTO)
        )

        // Pubblicata + ESCLUSO -> NON VISIBILE
        assertFalse(
            "Attività pubblicata ma socio ESCLUSO non deve essere visibile",
            sampleActivityMemberA.isVisibileInVetrina(MembershipStatus.ESCLUSO)
        )

        // Bozza + ATTIVO -> NON VISIBILE
        val draftActivity = sampleActivityMemberA.copy(statoPubblicazione = PublicationStatus.BOZZA)
        assertFalse(
            "Attività in BOZZA anche con socio ATTIVO non deve essere visibile",
            draftActivity.isVisibileInVetrina(MembershipStatus.ATTIVO)
        )
    }
}
