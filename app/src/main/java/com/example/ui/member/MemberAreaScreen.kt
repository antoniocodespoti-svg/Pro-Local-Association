package com.example.ui.member

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.HourglassEmpty
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import com.example.core.model.ActivityCategory
import com.example.core.model.BusinessActivity
import com.example.core.model.Member
import com.example.core.model.MembershipStatus
import com.example.core.model.PublicationStatus
import com.example.ui.showcase.ActivityDetailSheet
import com.example.ui.theme.CivicBlue600
import com.example.ui.theme.CivicGold
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
import com.example.ui.theme.StatusPubblicataBorder
import com.example.ui.theme.StatusPubblicataText
import com.example.ui.theme.StatusSospesaBg
import com.example.ui.theme.StatusSospesaBorder
import com.example.ui.theme.StatusSospesaText
import kotlinx.coroutines.launch

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun MemberAreaScreen(
    repository: ProLocalRepository,
    onNavigateToShowcase: () -> Unit,
    modifier: Modifier = Modifier
) {
    val members by repository.members.collectAsState()
    val activities by repository.activities.collectAsState()
    val currentMemberId by repository.currentSelectedMemberId.collectAsState()

    val currentMember = members.find { it.id == currentMemberId } ?: members.first()
    val linkedActivity = activities.find { it.memberId == currentMember.id }

    var showPreviewSheet by remember { mutableStateOf(false) }
    var isMemberSelectorOpen by remember { mutableStateOf(false) }
    val snackbarHostState = remember { SnackbarHostState() }
    val coroutineScope = rememberCoroutineScope()

    // Campi modulo modifica attività
    var formNome by remember(linkedActivity?.id) { mutableStateOf(linkedActivity?.nomeAttivita ?: "") }
    var formCategoria by remember(linkedActivity?.id) { mutableStateOf(linkedActivity?.categoria ?: ActivityCategory.ARTIGIANATO_RESTAURO) }
    var formLocalita by remember(linkedActivity?.id) { mutableStateOf(linkedActivity?.localita ?: "") }
    var formDescrizioneBreve by remember(linkedActivity?.id) { mutableStateOf(linkedActivity?.descrizioneBreve ?: "") }
    var formDescrizioneCompleta by remember(linkedActivity?.id) { mutableStateOf(linkedActivity?.descrizioneCompleta ?: "") }
    var formServiziText by remember(linkedActivity?.id) {
        mutableStateOf(linkedActivity?.serviziOfferti?.joinToString(", ") ?: "")
    }
    var formTelefono by remember(linkedActivity?.id) { mutableStateOf(linkedActivity?.telefonoPubblico ?: "") }
    var formEmail by remember(linkedActivity?.id) { mutableStateOf(linkedActivity?.emailPubblica ?: "") }
    var formSitoWeb by remember(linkedActivity?.id) { mutableStateOf(linkedActivity?.sitoWeb ?: "") }
    var formOrari by remember(linkedActivity?.id) { mutableStateOf(linkedActivity?.orariApertura ?: "") }

    var isCategoryDropdownOpen by remember { mutableStateOf(false) }

    if (showPreviewSheet && linkedActivity != null) {
        ActivityDetailSheet(
            activity = linkedActivity.copy(
                nomeAttivita = formNome,
                categoria = formCategoria,
                localita = formLocalita,
                descrizioneBreve = formDescrizioneBreve,
                descrizioneCompleta = formDescrizioneCompleta,
                serviziOfferti = formServiziText.split(",").map { it.trim() }.filter { it.isNotBlank() },
                telefonoPubblico = formTelefono,
                emailPubblica = formEmail,
                sitoWeb = formSitoWeb,
                orariApertura = formOrari
            ),
            member = currentMember,
            onClose = { showPreviewSheet = false }
        )
        return
    }

    Box(modifier = modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Slate50)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
                .testTag("member_area_screen"),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Selettore Persona Dimostrativa
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Slate200),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Badge,
                                contentDescription = null,
                                tint = CivicNavy700,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Simulazione Accesso Socio",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Slate900
                            )
                        }

                        Box {
                            OutlinedButton(
                                onClick = { isMemberSelectorOpen = true },
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.testTag("btn_switch_member")
                            ) {
                                Text(
                                    text = "Cambia Socio Demo",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = CivicNavy700
                                )
                                Icon(imageVector = Icons.Default.ArrowDropDown, contentDescription = null)
                            }

                            DropdownMenu(
                                expanded = isMemberSelectorOpen,
                                onDismissRequest = { isMemberSelectorOpen = false }
                            ) {
                                members.forEach { m ->
                                    DropdownMenuItem(
                                        text = {
                                            Column {
                                                Text(
                                                    text = "${m.nomeCognome} (${m.codiceSocio})",
                                                    fontWeight = if (m.id == currentMember.id) FontWeight.Bold else FontWeight.Normal,
                                                    fontSize = 13.sp
                                                )
                                                Text(
                                                    text = "Stato: ${m.statoAssociativo.label}",
                                                    fontSize = 11.sp,
                                                    color = if (m.statoAssociativo == MembershipStatus.ATTIVO) StateDefinedGreen else StateToDefineAmber
                                                )
                                            }
                                        },
                                        onClick = {
                                            repository.selectMember(m.id)
                                            isMemberSelectorOpen = false
                                        }
                                    )
                                }
                            }
                        }
                    }

                    Text(
                        text = "Accesso dimostrativo attivo come '${currentMember.nomeCognome}'. Questa sezione permette di sperimentare l'esperienza del socio e il flusso di sottomissione della scheda.",
                        fontSize = 12.sp,
                        color = Slate600
                    )
                }
            }

            // Scheda Anagrafica e Stato Associativo
            Card(
                colors = CardDefaults.cardColors(containerColor = CivicNavy900),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = currentMember.nomeCognome,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = "Tessera: ${currentMember.codiceSocio} • Iscritto il: ${currentMember.dataIscrizione}",
                                fontSize = 12.sp,
                                color = Slate300
                            )
                        }

                        // Badge Stato Associativo
                        MembershipStatusBadge(status = currentMember.statoAssociativo)
                    }

                    HorizontalDivider(color = Slate800)

                    // Spiegazione Requisito Pubblicazione
                    if (currentMember.statoAssociativo == MembershipStatus.ATTIVO) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = StateDefinedGreen,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Posizione sociale in regola: puoi pubblicare e mantenere attiva la tua scheda nella vetrina.",
                                fontSize = 12.sp,
                                color = StateDefinedGreenBg
                            )
                        }
                    } else {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Warning,
                                contentDescription = null,
                                tint = StateToDefineAmber,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "ATTENZIONE: Lo stato '${currentMember.statoAssociativo.label}' blocca la visualizzazione pubblica della scheda nella vetrina.",
                                fontSize = 12.sp,
                                color = StateToDefineAmberBg
                            )
                        }
                    }
                }
            }

            // Scheda Attività e Stato di Pubblicazione
            if (linkedActivity == null) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = BorderStroke(1.dp, Slate200),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text(
                            text = "Nessuna attività associata a questo profilo",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate800
                        )
                        Text(
                            text = "In questa fase ogni socio ha una scheda attività collegata.",
                            fontSize = 12.sp,
                            color = Slate600
                        )
                    }
                }
            } else {
                // Banner Stato Pubblicazione Attività
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = BorderStroke(1.dp, Slate200),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Stato Scheda Vetrina",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = Slate900
                            )

                            PublicationStatusBadge(status = linkedActivity.statoPubblicazione)
                        }

                        // Spiegazione visibilità effettiva
                        val isEffectivelyVisible = linkedActivity.isVisibileInVetrina(currentMember.statoAssociativo)

                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = if (isEffectivelyVisible) StateDefinedGreenBg.copy(alpha = 0.5f) else StatusAttesaBg,
                            border = BorderStroke(1.dp, if (isEffectivelyVisible) StateDefinedGreen.copy(alpha = 0.3f) else StatusAttesaBorder),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = if (isEffectivelyVisible) Icons.Default.CheckCircle else Icons.Default.Info,
                                    contentDescription = null,
                                    tint = if (isEffectivelyVisible) StateDefinedGreen else StateToDefineAmber,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Column {
                                    Text(
                                        text = if (isEffectivelyVisible) "Visibile nella Vetrina Pubblica" else "Non Visibile al Pubblico",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isEffectivelyVisible) StateDefinedGreenText else StatusAttesaText
                                    )
                                    Text(
                                        text = when {
                                            !currentMember.statoAssociativo.canPublishActivity ->
                                                "Bloccata dalla regola fondamentale: il tuo stato associativo risulta '${currentMember.statoAssociativo.label}'."
                                            linkedActivity.statoPubblicazione == PublicationStatus.PUBBLICATA ->
                                                "La scheda è online e consultabile da tutti i visitatori."
                                            linkedActivity.statoPubblicazione == PublicationStatus.IN_ATTESA_APPROVAZIONE ->
                                                "In attesa di revisione e approvazione da parte dell'amministrazione Pro-Local."
                                            linkedActivity.statoPubblicazione == PublicationStatus.BOZZA ->
                                                "Scheda in bozza. Richiedi la pubblicazione quando hai completato la compilazione."
                                            else -> "Stato: ${linkedActivity.statoPubblicazione.label}. Note: ${linkedActivity.noteRevisioneAdmin}"
                                        },
                                        fontSize = 11.sp,
                                        color = Slate700
                                    )
                                }
                            }
                        }

                        if (linkedActivity.noteRevisioneAdmin.isNotBlank()) {
                            Text(
                                text = "Note amministrative: ${linkedActivity.noteRevisioneAdmin}",
                                fontSize = 11.sp,
                                color = Slate600
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            OutlinedButton(
                                onClick = { showPreviewSheet = true },
                                modifier = Modifier.weight(1f).testTag("btn_preview_activity")
                            ) {
                                Icon(imageVector = Icons.Default.Visibility, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Anteprima", fontSize = 12.sp)
                            }

                            if (linkedActivity.statoPubblicazione != PublicationStatus.PUBBLICATA &&
                                linkedActivity.statoPubblicazione != PublicationStatus.IN_ATTESA_APPROVAZIONE) {
                                Button(
                                    onClick = {
                                        if (!currentMember.statoAssociativo.canPublishActivity) {
                                            coroutineScope.launch {
                                                snackbarHostState.showSnackbar("Impossibile richiedere la pubblicazione: il tuo stato socio non è ATTIVO.")
                                            }
                                        } else {
                                            repository.requestPublication(linkedActivity.id)
                                            coroutineScope.launch {
                                                snackbarHostState.showSnackbar("Richiesta di pubblicazione inviata all'amministrazione!")
                                            }
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = CivicNavy700),
                                    modifier = Modifier.weight(1f).testTag("btn_request_publication")
                                ) {
                                    Icon(imageVector = Icons.Default.Send, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Richiedi Pubblicazione", fontSize = 11.sp)
                                }
                            }
                        }
                    }
                }

                // Modulo di Modifica Dati Scheda Attività
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = BorderStroke(1.dp, Slate200),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "Compila o Modifica Scheda Attività",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate900
                        )

                        // Nome Attività
                        OutlinedTextField(
                            value = formNome,
                            onValueChange = { formNome = it },
                            label = { Text("Nome Attività o Insegna") },
                            modifier = Modifier.fillMaxWidth().testTag("input_activity_name"),
                            singleLine = true
                        )

                        // Selezione Categoria
                        Box {
                            OutlinedTextField(
                                value = formCategoria.title,
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Categoria Settoriale") },
                                trailingIcon = {
                                    Icon(
                                        imageVector = Icons.Default.ArrowDropDown,
                                        contentDescription = null,
                                        modifier = Modifier.clickable { isCategoryDropdownOpen = true }
                                    )
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { isCategoryDropdownOpen = true }
                            )

                            DropdownMenu(
                                expanded = isCategoryDropdownOpen,
                                onDismissRequest = { isCategoryDropdownOpen = false }
                            ) {
                                ActivityCategory.values().forEach { cat ->
                                    DropdownMenuItem(
                                        text = { Text(cat.title, fontSize = 13.sp) },
                                        onClick = {
                                            formCategoria = cat
                                            isCategoryDropdownOpen = false
                                        }
                                    )
                                }
                            }
                        }

                        // Località e Zona
                        OutlinedTextField(
                            value = formLocalita,
                            onValueChange = { formLocalita = it },
                            label = { Text("Località / Quartiere (es: Roma - Rione Monti)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        // Descrizione Breve
                        OutlinedTextField(
                            value = formDescrizioneBreve,
                            onValueChange = { formDescrizioneBreve = it },
                            label = { Text("Descrizione Breve (presente nell'elenco vetrina)") },
                            modifier = Modifier.fillMaxWidth(),
                            maxLines = 3
                        )

                        // Descrizione Completa
                        OutlinedTextField(
                            value = formDescrizioneCompleta,
                            onValueChange = { formDescrizioneCompleta = it },
                            label = { Text("Presentazione Completa dell'Attività") },
                            modifier = Modifier.fillMaxWidth(),
                            minLines = 3,
                            maxLines = 6
                        )

                        // Servizi Offerti
                        OutlinedTextField(
                            value = formServiziText,
                            onValueChange = { formServiziText = it },
                            label = { Text("Servizi Offerti (separati da virgola)") },
                            modifier = Modifier.fillMaxWidth(),
                            maxLines = 3
                        )

                        // Contatti
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            OutlinedTextField(
                                value = formTelefono,
                                onValueChange = { formTelefono = it },
                                label = { Text("Telefono") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = formEmail,
                                onValueChange = { formEmail = it },
                                label = { Text("Email Pubblica") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                        }

                        OutlinedTextField(
                            value = formSitoWeb,
                            onValueChange = { formSitoWeb = it },
                            label = { Text("Sito Web Ufficiale (opzionale)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        OutlinedTextField(
                            value = formOrari,
                            onValueChange = { formOrari = it },
                            label = { Text("Orari di Apertura / Disponibilità") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Button(
                            onClick = {
                                val updatedActivity = linkedActivity.copy(
                                    nomeAttivita = formNome,
                                    categoria = formCategoria,
                                    localita = formLocalita,
                                    descrizioneBreve = formDescrizioneBreve,
                                    descrizioneCompleta = formDescrizioneCompleta,
                                    serviziOfferti = formServiziText.split(",").map { it.trim() }.filter { it.isNotBlank() },
                                    telefonoPubblico = formTelefono,
                                    emailPubblica = formEmail,
                                    sitoWeb = formSitoWeb,
                                    orariApertura = formOrari
                                )
                                repository.updateActivity(updatedActivity)
                                coroutineScope.launch {
                                    snackbarHostState.showSnackbar("Scheda attività salvata con successo!")
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = CivicNavy700),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                                .testTag("btn_save_activity_changes")
                        ) {
                            Icon(imageVector = Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Salva Modifiche Scheda", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier.align(Alignment.BottomCenter)
        )
    }
}

@Composable
fun MembershipStatusBadge(status: MembershipStatus) {
    val (bgColor, textColor, label) = when (status) {
        MembershipStatus.ATTIVO -> Triple(StateDefinedGreenBg, StateDefinedGreenText, status.label)
        MembershipStatus.IN_ATTESA -> Triple(StatusAttesaBg, StatusAttesaText, status.label)
        MembershipStatus.SOSPESO -> Triple(StatusSospesaBg, StatusSospesaText, status.label)
        MembershipStatus.RECEDUTO -> Triple(Slate200, Slate700, status.label)
    }

    Surface(
        shape = RoundedCornerShape(12.dp),
        color = bgColor,
        border = BorderStroke(1.dp, textColor.copy(alpha = 0.3f))
    ) {
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = textColor,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}

@Composable
fun PublicationStatusBadge(status: PublicationStatus) {
    val (bgColor, borderColor, textColor) = when (status) {
        PublicationStatus.PUBBLICATA -> Triple(StatusPubblicataBg, StatusPubblicataBorder, StatusPubblicataText)
        PublicationStatus.IN_ATTESA_APPROVAZIONE -> Triple(StatusAttesaBg, StatusAttesaBorder, StatusAttesaText)
        PublicationStatus.BOZZA -> Triple(Slate100, Slate300, Slate700)
        PublicationStatus.SOSPESA, PublicationStatus.RIFIUTATA -> Triple(StatusSospesaBg, StatusSospesaBorder, StatusSospesaText)
    }

    Surface(
        shape = RoundedCornerShape(12.dp),
        color = bgColor,
        border = BorderStroke(1.dp, borderColor)
    ) {
        Text(
            text = status.label,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = textColor,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}
