package com.example.ui.council

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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Gavel
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Stars
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.core.data.ProLocalRepository
import com.example.core.model.CouncilMember
import com.example.core.model.CouncilResolutionDemo
import com.example.core.model.CouncilRuleItem
import com.example.core.model.DefinitionState
import com.example.core.model.InternalRole
import com.example.core.model.NonElettoCandidate
import com.example.ui.components.DefinitionBadge
import com.example.ui.components.LegalNoticeBanner
import com.example.ui.components.SectionHeader
import com.example.ui.theme.CivicBlue600
import com.example.ui.theme.CivicNavy700
import com.example.ui.theme.CivicNavy900
import com.example.ui.theme.Slate100
import com.example.ui.theme.Slate200
import com.example.ui.theme.Slate400Label
import com.example.ui.theme.Slate500
import com.example.ui.theme.Slate600
import com.example.ui.theme.Slate700
import com.example.ui.theme.Slate900
import com.example.ui.theme.StateDefinedGreen
import com.example.ui.theme.StateDefinedGreenBg
import com.example.ui.theme.StateDefinedGreenText
import com.example.ui.theme.StateToDefineAmber
import com.example.ui.theme.StateToDefineAmberBg
import com.example.ui.theme.StateToDefineAmberText

@Composable
fun CouncilScreen(
    repository: ProLocalRepository,
    modifier: Modifier = Modifier
) {
    val councilMembers by repository.councilMembers.collectAsState()
    val councilRules by repository.councilRules.collectAsState()
    val candidates by repository.eligibleCandidates.collectAsState()
    val resolutions by repository.councilResolutions.collectAsState()

    var selectedTabIndex by remember { mutableIntStateOf(0) }
    val tabs = listOf("Cariche & Membri", "5 Regole Consiglio", "Simulatore Voto", "Subentri & Graduatoria")

    Column(modifier = modifier.fillMaxSize().testTag("council_screen")) {
        // Tab Row
        ScrollableTabRow(
            selectedTabIndex = selectedTabIndex,
            containerColor = MaterialTheme.colorScheme.surface,
            edgePadding = 16.dp,
            modifier = Modifier.fillMaxWidth().testTag("council_tab_row")
        ) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTabIndex == index,
                    onClick = { selectedTabIndex = index },
                    text = {
                        Text(
                            text = title,
                            fontWeight = if (selectedTabIndex == index) FontWeight.Bold else FontWeight.Medium,
                            fontSize = 13.sp
                        )
                    }
                )
            }
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                LegalNoticeBanner()
            }

            when (selectedTabIndex) {
                0 -> {
                    // Cariche interne e membri
                    item {
                        CouncilRolesHeader()
                    }
                    items(councilMembers) { member ->
                        CouncilMemberCard(member = member)
                    }
                }
                1 -> {
                    // Le 5 Regole definite
                    item {
                        SectionHeader(
                            title = "Regole di Funzionamento del Consiglio Direttivo",
                            subtitle = "Disciplina statutaria per adunanze, delibere, subentro e revoca"
                        )
                    }
                    items(councilRules) { rule ->
                        CouncilRuleCard(rule = rule)
                    }
                }
                2 -> {
                    // Simulatore deliberazioni
                    item {
                        CouncilVoteSimulator(
                            onEvaluate = { topic, pres, fav, cont, presFav ->
                                repository.evaluateResolution(topic, pres, fav, cont, presFav)
                            }
                        )
                    }
                    item {
                        SectionHeader(
                            title = "Storico Deliberazioni Consiglio (Dimostrative)",
                            subtitle = "Registro delle deliberazioni con esito e applicazione delle regole di maggioranza"
                        )
                    }
                    items(resolutions) { res ->
                        ResolutionItemCard(resolution = res)
                    }
                }
                3 -> {
                    // Subentri e Graduatoria
                    item {
                        SubentroExplanationCard()
                    }
                    item {
                        SectionHeader(
                            title = "Graduatoria Non Eletti (Assemblea)",
                            subtitle = "Ordine di subentro per vacanza cariche, subordinato ad accettazione"
                        )
                    }
                    items(candidates) { candidate ->
                        CandidateSubentroCard(candidate = candidate)
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

@Composable
private fun CouncilRolesHeader() {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, Slate200),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "Quattro Cariche Elette dall'Assemblea",
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = Slate900
                )
                DefinitionBadge(state = DefinitionState.DEFINITO)
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Regola consolidata: Le cariche di Presidente, Vicepresidente, Segretario e Tesoriere non vengono deliberate internamente al Consiglio ma sono elette direttamente dall'Assemblea plenaria.",
                fontSize = 12.sp,
                color = Slate600,
                lineHeight = 16.sp
            )
        }
    }
}

@Composable
private fun CouncilMemberCard(member: CouncilMember) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, if (member.carica.isApicalRole) CivicNavy700.copy(alpha = 0.3f) else Slate200),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth().testTag("member_card_${member.id}")
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(
                        if (member.carica.isApicalRole) CivicNavy700.copy(alpha = 0.12f) else Slate100,
                        CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (member.carica.isApicalRole) Icons.Default.Stars else Icons.Default.Person,
                    contentDescription = null,
                    tint = if (member.carica.isApicalRole) CivicNavy700 else Slate600,
                    modifier = Modifier.size(24.dp)
                )
            }
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = member.nomeCognome,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Slate900
                    )
                    Surface(
                        color = if (member.carica.isApicalRole) Color(0xFFDBEAFE) else Slate100,
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            text = member.carica.displayName,
                            color = if (member.carica.isApicalRole) Color(0xFF1E40AF) else Slate700,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.height(3.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "Data elezione: ${member.dataElezione}",
                        fontSize = 11.sp,
                        color = Slate500
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "• ${member.stato.label}",
                        fontSize = 11.sp,
                        color = StateDefinedGreen,
                        fontWeight = FontWeight.Medium
                    )
                }
                if (member.note.isNotBlank()) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = member.note,
                        fontSize = 11.sp,
                        color = Slate600
                    )
                }
            }
        }
    }
}

@Composable
private fun CouncilRuleCard(rule: CouncilRuleItem) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, Slate200),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth().testTag("rule_card_${rule.id}")
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = rule.titolo,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Slate900,
                    modifier = Modifier.weight(1f)
                )
                Spacer(modifier = Modifier.width(8.dp))
                DefinitionBadge(state = rule.stato)
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = rule.descrizione,
                fontSize = 13.sp,
                color = Slate700,
                lineHeight = 17.sp
            )
            Spacer(modifier = Modifier.height(10.dp))
            Surface(
                color = Slate100,
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(10.dp)) {
                    Text(
                        text = "Applicazione Software:",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Slate700
                    )
                    Text(
                        text = rule.applicazioneSoftware,
                        fontSize = 11.sp,
                        color = Slate600,
                        lineHeight = 15.sp
                    )
                }
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Nota di conformità: ${rule.notaLegale}",
                fontSize = 11.sp,
                color = Slate500,
                lineHeight = 14.sp
            )
        }
    }
}

@Composable
private fun CouncilVoteSimulator(
    onEvaluate: (String, Int, Int, Int, Boolean) -> CouncilResolutionDemo
) {
    var oggetto by remember { mutableStateOf("Approvazione bilancio preventivo anno in corso") }
    var presenti by remember { mutableIntStateOf(6) }
    var favorevoli by remember { mutableIntStateOf(3) }
    var contrari by remember { mutableIntStateOf(3) }
    var presidenteFavorevole by remember { mutableStateOf(true) }
    var lastResult by remember { mutableStateOf<CouncilResolutionDemo?>(null) }

    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, CivicBlue600.copy(alpha = 0.3f)),
        shape = RoundedCornerShape(14.dp),
        modifier = Modifier.fillMaxWidth().testTag("council_vote_simulator")
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "Simulatore Deliberazione Consiglio",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Slate900
                )
                DefinitionBadge(state = DefinitionState.DEFINITO)
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Verifica in tempo reale l'applicazione delle regole: approvazione a maggioranza dei presenti e voto prevalente del Presidente in parità.",
                fontSize = 12.sp,
                color = Slate600
            )

            Spacer(modifier = Modifier.height(14.dp))

            OutlinedTextField(
                value = oggetto,
                onValueChange = { oggetto = it },
                label = { Text("Oggetto della Deliberazione") },
                modifier = Modifier.fillMaxWidth().testTag("input_delibera_oggetto")
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                CounterField(
                    label = "Presenti",
                    value = presenti,
                    min = 1,
                    max = 15,
                    onValueChange = {
                        presenti = it
                        if (favorevoli + contrari > presenti) {
                            favorevoli = presenti / 2
                            contrari = presenti - favorevoli
                        }
                    },
                    modifier = Modifier.weight(1f)
                )
                CounterField(
                    label = "Favorevoli",
                    value = favorevoli,
                    min = 0,
                    max = presenti,
                    onValueChange = {
                        favorevoli = it
                        if (favorevoli + contrari > presenti) {
                            contrari = (presenti - favorevoli).coerceAtLeast(0)
                        }
                    },
                    modifier = Modifier.weight(1f)
                )
                CounterField(
                    label = "Contrari",
                    value = contrari,
                    min = 0,
                    max = presenti,
                    onValueChange = {
                        contrari = it
                        if (favorevoli + contrari > presenti) {
                            favorevoli = (presenti - contrari).coerceAtLeast(0)
                        }
                    },
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Surface(
                color = Slate100,
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.padding(12.dp)
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Voto espresso dal Presidente",
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 13.sp,
                            color = Slate900
                        )
                        Text(
                            text = if (presidenteFavorevole) "Favorevole (Decisivo in caso di parità)" else "Contrario / Non favorevole",
                            fontSize = 11.sp,
                            color = if (presidenteFavorevole) StateDefinedGreenText else Color(0xFFDC2626)
                        )
                    }
                    Switch(
                        checked = presidenteFavorevole,
                        onCheckedChange = { presidenteFavorevole = it },
                        modifier = Modifier.testTag("switch_president_vote")
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            Button(
                onClick = {
                    lastResult = onEvaluate(oggetto, presenti, favorevoli, contrari, presidenteFavorevole)
                },
                colors = ButtonDefaults.buttonColors(containerColor = CivicNavy700),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth().testTag("btn_evaluate_resolution")
            ) {
                Icon(imageVector = Icons.Default.Gavel, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text(text = "Esegui Calcolo & Registra Deliberazione", fontWeight = FontWeight.SemiBold)
            }

            // Risultato immediato
            lastResult?.let { res ->
                Spacer(modifier = Modifier.height(14.dp))
                Surface(
                    color = if (res.approvata) StateDefinedGreenBg else Color(0xFFFEE2E2),
                    shape = RoundedCornerShape(10.dp),
                    border = BorderStroke(1.dp, if (res.approvata) StateDefinedGreen else Color(0xFFDC2626)),
                    modifier = Modifier.fillMaxWidth().testTag("result_deliberazione")
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = "Esito: ${if (res.approvata) "DELIBERAZIONE APPROVATA" else "DELIBERAZIONE RESPINTA"}",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (res.approvata) StateDefinedGreenText else Color(0xFF991B1B)
                            )
                            Text(
                                text = res.numeroProtocollo,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Slate600
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = res.notaDeliberazione,
                            fontSize = 12.sp,
                            color = if (res.approvata) StateDefinedGreenText else Color(0xFF7F1D1D)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CounterField(
    label: String,
    value: Int,
    min: Int,
    max: Int,
    onValueChange: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        color = Slate100,
        shape = RoundedCornerShape(8.dp),
        modifier = modifier
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(vertical = 8.dp, horizontal = 4.dp)
        ) {
            Text(text = label, fontSize = 11.sp, color = Slate600, fontWeight = FontWeight.Medium)
            Text(text = "$value", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Slate900)
            Row {
                IconButton(
                    onClick = { if (value > min) onValueChange(value - 1) },
                    modifier = Modifier.size(28.dp)
                ) {
                    Text(text = "−", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Slate700)
                }
                IconButton(
                    onClick = { if (value < max) onValueChange(value + 1) },
                    modifier = Modifier.size(28.dp)
                ) {
                    Text(text = "+", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Slate700)
                }
            }
        }
    }
}

@Composable
private fun ResolutionItemCard(resolution: CouncilResolutionDemo) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, Slate200),
        shape = RoundedCornerShape(10.dp),
        modifier = Modifier.fillMaxWidth().testTag("res_card_${resolution.id}")
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "${resolution.numeroProtocollo} • ${resolution.data}",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Slate500
                )
                Surface(
                    color = if (resolution.approvata) StateDefinedGreenBg else Color(0xFFFEE2E2),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        text = if (resolution.approvata) "APPROVATA" else "RESPINTA",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (resolution.approvata) StateDefinedGreenText else Color(0xFF991B1B),
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = resolution.oggetto,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                color = Slate900
            )
            Spacer(modifier = Modifier.height(6.dp))
            Row(
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = "Presenti: ${resolution.presenti}", fontSize = 11.sp, color = Slate600)
                Text(text = "Favorevoli: ${resolution.favorevoli}", fontSize = 11.sp, color = StateDefinedGreen)
                Text(text = "Contrari: ${resolution.contrari}", fontSize = 11.sp, color = Color(0xFFDC2626))
                Text(text = "Astenuti: ${resolution.astenuti}", fontSize = 11.sp, color = Slate500)
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = resolution.notaDeliberazione,
                fontSize = 11.sp,
                color = Slate500,
                lineHeight = 14.sp
            )
        }
    }
}

@Composable
private fun SubentroExplanationCard() {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, Slate200),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "Regola del Subentro & Revoca",
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = Slate900
                )
                DefinitionBadge(state = DefinitionState.DEFINITO)
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "1. In caso di cessazione di un consigliere (dimissioni, decadenza, revoca), il subentro spetta di diritto al primo dei non eletti nella lista assembleare, ma è subordinato all'espressa accettazione dell'interessato.\n2. È prevista esplicita disciplina per la revoca del singolo consigliere (quorum e causali da armonizzare statutariamente).",
                fontSize = 12.sp,
                color = Slate700,
                lineHeight = 16.sp
            )
        }
    }
}

@Composable
private fun CandidateSubentroCard(candidate: NonElettoCandidate) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, Slate200),
        shape = RoundedCornerShape(10.dp),
        modifier = Modifier.fillMaxWidth().testTag("candidate_card_${candidate.posizioneGraduatoria}")
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                color = if (candidate.posizioneGraduatoria == 1) StateDefinedGreenBg else Slate100,
                shape = CircleShape,
                modifier = Modifier.size(36.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = "${candidate.posizioneGraduatoria}°",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (candidate.posizioneGraduatoria == 1) StateDefinedGreenText else Slate700
                    )
                }
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = candidate.nomeCognome,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = Slate900
                )
                Text(
                    text = "Voti assembleari ricevuti: ${candidate.votiRicevutiAssemblea}",
                    fontSize = 11.sp,
                    color = Slate600
                )
                Text(
                    text = "Stato subentro: ${candidate.statoSubentro}",
                    fontSize = 11.sp,
                    color = if (candidate.disponibileSubentro) StateDefinedGreenText else StateToDefineAmberText,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}
