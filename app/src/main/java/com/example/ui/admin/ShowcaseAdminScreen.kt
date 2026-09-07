package com.example.ui.admin

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.core.data.ProLocalRepository
import com.example.core.model.BusinessActivity
import com.example.core.model.Member
import com.example.core.model.MembershipStatus
import com.example.core.model.PublicationStatus
import com.example.ui.member.MembershipStatusBadge
import com.example.ui.member.PublicationStatusBadge
import com.example.ui.showcase.ActivityDetailSheet
import com.example.ui.showcase.getCategoryIcon
import com.example.ui.theme.CivicBlue600
import com.example.ui.theme.CivicGold
import com.example.ui.theme.CivicGoldBorder
import com.example.ui.theme.CivicGoldDark
import com.example.ui.theme.CivicGoldSurface
import com.example.ui.theme.CivicGoldText
import com.example.ui.theme.CivicNavy700
import com.example.ui.theme.CivicNavy800
import com.example.ui.theme.CivicNavy900
import com.example.ui.theme.Slate100
import com.example.ui.theme.Slate200
import com.example.ui.theme.Slate300
import com.example.ui.theme.Slate50
import com.example.ui.theme.Slate500
import com.example.ui.theme.Slate600
import com.example.ui.theme.Slate700
import com.example.ui.theme.Slate800
import com.example.ui.theme.Slate900
import com.example.ui.theme.StateDefinedGreen
import com.example.ui.theme.StateDefinedGreenBg
import com.example.ui.theme.StateDefinedGreenText
import com.example.ui.theme.StateToDefineAmber
import com.example.ui.theme.StateToDefineAmberBg
import com.example.ui.theme.StateToDefineAmberText
import com.example.ui.theme.StatusAttesaBg
import com.example.ui.theme.StatusAttesaBorder
import com.example.ui.theme.StatusAttesaText
import com.example.ui.theme.StatusPubblicataBg
import com.example.ui.theme.StatusSospesaBg
import com.example.ui.theme.StatusSospesaText
import kotlinx.coroutines.launch

@Composable
fun ShowcaseAdminScreen(
    repository: ProLocalRepository,
    onNavigateToShowcase: () -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf(
        "Revisione Vetrina",
        "Registro Soci & Stato",
        "Ruoli & Permessi",
        "Registro Audit"
    )

    val activities by repository.activities.collectAsState()
    val members by repository.members.collectAsState()
    val auditLogs by repository.auditLogs.collectAsState()

    var previewActivity by remember { mutableStateOf<BusinessActivity?>(null) }
    val snackbarHostState = remember { SnackbarHostState() }
    val coroutineScope = rememberCoroutineScope()

    if (previewActivity != null) {
        val member = members.find { it.id == previewActivity!!.memberId }
        ActivityDetailSheet(
            activity = previewActivity!!,
            member = member,
            onClose = { previewActivity = null }
        )
        return
    }

    Box(modifier = modifier.fillMaxSize().testTag("admin_screen")) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Slate50)
        ) {
            // Header Amministrazione Istituzionale
            Surface(
                color = CivicNavy900,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.AdminPanelSettings,
                                contentDescription = null,
                                tint = CivicGold,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Amministrazione & Vigilanza Pro-Local",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }

                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = CivicGoldSurface,
                            border = BorderStroke(1.dp, CivicGoldBorder)
                        ) {
                            Text(
                                text = "Fase 2: Vetrina & Soci",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = CivicGoldText,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                            )
                        }
                    }

                    Text(
                        text = "Gestione delle pubblicazioni, controllo dello stato dei soci e applicazione immediata delle regole di conformità statutaria.",
                        fontSize = 12.sp,
                        color = Slate300
                    )
                }
            }

            // Tab Navigation
            ScrollableTabRow(
                selectedTabIndex = selectedTab,
                containerColor = Color.White,
                contentColor = CivicNavy700,
                edgePadding = 16.dp
            ) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = {
                            Text(
                                text = title,
                                fontSize = 12.sp,
                                fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Medium
                            )
                        }
                    )
                }
            }

            // Contenuto per Tab
            when (selectedTab) {
                0 -> AdminActivitiesQueueTab(
                    activities = activities,
                    members = members,
                    onApprove = { actId ->
                        repository.updatePublicationStatus(actId, PublicationStatus.PUBBLICATA, "Approvata da amministrazione Pro-Local")
                        coroutineScope.launch { snackbarHostState.showSnackbar("Attività approvata e pubblicata!") }
                    },
                    onSuspend = { actId ->
                        repository.updatePublicationStatus(actId, PublicationStatus.SOSPESA, "Sospesa dall'amministrazione per verifica")
                        coroutineScope.launch { snackbarHostState.showSnackbar("Attività sospesa!") }
                    },
                    onSetDraft = { actId ->
                        repository.updatePublicationStatus(actId, PublicationStatus.BOZZA, "Rimandata in bozza al socio per integrazioni")
                        coroutineScope.launch { snackbarHostState.showSnackbar("Scheda rimandata al socio in bozza!") }
                    },
                    onPreview = { previewActivity = it }
                )
                1 -> AdminMembersManagementTab(
                    members = members,
                    activities = activities,
                    onUpdateStatus = { memberId, newStatus ->
                        repository.updateMemberStatus(memberId, newStatus)
                        coroutineScope.launch {
                            snackbarHostState.showSnackbar("Stato socio aggiornato a ${newStatus.label}!")
                        }
                    }
                )
                2 -> AdminRolesTab()
                3 -> AdminAuditLogsTab(auditLogs = auditLogs)
            }
        }

        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier.align(Alignment.BottomCenter)
        )
    }
}

/**
 * Tab 1: Coda di Revisione delle Attività dei Soci
 */
@Composable
private fun AdminActivitiesQueueTab(
    activities: List<BusinessActivity>,
    members: List<Member>,
    onApprove: (String) -> Unit,
    onSuspend: (String) -> Unit,
    onSetDraft: (String) -> Unit,
    onPreview: (BusinessActivity) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Banner Regola e Impatto Immediato
        item {
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = StatusAttesaBg,
                border = BorderStroke(1.dp, StatusAttesaBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = StateToDefineAmber,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = "Regola Fondamentale di Visibilità",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = StatusAttesaText
                        )
                        Text(
                            text = "Un'attività può essere effettivamente visibile in Vetrina SOLO se marcata PUBBLICATA ed il socio risulta ATTIVO. Se il socio viene sospeso, la scheda viene oscurata automaticamente.",
                            fontSize = 11.sp,
                            color = Slate700,
                            lineHeight = 16.sp
                        )
                    }
                }
            }
        }

        items(activities) { activity ->
            val member = members.find { it.id == activity.memberId }
            val isEffectivelyVisible = member != null && activity.isVisibileInVetrina(member.statoAssociativo)

            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Slate200),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth().testTag("admin_activity_item_${activity.id}")
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Intestazione con badge stato pubblicazione e visibilità
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = activity.nomeAttivita,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Slate900
                            )
                            Text(
                                text = "${activity.categoria.title} • ${activity.localita}",
                                fontSize = 11.sp,
                                color = Slate500
                            )
                        }

                        PublicationStatusBadge(status = activity.statoPubblicazione)
                    }

                    // Dati Socio Collegato
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = Slate100,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Socio: ${member?.nomeCognome ?: "Non trovato"} (${member?.codiceSocio ?: "N/D"})",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Slate900
                                )
                                Text(
                                    text = "Stato associativo: ${member?.statoAssociativo?.label ?: "N/D"}",
                                    fontSize = 11.sp,
                                    color = if (member?.statoAssociativo == MembershipStatus.ATTIVO) StateDefinedGreen else StatusSospesaText
                                )
                            }

                            // Visibilità effettiva badge
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = if (isEffectivelyVisible) StateDefinedGreenBg else StatusSospesaBg
                            ) {
                                Text(
                                    text = if (isEffectivelyVisible) "VISIBILE IN VETRINA" else "OSCURATA AL PUBBLICO",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isEffectivelyVisible) StateDefinedGreenText else StatusSospesaText,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                                )
                            }
                        }
                    }

                    if (activity.noteRevisioneAdmin.isNotBlank()) {
                        Text(
                            text = "Note: ${activity.noteRevisioneAdmin}",
                            fontSize = 11.sp,
                            color = Slate600
                        )
                    }

                    HorizontalDivider(color = Slate100)

                    // Pulsanti di Azione Amministrativa
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = { onPreview(activity) },
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Dettagli", fontSize = 11.sp)
                        }

                        if (activity.statoPubblicazione != PublicationStatus.PUBBLICATA) {
                            Button(
                                onClick = { onApprove(activity.id) },
                                colors = ButtonDefaults.buttonColors(containerColor = StateDefinedGreen),
                                shape = RoundedCornerShape(6.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(imageVector = Icons.Default.Check, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Approva", fontSize = 11.sp)
                            }
                        } else {
                            OutlinedButton(
                                onClick = { onSuspend(activity.id) },
                                shape = RoundedCornerShape(6.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(imageVector = Icons.Default.Pause, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Sospendi", fontSize = 11.sp, color = StatusSospesaText)
                            }
                        }

                        OutlinedButton(
                            onClick = { onSetDraft(activity.id) },
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Bozza", fontSize = 11.sp, color = Slate700)
                        }
                    }
                }
            }
        }
    }
}

/**
 * Tab 2: Registro Soci e Variazione Stato Associativo
 */
@Composable
private fun AdminMembersManagementTab(
    members: List<Member>,
    activities: List<BusinessActivity>,
    onUpdateStatus: (String, MembershipStatus) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CivicNavy800),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = "Libro Soci e Controllo Visibilità Diretta",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = "Modifica lo stato associativo di un socio per testare in tempo reale l'impatto sulla pubblicazione della sua attività. Se imposti uno stato 'Sospeso', l'attività scompare all'istante dalla vetrina.",
                        fontSize = 12.sp,
                        color = Slate200,
                        lineHeight = 16.sp
                    )
                }
            }
        }

        items(members) { member ->
            val linkedActivity = activities.find { it.memberId == member.id }
            var isMenuOpen by remember { mutableStateOf(false) }

            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Slate200),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth().testTag("member_card_${member.id}")
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = member.nomeCognome,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = Slate900
                            )
                            Text(
                                text = "Tessera: ${member.codiceSocio} • Iscritto il: ${member.dataIscrizione}",
                                fontSize = 11.sp,
                                color = Slate500
                            )
                        }

                        MembershipStatusBadge(status = member.statoAssociativo)
                    }

                    if (linkedActivity != null) {
                        Text(
                            text = "Attività collegata: ${linkedActivity.nomeAttivita} (${linkedActivity.statoPubblicazione.label})",
                            fontSize = 12.sp,
                            color = Slate700
                        )
                    }

                    Text(
                        text = "Note: ${member.noteAmministrativeInterne}",
                        fontSize = 11.sp,
                        color = Slate500
                    )

                    HorizontalDivider(color = Slate100)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = if (member.quotaSocialeInRegola) "Quota annuale: IN REGOLA" else "Quota: DA REGOLARIZZARE",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (member.quotaSocialeInRegola) StateDefinedGreenText else StatusSospesaText
                        )

                        Box {
                            Button(
                                onClick = { isMenuOpen = true },
                                colors = ButtonDefaults.buttonColors(containerColor = CivicNavy700),
                                shape = RoundedCornerShape(6.dp),
                                modifier = Modifier.testTag("btn_change_status_${member.id}")
                            ) {
                                Text("Modifica Stato", fontSize = 11.sp)
                            }

                            DropdownMenu(
                                expanded = isMenuOpen,
                                onDismissRequest = { isMenuOpen = false }
                            ) {
                                MembershipStatus.values().forEach { st ->
                                    DropdownMenuItem(
                                        text = {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                if (st == member.statoAssociativo) {
                                                    Icon(imageVector = Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp))
                                                    Spacer(modifier = Modifier.width(6.dp))
                                                }
                                                Text(st.label, fontSize = 13.sp)
                                            }
                                        },
                                        onClick = {
                                            onUpdateStatus(member.id, st)
                                            isMenuOpen = false
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * Tab 3: Ruoli e Permessi Amministrativi
 */
@Composable
private fun AdminRolesTab() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = BorderStroke(1.dp, Slate200),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = "Matrice Funzionale dei Ruoli e Permessi",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = Slate900
                )
                Text(
                    text = "Predisposizione tecnica dell'architettura RBAC (Role-Based Access Control) per la futura iscrizione al RUNTS e gestione multi-operatore:",
                    fontSize = 12.sp,
                    color = Slate600
                )

                RolePermissionItem(
                    ruolo = "Visitatore Pubblico",
                    permessi = "Ricerca in vetrina, visualizzazione schede pubbliche, consultazione recapiti e informazioni legali associazione.",
                    stato = "DEFINITO"
                )

                RolePermissionItem(
                    ruolo = "Socio Ordinario Pro-Local",
                    permessi = "Accesso all'Area Riservata Socio, compilazione e modifica scheda della propria attività, richiesta formale di pubblicazione.",
                    stato = "DEFINITO"
                )

                RolePermissionItem(
                    ruolo = "Segreteria / Amministrazione",
                    permessi = "Verifica stato associativo, approvazione e sospensione schede attività, registrazione nel registro di audit.",
                    stato = "DEFINITO"
                )

                RolePermissionItem(
                    ruolo = "Consiglio Direttivo",
                    permessi = "Deliberazione su ammissione nuovi soci, revoca consiglieri, approvazione regolamenti interni.",
                    stato = "DEFINITO"
                )

                RolePermissionItem(
                    ruolo = "Amministratore di Sistema (Superadmin)",
                    permessi = "Gestione tecnica infrastruttura, backup, configurazione chiavi e predisposizione RUNTS.",
                    stato = "DA DEFINIRE"
                )
            }
        }
    }
}

@Composable
private fun RolePermissionItem(
    ruolo: String,
    permessi: String,
    stato: String
) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = Slate50,
        border = BorderStroke(1.dp, Slate200),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = ruolo, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Slate900)
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = if (stato == "DEFINITO") StateDefinedGreenBg else StateToDefineAmberBg
                ) {
                    Text(
                        text = stato,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (stato == "DEFINITO") StateDefinedGreenText else StateToDefineAmberText,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }
            Text(text = permessi, fontSize = 11.sp, color = Slate600, lineHeight = 16.sp)
        }
    }
}

/**
 * Tab 4: Audit Logs
 */
@Composable
private fun AdminAuditLogsTab(
    auditLogs: List<com.example.core.model.AuditLogEntry>
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        items(auditLogs) { log ->
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Slate200),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = log.azione, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Slate900)
                        Text(text = log.timestamp, fontSize = 11.sp, color = Slate500)
                    }
                    Text(
                        text = "Operatore: ${log.operatoreRuolo} • Modulo: ${log.moduloCoinvolto}",
                        fontSize = 11.sp,
                        color = Slate600
                    )
                    Text(text = log.dettagli, fontSize = 12.sp, color = Slate800)
                }
            }
        }
    }
}
