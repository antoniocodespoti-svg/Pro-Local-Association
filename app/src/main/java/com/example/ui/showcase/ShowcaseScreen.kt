package com.example.ui.showcase

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
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
import com.example.core.model.ActivityCategory
import com.example.core.model.BusinessActivity
import com.example.core.model.Member
import com.example.core.model.MembershipStatus
import com.example.core.model.ModuleKey
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

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ShowcaseScreen(
    repository: ProLocalRepository,
    onNavigateToMemberArea: () -> Unit,
    onNavigateToAdmin: () -> Unit,
    modifier: Modifier = Modifier
) {
    val activities by repository.activities.collectAsState()
    val members by repository.members.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf<ActivityCategory?>(null) }
    var selectedLocality by remember { mutableStateOf<String?>(null) }
    var selectedActivityForDetail by remember { mutableStateOf<BusinessActivity?>(null) }

    // Se è aperta la scheda dettaglio, mostra ActivityDetailSheet se ancora visibile
    if (selectedActivityForDetail != null) {
        val detailActivity = activities.find { it.id == selectedActivityForDetail!!.id } ?: selectedActivityForDetail!!
        val member = members.find { it.id == detailActivity.memberId }
        val isStillVisible = member != null && detailActivity.isVisibileInVetrina(member.statoAssociativo)

        if (!isStillVisible) {
            selectedActivityForDetail = null
        } else {
            ActivityDetailSheet(
                activity = detailActivity,
                onClose = { selectedActivityForDetail = null }
            )
            return
        }
    }

    // Regola Fondamentale:
    // Un'attività è pubblicabile ed esposta nella Vetrina SOLO SE il socio collegato è ATTIVO e lo stato è PUBBLICATA
    val allEligibleInShowcase = activities.filter { act ->
        val member = members.find { it.id == act.memberId }
        act.isVisibileInVetrina(member?.statoAssociativo ?: MembershipStatus.SOSPESO)
    }

    // Filtraggio dinamico per ricerca utente
    val filteredActivities = allEligibleInShowcase.filter { act ->
        val matchesSearch = searchQuery.isBlank() ||
                act.nomeAttivita.contains(searchQuery, ignoreCase = true) ||
                act.descrizioneBreve.contains(searchQuery, ignoreCase = true) ||
                act.localita.contains(searchQuery, ignoreCase = true) ||
                act.serviziOfferti.any { it.contains(searchQuery, ignoreCase = true) }

        val matchesCategory = selectedCategory == null || act.categoria == selectedCategory
        val matchesLocality = selectedLocality == null || act.localita.contains(selectedLocality!!, ignoreCase = true)

        matchesSearch && matchesCategory && matchesLocality
    }

    // Raccoglie le località uniche per i filtri rapidi
    val localitiesList = remember(allEligibleInShowcase) {
        allEligibleInShowcase.map { it.localita }.distinct()
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(Slate50)
            .testTag("showcase_screen"),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Hero Header Istituzionale
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CivicNavy900),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = CivicGold.copy(alpha = 0.2f),
                            border = BorderStroke(1.dp, CivicGold.copy(alpha = 0.4f))
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Storefront,
                                    contentDescription = null,
                                    tint = CivicGold,
                                    modifier = Modifier.size(15.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Vetrina Pubblica Soci",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = CivicGold
                                )
                            }
                        }

                        Text(
                            text = "${allEligibleInShowcase.size} attività disponibili",
                            fontSize = 12.sp,
                            color = Slate300,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    Text(
                        text = "Vetrina delle attività e dei servizi",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        lineHeight = 26.sp
                    )

                    Text(
                        text = "Consultazione pubblica delle attività e dei servizi offerti dai soci secondo le regole associative. I rapporti tra visitatori e attività restano autonomi.",
                        fontSize = 13.sp,
                        color = Slate200,
                        lineHeight = 18.sp
                    )

                    HorizontalDivider(color = Slate800, modifier = Modifier.padding(vertical = 4.dp))

                    // Nota di trasparenza e autonomia (neutrale, senza attestazioni di garanzia)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            tint = Slate300,
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Trasparenza: L'associazione non certifica né garantisce le prestazioni professionali.",
                            fontSize = 11.sp,
                            color = Slate300,
                            fontWeight = FontWeight.Normal
                        )
                    }
                }
            }
        }

        // Toolbar di Ricerca Testuale
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Slate200),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Cerca attività, professione, servizi o via...", fontSize = 13.sp) },
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Default.Search,
                                contentDescription = "Cerca",
                                tint = Slate500
                            )
                        },
                        trailingIcon = {
                            if (searchQuery.isNotEmpty()) {
                                IconButton(onClick = { searchQuery = "" }) {
                                    Icon(imageVector = Icons.Default.Clear, contentDescription = "Pulisci")
                                }
                            }
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = CivicNavy700,
                            unfocusedBorderColor = Slate300
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("search_activity_input")
                    )

                    // Filtro Categorie a Scorrimento Orizzontale
                    Text(
                        text = "Filtra per Categoria:",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Slate700
                    )

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FilterChip(
                            selected = selectedCategory == null,
                            onClick = { selectedCategory = null },
                            label = { Text("Tutte", fontSize = 12.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = CivicNavy700,
                                selectedLabelColor = Color.White
                            )
                        )

                        ActivityCategory.values().forEach { cat ->
                            FilterChip(
                                selected = selectedCategory == cat,
                                onClick = {
                                    selectedCategory = if (selectedCategory == cat) null else cat
                                },
                                label = { Text(cat.title, fontSize = 12.sp) },
                                leadingIcon = {
                                    Icon(
                                        imageVector = getCategoryIcon(cat),
                                        contentDescription = null,
                                        modifier = Modifier.size(14.dp)
                                    )
                                },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = CivicNavy700,
                                    selectedLabelColor = Color.White
                                )
                            )
                        }
                    }

                    // Filtro Località Rapide se presenti
                    if (localitiesList.isNotEmpty()) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Zona:",
                                fontSize = 11.sp,
                                color = Slate500,
                                fontWeight = FontWeight.Medium
                            )

                            FilterChip(
                                selected = selectedLocality == null,
                                onClick = { selectedLocality = null },
                                label = { Text("Tutte le zone", fontSize = 11.sp) }
                            )

                            localitiesList.forEach { loc ->
                                FilterChip(
                                    selected = selectedLocality == loc,
                                    onClick = {
                                        selectedLocality = if (selectedLocality == loc) null else loc
                                    },
                                    label = { Text(loc, fontSize = 11.sp) }
                                )
                            }
                        }
                    }
                }
            }
        }

        // Barra di Stato e Contatore Risultati
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Risultati trovati: ${filteredActivities.size}",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = Slate700
                )

                if (selectedCategory != null || selectedLocality != null || searchQuery.isNotBlank()) {
                    TextButton(onClick = {
                        searchQuery = ""
                        selectedCategory = null
                        selectedLocality = null
                    }) {
                        Text("Azzera filtri", fontSize = 12.sp, color = CivicBlue600)
                    }
                }
            }
        }

        // Elenco Schede Attività
        if (filteredActivities.isEmpty()) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = BorderStroke(1.dp, Slate200),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.FilterList,
                            contentDescription = null,
                            tint = Slate500,
                            modifier = Modifier.size(36.dp)
                        )
                        Text(
                            text = "Nessuna attività corrisponde ai criteri",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate800
                        )
                        Text(
                            text = "Prova a modificare i filtri di ricerca o selezionare una categoria diversa.",
                            fontSize = 12.sp,
                            color = Slate600
                        )
                        Button(
                            onClick = {
                                searchQuery = ""
                                selectedCategory = null
                                selectedLocality = null
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = CivicNavy700),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Mostra tutte le attività", fontSize = 12.sp)
                        }
                    }
                }
            }
        } else {
            items(filteredActivities) { activity ->
                ShowcaseActivityCard(
                    activity = activity,
                    onOpenDetail = { selectedActivityForDetail = activity }
                )
            }
        }

        // Callout per Soci e Gestione
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate100),
                border = BorderStroke(1.dp, Slate200),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            text = "Sei un socio Pro-Local?",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate900
                        )
                        Text(
                            text = "Accedi all'Area Socio per aggiornare la scheda della tua attività o verificare la pubblicazione.",
                            fontSize = 11.sp,
                            color = Slate600
                        )
                    }
                    Button(
                        onClick = onNavigateToMemberArea,
                        colors = ButtonDefaults.buttonColors(containerColor = CivicNavy700),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.testTag("btn_go_to_member_area")
                    ) {
                        Text("Area Socio", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Demo Box: Regola Dimostrativa in Azione
        item {
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = CivicGoldSurface,
                border = BorderStroke(1.dp, CivicGoldBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = "Verifica la Regola Dimostrativa:",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = CivicGoldText
                    )
                    Text(
                        text = "Nota: L'attività 'Bottega Creativa Ceramiche Trastevere' di Francesca Neri è stata approvata ma NON appare in questa vetrina perché il suo stato associativo risulta SOSPESO. Puoi riattivarla o sospendere altri soci dal pannello Amministrazione per osservare il comportamento in tempo reale.",
                        fontSize = 11.sp,
                        color = Slate700,
                        lineHeight = 16.sp
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        TextButton(onClick = onNavigateToAdmin) {
                            Text(
                                "Pannello Amministrazione e Soci →",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = CivicGoldDark
                            )
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ShowcaseActivityCard(
    activity: BusinessActivity,
    onOpenDetail: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, Slate200),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onOpenDetail() }
            .testTag("activity_card_${activity.id}")
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Intestazione Categoria e Località
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = CivicGoldSurface,
                    border = BorderStroke(1.dp, CivicGoldBorder)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = getCategoryIcon(activity.categoria),
                            contentDescription = null,
                            tint = CivicGoldDark,
                            modifier = Modifier.size(13.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = activity.categoria.title,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = CivicGoldText
                        )
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.LocationOn,
                        contentDescription = null,
                        tint = Slate500,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = activity.localita,
                        fontSize = 11.sp,
                        color = Slate600,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            // Nome e Descrizione Breve
            Text(
                text = activity.nomeAttivita,
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = Slate900
            )

            Text(
                text = activity.descrizioneBreve,
                fontSize = 13.sp,
                color = Slate700,
                lineHeight = 18.sp,
                maxLines = 2
            )

            // Chip dei primi 3 servizi principali
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                activity.serviziOfferti.take(3).forEach { s ->
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = Slate100,
                        border = BorderStroke(1.dp, Slate200)
                    ) {
                        Text(
                            text = s,
                            fontSize = 11.sp,
                            color = Slate800,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }
                }
                if (activity.serviziOfferti.size > 3) {
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = Slate100
                    ) {
                        Text(
                            text = "+${activity.serviziOfferti.size - 3}",
                            fontSize = 11.sp,
                            color = Slate500,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                        )
                    }
                }
            }

            HorizontalDivider(color = Slate100)

            // Footer neutrale con indicazione servizi e azione scheda
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${activity.serviziOfferti.size} servizi offerti",
                    fontSize = 11.sp,
                    color = Slate500
                )

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.clickable { onOpenDetail() }
                ) {
                    Text(
                        text = "Consulta scheda",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = CivicNavy700
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = null,
                        tint = CivicNavy700,
                        modifier = Modifier.size(14.dp)
                    )
                }
            }
        }
    }
}
