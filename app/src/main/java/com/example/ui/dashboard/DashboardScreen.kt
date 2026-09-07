package com.example.ui.dashboard

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Gavel
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.HourglassEmpty
import androidx.compose.material.icons.filled.HowToVote
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.core.data.ProLocalRepository
import com.example.core.model.AuditLogEntry
import com.example.core.model.DefinitionState
import com.example.core.model.ModuleKey
import com.example.ui.components.DefinitionBadge
import com.example.ui.components.LegalNoticeBanner
import com.example.ui.components.SectionHeader
import com.example.ui.components.StatCard
import com.example.ui.theme.CivicBlue600
import com.example.ui.theme.CivicNavy700
import com.example.ui.theme.CivicNavy900
import com.example.ui.theme.Slate100
import com.example.ui.theme.Slate200
import com.example.ui.theme.Slate300
import com.example.ui.theme.Slate400Label
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

@Composable
fun DashboardScreen(
    repository: ProLocalRepository,
    onNavigateToModule: (ModuleKey) -> Unit,
    modifier: Modifier = Modifier
) {
    val associationInfo by repository.associationInfo.collectAsState()
    val councilMembers by repository.councilMembers.collectAsState()
    val modules by repository.projectModules.collectAsState()
    val auditLogs by repository.auditLogs.collectAsState()

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .testTag("dashboard_screen"),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Banner Principale Istituzionale
        item {
            AssociationBanner(
                denominazione = associationInfo.denominazione,
                natura = associationInfo.naturaGiuridica,
                statoRunts = associationInfo.statoRunts,
                onExploreDocs = { onNavigateToModule(ModuleKey.DOCUMENTAZIONE) }
            )
        }

        // Avviso normativo
        item {
            LegalNoticeBanner()
        }

        // Metriche Chiave
        item {
            SectionHeader(
                title = "Stato di Governance",
                subtitle = "Indicatori sintetici della struttura associativa e del Consiglio"
            )
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    title = "Cariche Elette",
                    value = "4 / 4",
                    subtitle = "Elette dall'Assemblea",
                    icon = Icons.Default.Gavel,
                    iconTint = CivicNavy700,
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Consiglio Attivo",
                    value = "${councilMembers.size}",
                    subtitle = "Consiglieri in carica",
                    icon = Icons.Default.Groups,
                    iconTint = CivicBlue600,
                    modifier = Modifier.weight(1f)
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    title = "Associati (Demo)",
                    value = "${associationInfo.numeroAssociatiDemo}",
                    subtitle = "Dati non reali",
                    icon = Icons.Default.People,
                    iconTint = StateDefinedGreen,
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Documenti Progetto",
                    value = "7 Sezioni",
                    subtitle = "Pronte per GitHub",
                    icon = Icons.Default.MenuBook,
                    iconTint = StateToDefineAmber,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // Quadro Regole del Consiglio [DEFINITO]
        item {
            CouncilRulesSummaryCard(
                onGoToCouncil = { onNavigateToModule(ModuleKey.CONSIGLIO) }
            )
        }

        // Tracciamento Requisiti: DEFINITI vs DA DEFINIRE
        item {
            RequirementsBreakdownCard(
                onViewDocs = { onNavigateToModule(ModuleKey.DOCUMENTAZIONE) }
            )
        }

        // Panoramica Moduli Futuri
        item {
            SectionHeader(
                title = "Moduli di Pro-Local",
                subtitle = "Architettura predisposta per le fasi successive del progetto"
            )
            Spacer(modifier = Modifier.height(8.dp))
        }

        items(modules) { module ->
            ModuleOverviewCard(
                title = module.titolo,
                subtitle = module.sottotitolo,
                state = module.statoDefinizione,
                definedCount = module.elementiDefiniti.size,
                toDefineCount = module.elementiDaDefinire.size,
                onClick = { onNavigateToModule(module.key) }
            )
        }

        // Audit Log Dimostrativo
        item {
            SectionHeader(
                title = "Registro Operazioni (Audit Trail)",
                subtitle = "Predisposizione per la tracciabilità delle azioni amministrative"
            )
            Spacer(modifier = Modifier.height(8.dp))
            AuditLogCard(auditLogs = auditLogs.take(5))
        }

        // Spaziatore finale per evitare sovrapposizioni con insets
        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun AssociationBanner(
    denominazione: String,
    natura: String,
    statoRunts: String,
    onExploreDocs: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = CivicNavy900),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth().testTag("association_banner")
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Surface(
                    color = CivicBlue600.copy(alpha = 0.2f),
                    shape = RoundedCornerShape(8.dp),
                    border = BorderStroke(1.dp, CivicBlue600.copy(alpha = 0.4f))
                ) {
                    Text(
                        text = "FASE 1 - BASE MODULARE",
                        color = Color(0xFF93C5FD),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.6.sp,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
                Icon(
                    imageVector = Icons.Default.AccountBalance,
                    contentDescription = null,
                    tint = Color(0xFF93C5FD),
                    modifier = Modifier.size(24.dp)
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                text = "Pro-Local",
                fontSize = 26.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color.White
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Piattaforma digitale per la gestione e la democrazia associativa",
                fontSize = 14.sp,
                color = Slate300
            )

            Spacer(modifier = Modifier.height(14.dp))
            HorizontalDivider(color = Slate700)
            Spacer(modifier = Modifier.height(14.dp))

            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "Natura Giuridica: ",
                        fontSize = 12.sp,
                        color = Slate400Label,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = natura,
                        fontSize = 12.sp,
                        color = Color.White,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "Stato RUNTS: ",
                        fontSize = 12.sp,
                        color = Slate400Label,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = statoRunts,
                        fontSize = 12.sp,
                        color = Color(0xFFFDE68A),
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = onExploreDocs,
                colors = ButtonDefaults.buttonColors(containerColor = CivicBlue600),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth().testTag("btn_explore_docs")
            ) {
                Icon(
                    imageVector = Icons.Default.MenuBook,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Consulta Documentazione Integrale (7 Categorie)",
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 13.sp
                )
            }
        }
    }
}

@Composable
private fun CouncilRulesSummaryCard(
    onGoToCouncil: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, Slate200),
        shape = RoundedCornerShape(14.dp),
        modifier = Modifier.fillMaxWidth().testTag("card_council_rules_summary")
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(StateDefinedGreenBg, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Gavel,
                            contentDescription = null,
                            tint = StateDefinedGreenText,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = "Regole Definite per il Consiglio",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = Slate900
                        )
                        Text(
                            text = "Requisiti consolidati vincolanti di progetto",
                            fontSize = 12.sp,
                            color = Slate500
                        )
                    }
                }
                DefinitionBadge(state = DefinitionState.DEFINITO)
            }

            Spacer(modifier = Modifier.height(14.dp))

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                RuleBullet(
                    number = "1",
                    title = "4 Cariche interne elette direttamente dall'Assemblea",
                    desc = "Presidente, Vicepresidente, Segretario e Tesoriere eletti dai soci."
                )
                RuleBullet(
                    number = "2",
                    title = "Deliberazioni a maggioranza dei presenti",
                    desc = "Il quorum deliberativo si calcola sui consiglieri presenti alla seduta."
                )
                RuleBullet(
                    number = "3",
                    title = "In parità prevale il voto del Presidente",
                    desc = "Casting vote attribuito al Presidente in caso di voti pari."
                )
                RuleBullet(
                    number = "4",
                    title = "Subentro del primo dei non eletti",
                    desc = "In caso di cessazione, previo consenso dell'interessato."
                )
                RuleBullet(
                    number = "5",
                    title = "Disciplina per la revoca del consigliere",
                    desc = "Procedura formale per la revoca del singolo componente."
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            OutlinedButton(
                onClick = onGoToCouncil,
                shape = RoundedCornerShape(8.dp),
                border = BorderStroke(1.dp, CivicNavy700),
                modifier = Modifier.fillMaxWidth().testTag("btn_go_to_council")
            ) {
                Text(
                    text = "Apri Dettaglio Consiglio & Simulatore Voto",
                    color = CivicNavy700,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 13.sp
                )
                Spacer(modifier = Modifier.width(6.dp))
                Icon(
                    imageVector = Icons.Default.ArrowForward,
                    contentDescription = null,
                    tint = CivicNavy700,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

@Composable
private fun RuleBullet(number: String, title: String, desc: String) {
    Row(
        verticalAlignment = Alignment.Top,
        modifier = Modifier.fillMaxWidth()
    ) {
        Surface(
            color = Slate100,
            shape = CircleShape,
            modifier = Modifier.size(20.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text(
                    text = number,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Slate700
                )
            }
        }
        Spacer(modifier = Modifier.width(10.dp))
        Column {
            Text(
                text = title,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                color = Slate900
            )
            Text(
                text = desc,
                fontSize = 12.sp,
                color = Slate600,
                lineHeight = 16.sp
            )
        }
    }
}

@Composable
private fun RequirementsBreakdownCard(onViewDocs: () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, Slate200),
        shape = RoundedCornerShape(14.dp),
        modifier = Modifier.fillMaxWidth().testTag("card_requirements_breakdown")
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Text(
                text = "Principio Fondamentale: Trasparenza dei Requisiti",
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                color = Slate900
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Nessuna funzionalità o regola viene inventata. Le aree non ancora deliberate sono esplicitamente classificate DA DEFINIRE.",
                fontSize = 12.sp,
                color = Slate600
            )

            Spacer(modifier = Modifier.height(14.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Surface(
                    color = StateDefinedGreenBg,
                    shape = RoundedCornerShape(8.dp),
                    border = BorderStroke(1.dp, StateDefinedGreen.copy(alpha = 0.3f)),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = StateDefinedGreenText,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "DEFINITO",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = StateDefinedGreenText
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "5 Regole Consiglio",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = StateDefinedGreenText
                        )
                        Text(
                            text = "4 cariche, voto a maggioranza, parità col Presidente, subentro, revoca",
                            fontSize = 11.sp,
                            color = StateDefinedGreenText.copy(alpha = 0.85f),
                            lineHeight = 14.sp
                        )
                    }
                }

                Surface(
                    color = StateToDefineAmberBg,
                    shape = RoundedCornerShape(8.dp),
                    border = BorderStroke(1.dp, StateToDefineAmber.copy(alpha = 0.3f)),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.HourglassEmpty,
                                contentDescription = null,
                                tint = StateToDefineAmberText,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "DA DEFINIRE",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = StateToDefineAmberText
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Statuto & Dettagli",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = StateToDefineAmberText
                        )
                        Text(
                            text = "Ammissione soci, quorum assembleari, termini accettazione subentro",
                            fontSize = 11.sp,
                            color = StateToDefineAmberText.copy(alpha = 0.85f),
                            lineHeight = 14.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ModuleOverviewCard(
    title: String,
    subtitle: String,
    state: DefinitionState,
    definedCount: Int,
    toDefineCount: Int,
    onClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, Slate200),
        shape = RoundedCornerShape(12.dp),
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().testTag("module_card_${title.lowercase().replace(" ", "_")}")
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = title,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = Slate900
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    DefinitionBadge(state = state)
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = subtitle,
                    fontSize = 12.sp,
                    color = Slate600
                )
                Spacer(modifier = Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (definedCount > 0) {
                        Text(
                            text = "✓ $definedCount elementi definiti",
                            fontSize = 11.sp,
                            color = StateDefinedGreen,
                            fontWeight = FontWeight.Medium
                        )
                    }
                    if (toDefineCount > 0) {
                        Text(
                            text = "⏳ $toDefineCount da definire",
                            fontSize = 11.sp,
                            color = StateToDefineAmber,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
            Icon(
                imageVector = Icons.Default.ArrowForward,
                contentDescription = "Visualizza modulo",
                tint = Slate400Label,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}

@Composable
private fun AuditLogCard(auditLogs: List<AuditLogEntry>) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, Slate200),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth().testTag("card_audit_log")
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            auditLogs.forEachIndexed { index, entry ->
                Row(
                    verticalAlignment = Alignment.Top,
                    modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.History,
                        contentDescription = null,
                        tint = CivicBlue600,
                        modifier = Modifier.size(16.dp).padding(top = 2.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = entry.azione,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Slate900
                            )
                            Text(
                                text = entry.timestamp,
                                fontSize = 10.sp,
                                color = Slate500
                            )
                        }
                        Text(
                            text = "${entry.operatoreRuolo} • Modulo: ${entry.moduloCoinvolto}",
                            fontSize = 11.sp,
                            color = Slate600
                        )
                        Text(
                            text = entry.dettagli,
                            fontSize = 11.sp,
                            color = Slate500,
                            lineHeight = 14.sp
                        )
                    }
                }
                if (index < auditLogs.size - 1) {
                    HorizontalDivider(color = Slate100, modifier = Modifier.padding(vertical = 4.dp))
                }
            }
        }
    }
}
