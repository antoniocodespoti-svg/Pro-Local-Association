package com.example

import com.example.core.data.DemoProLocalRepository
import com.example.core.model.DefinitionState
import com.example.core.model.InternalRole
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class ProLocalCouncilTest {

    private val repository = DemoProLocalRepository()

    @Test
    fun testFourApicalRolesElectedByAssembly() = runBlocking {
        val members = repository.councilMembers.first()
        val apicalMembers = members.filter { it.carica.isApicalRole }

        // Regola 1: Le 4 cariche interne (Presidente, Vicepresidente, Segretario, Tesoriere)
        assertEquals(4, apicalMembers.size)
        assertTrue(apicalMembers.any { it.carica == InternalRole.PRESIDENTE })
        assertTrue(apicalMembers.any { it.carica == InternalRole.VICE_PRESIDENTE })
        assertTrue(apicalMembers.any { it.carica == InternalRole.SEGRETARIO })
        assertTrue(apicalMembers.any { it.carica == InternalRole.TESORIERE })
    }

    @Test
    fun testMajorityApprovalRule() = runBlocking {
        // Regola 2: Deliberazioni approvate a maggioranza dei presenti
        // Es: 7 presenti, 4 favorevoli, 3 contrari -> Approvata
        val result = repository.evaluateResolution(
            oggetto = "Acquisto materiale promozionale",
            presenti = 7,
            favorevoli = 4,
            contrari = 3,
            votoPresidenteFavorevole = false // Anche se presidente contrario, maggioranza netta
        )

        assertTrue(result.approvata)
        assertTrue(result.notaDeliberazione.contains("maggioranza"))
    }

    @Test
    fun testTieBreakPresidentPrevalenceApproved() = runBlocking {
        // Regola 3: In parità prevale il voto del Presidente
        // Es: 6 presenti, 3 favorevoli, 3 contrari, Presidente FAVOREVOLE -> Approvata
        val result = repository.evaluateResolution(
            oggetto = "Adozione nuovo regolamento interno",
            presenti = 6,
            favorevoli = 3,
            contrari = 3,
            votoPresidenteFavorevole = true
        )

        assertTrue(result.approvata)
        assertTrue(result.notaDeliberazione.contains("voto prevalente del Presidente"))
    }

    @Test
    fun testTieBreakPresidentPrevalenceRejected() = runBlocking {
        // Regola 3: In parità con Presidente CONTRARIO -> Respinta
        val result = repository.evaluateResolution(
            oggetto = "Convenzione con ente terzo",
            presenti = 6,
            favorevoli = 3,
            contrari = 3,
            votoPresidenteFavorevole = false
        )

        assertFalse(result.approvata)
        assertTrue(result.notaDeliberazione.contains("respinta per voto prevalente del Presidente"))
    }

    @Test
    fun testSubentryRankingAvailable() = runBlocking {
        // Regola 4: Subentro del primo dei non eletti, previa accettazione
        val candidates = repository.eligibleCandidates.first()
        assertFalse(candidates.isEmpty())

        val firstNonEletto = candidates.minByOrNull { it.posizioneGraduatoria }
        assertNotNull(firstNonEletto)
        assertEquals(1, firstNonEletto?.posizioneGraduatoria)
    }

    @Test
    fun testExplicitDefinitionState() = runBlocking {
        val modules = repository.projectModules.first()
        // Tutti i moduli devono avere uno stato esplicito DEFINITO o DA DEFINIRE
        modules.forEach { module ->
            assertNotNull(module.statoDefinizione)
            assertTrue(
                module.statoDefinizione == DefinitionState.DEFINITO ||
                module.statoDefinizione == DefinitionState.DA_DEFINIRE
            )
        }
    }
}
