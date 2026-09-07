package com.example.core.data

import com.example.core.model.AssociationInfo
import com.example.core.model.AuditLogEntry
import com.example.core.model.BusinessActivity
import com.example.core.model.CouncilMember
import com.example.core.model.CouncilResolutionDemo
import com.example.core.model.CouncilRuleItem
import com.example.core.model.Member
import com.example.core.model.MembershipStatus
import com.example.core.model.NonElettoCandidate
import com.example.core.model.ProjectDocument
import com.example.core.model.ProjectModule
import com.example.core.model.PublicationStatus
import kotlinx.coroutines.flow.StateFlow

/**
 * Contratto per l'accesso ai dati di Pro-Local.
 * Disaccoppia la UI dalla sorgente dati (in-memory per Fase 1/2, Room/Cloud per il futuro).
 */
interface ProLocalRepository {
    val associationInfo: StateFlow<AssociationInfo>
    val councilMembers: StateFlow<List<CouncilMember>>
    val eligibleCandidates: StateFlow<List<NonElettoCandidate>>
    val councilRules: StateFlow<List<CouncilRuleItem>>
    val councilResolutions: StateFlow<List<CouncilResolutionDemo>>
    val projectModules: StateFlow<List<ProjectModule>>
    val projectDocuments: StateFlow<List<ProjectDocument>>
    val auditLogs: StateFlow<List<AuditLogEntry>>

    // Dimension: Vetrina delle Attività dei Soci
    val members: StateFlow<List<Member>>
    val activities: StateFlow<List<BusinessActivity>>
    val currentSelectedMemberId: StateFlow<String>

    fun selectMember(memberId: String)
    fun getActivityById(id: String): BusinessActivity?
    fun getMemberById(id: String): Member?
    fun updateActivity(activity: BusinessActivity)
    fun requestPublication(activityId: String)
    fun updatePublicationStatus(activityId: String, newStatus: PublicationStatus, adminNotes: String = "")
    fun updateMemberStatus(memberId: String, newStatus: MembershipStatus)

    /**
     * Valuta una deliberazione del Consiglio applicando rigorosamente le regole definite:
     * - Maggioranza dei presenti
     * - In caso di parità, voto prevalente del Presidente
     */
    fun evaluateResolution(
        oggetto: String,
        presenti: Int,
        favorevoli: Int,
        contrari: Int,
        votoPresidenteFavorevole: Boolean
    ): CouncilResolutionDemo

    /**
     * Registra un'operazione nel registro di audit.
     */
    fun addAuditEntry(operatore: String, azione: String, modulo: String, dettagli: String, livello: String = "INFO")
}
