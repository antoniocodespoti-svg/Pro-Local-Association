package com.example

import com.example.core.data.DemoProLocalRepository
import com.example.core.model.ActivityCategory
import com.example.core.model.MembershipStatus
import com.example.core.model.PublicationStatus
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class ProLocalShowcaseTest {

    private lateinit var repository: DemoProLocalRepository

    @Before
    fun setUp() {
        repository = DemoProLocalRepository()
    }

    @Test
    fun testOnlyActiveMembersActivitiesVisibleInShowcase() = runBlocking {
        val activities = repository.activities.first()
        val members = repository.members.first()

        // Verifica che tutte le attività visibili appartengano a soci con stato ATTIVO
        val visibleActivities = activities.filter { act ->
            val member = members.find { it.id == act.memberId }
            act.isVisibileInVetrina(member?.statoAssociativo ?: MembershipStatus.SOSPESO)
        }

        // 5 attività iniziali visibili (su 6 totali caricate)
        assertEquals(5, visibleActivities.size)
        visibleActivities.forEach { act ->
            val member = members.find { it.id == act.memberId }
            assertEquals(MembershipStatus.ATTIVO, member?.statoAssociativo)
            assertEquals(PublicationStatus.PUBBLICATA, act.statoPubblicazione)
        }
    }

    @Test
    fun testSuspendedMemberActivityIsHiddenFromShowcase() = runBlocking {
        val activities = repository.activities.first()
        val members = repository.members.first()

        // Francesca Neri è inizialmente SOSPESO
        val francesca = members.find { it.id == "mem-06" }
        assertEquals(MembershipStatus.SOSPESO, francesca?.statoAssociativo)

        // La sua bottega ceramiche non deve essere visibile
        val ceramicheAct = activities.find { it.id == "act-06" }
        assertEquals(PublicationStatus.PUBBLICATA, ceramicheAct?.statoPubblicazione)

        val isVisible = ceramicheAct?.isVisibileInVetrina(francesca!!.statoAssociativo) ?: false
        assertFalse("L'attività di un socio sospeso non deve essere visibile", isVisible)
    }

    @Test
    fun testReactivatingMemberImmediatelyRestoresShowcaseVisibility() = runBlocking {
        // Riattivazione di Francesca Neri da SOSPESO a ATTIVO
        repository.updateMemberStatus("mem-06", MembershipStatus.ATTIVO)

        val updatedActivities = repository.activities.first()
        val updatedMembers = repository.members.first()

        val francesca = updatedMembers.find { it.id == "mem-06" }
        assertEquals(MembershipStatus.ATTIVO, francesca?.statoAssociativo)

        val ceramicheAct = updatedActivities.find { it.id == "act-06" }
        val isVisibleNow = ceramicheAct?.isVisibileInVetrina(francesca!!.statoAssociativo) ?: false
        assertTrue("Dopo la riattivazione del socio, l'attività deve risultare visibile", isVisibleNow)

        val visibleActivities = updatedActivities.filter { act ->
            val member = updatedMembers.find { it.id == act.memberId }
            act.isVisibileInVetrina(member?.statoAssociativo ?: MembershipStatus.SOSPESO)
        }
        assertEquals(6, visibleActivities.size)
    }

    @Test
    fun testSuspendingActiveMemberImmediatelyHidesActivity() = runBlocking {
        // Sospensione di Marco Rossi (mem-01, falegnameria act-01)
        repository.updateMemberStatus("mem-01", MembershipStatus.SOSPESO)

        val updatedActivities = repository.activities.first()
        val updatedMembers = repository.members.first()

        val marco = updatedMembers.find { it.id == "mem-01" }
        assertEquals(MembershipStatus.SOSPESO, marco?.statoAssociativo)

        val actMarco = updatedActivities.find { it.id == "act-01" }
        val isVisible = actMarco?.isVisibileInVetrina(marco!!.statoAssociativo) ?: false
        assertFalse("Dopo la sospensione, l'attività di Marco non deve essere visibile", isVisible)

        val visibleActivities = updatedActivities.filter { act ->
            val member = updatedMembers.find { it.id == act.memberId }
            act.isVisibileInVetrina(member?.statoAssociativo ?: MembershipStatus.SOSPESO)
        }
        assertEquals(4, visibleActivities.size)
    }

    @Test
    fun testPendingApprovalActivityNotVisibleUntilApproved() = runBlocking {
        val activities = repository.activities.first()
        val members = repository.members.first()

        // Davide Greco (mem-05) è ATTIVO ma la sua attività act-05 è IN_ATTESA_APPROVAZIONE
        val davide = members.find { it.id == "mem-05" }
        assertEquals(MembershipStatus.ATTIVO, davide?.statoAssociativo)

        val spazioOlistico = activities.find { it.id == "act-05" }
        assertEquals(PublicationStatus.IN_ATTESA_APPROVAZIONE, spazioOlistico?.statoPubblicazione)
        assertFalse(spazioOlistico!!.isVisibileInVetrina(davide!!.statoAssociativo))

        // Amministrazione approva l'attività
        repository.updatePublicationStatus("act-05", PublicationStatus.PUBBLICATA, "Verifica idoneità completata")

        val updatedActivities = repository.activities.first()
        val approvedAct = updatedActivities.find { it.id == "act-05" }
        assertEquals(PublicationStatus.PUBBLICATA, approvedAct?.statoPubblicazione)
        assertTrue("Dopo approvazione la scheda di Davide diventa visibile", approvedAct!!.isVisibileInVetrina(davide.statoAssociativo))
    }

    @Test
    fun testMemberCanUpdateOwnActivity() = runBlocking {
        val original = repository.activities.first().find { it.id == "act-01" }!!
        val modified = original.copy(
            nomeAttivita = "Bottega d'Arte e Restauro del Legno Roma Antica",
            localita = "Roma - Trastevere Storico"
        )
        repository.updateActivity(modified)

        val updated = repository.activities.first().find { it.id == "act-01" }
        assertEquals("Bottega d'Arte e Restauro del Legno Roma Antica", updated?.nomeAttivita)
        assertEquals("Roma - Trastevere Storico", updated?.localita)
    }

    @Test
    fun testPublicationRequestBlockedWhenMemberNotActive() = runBlocking {
        // Francesca Neri (mem-06) è SOSPESO. Impostiamo la sua attività a BOZZA
        repository.updatePublicationStatus("act-06", PublicationStatus.BOZZA, "In bozza per revisione")

        val actBozza = repository.activities.first().find { it.id == "act-06" }
        assertEquals(PublicationStatus.BOZZA, actBozza?.statoPubblicazione)

        // Il socio prova a richiedere la pubblicazione
        repository.requestPublication("act-06")

        // Lo stato deve rimanere BOZZA (non deve passare a IN_ATTESA_APPROVAZIONE)
        val actAfterAttempt = repository.activities.first().find { it.id == "act-06" }
        assertEquals(PublicationStatus.BOZZA, actAfterAttempt?.statoPubblicazione)

        // Deve essere registrata una voce di audit di sicurezza
        val logs = repository.auditLogs.first()
        assertTrue(logs.any { it.azione == "Richiesta Pubblicazione Respinta" && it.livello == "SICUREZZA" })
    }

    @Test
    fun testAuditRecordedOnAdministrativeActions() = runBlocking {
        val initialLogCount = repository.auditLogs.first().size

        // Azione amministrativa: sospensione attività
        repository.updatePublicationStatus("act-01", PublicationStatus.SOSPESA, "Sospesa per controlli amministrativi")

        val updatedLogs = repository.auditLogs.first()
        assertTrue(updatedLogs.size > initialLogCount)
        assertTrue(updatedLogs.any { it.azione == "Modifica Stato Pubblicazione" && it.dettagli.contains("act-01") || it.dettagli.contains("Bottega") })
    }
}
