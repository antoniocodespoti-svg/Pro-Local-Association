package com.example.ui.showcase

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.BusinessCenter
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Computer
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.HomeRepairService
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Restaurant
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Spa
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.core.model.ActivityCategory
import com.example.core.model.BusinessActivity
import com.example.core.model.Member
import com.example.ui.theme.CivicBlue600
import com.example.ui.theme.CivicGold
import com.example.ui.theme.CivicGoldBorder
import com.example.ui.theme.CivicGoldDark
import com.example.ui.theme.CivicGoldSurface
import com.example.ui.theme.CivicGoldText
import com.example.ui.theme.CivicNavy700
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

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun ActivityDetailSheet(
    activity: BusinessActivity,
    member: Member?,
    onClose: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = activity.nomeAttivita,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = Slate900
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onClose, modifier = Modifier.testTag("btn_close_detail")) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Torna alla Vetrina",
                            tint = CivicNavy700
                        )
                    }
                },
                actions = {
                    IconButton(onClick = onClose) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Chiudi", tint = Slate500)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        modifier = modifier.fillMaxSize().testTag("activity_detail_sheet")
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .padding(innerPadding)
                .fillMaxSize()
                .background(Slate50)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header Attività con Categoria e Badge
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
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = CivicGoldSurface,
                            border = BorderStroke(1.dp, CivicGoldBorder)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = getCategoryIcon(activity.categoria),
                                    contentDescription = null,
                                    tint = CivicGoldDark,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = activity.categoria.title,
                                    fontSize = 12.sp,
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
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = activity.localita,
                                fontSize = 12.sp,
                                color = Slate600,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }

                    Text(
                        text = activity.nomeAttivita,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = Slate900,
                        lineHeight = 28.sp
                    )

                    Text(
                        text = activity.descrizioneBreve,
                        fontSize = 14.sp,
                        color = Slate700,
                        lineHeight = 20.sp
                    )

                    // Box Certificazione Socio Attivo Pro-Local
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = StateDefinedGreenBg.copy(alpha = 0.6f),
                        border = BorderStroke(1.dp, StateDefinedGreen.copy(alpha = 0.3f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .background(StateDefinedGreen, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.VerifiedUser,
                                    contentDescription = "Certificato",
                                    tint = Color.White,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "Attività Verificata nella Rete Pro-Local",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = StateDefinedGreenText
                                )
                                Text(
                                    text = "Pubblicata da socio attivo (${member?.codiceSocio ?: "SOC-PROLOCAL"}) regolarmente iscritto all'associazione.",
                                    fontSize = 11.sp,
                                    color = Slate600
                                )
                            }
                        }
                    }
                }
            }

            // Descrizione Dettagliata
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Slate200),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Presentazione dell'Attività",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = Slate900
                    )
                    Text(
                        text = activity.descrizioneCompleta,
                        fontSize = 13.sp,
                        color = Slate700,
                        lineHeight = 21.sp
                    )
                }
            }

            // Servizi Offerti
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Slate200),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "Servizi e Prestazioni Offerte",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = Slate900
                    )

                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        activity.serviziOfferti.forEach { servizio ->
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = Slate100,
                                border = BorderStroke(1.dp, Slate200)
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = null,
                                        tint = StateDefinedGreen,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = servizio,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = Slate800
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Contatti e Canali Pubblici
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Slate200),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "Recapiti e Contatti",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = Slate900
                    )

                    if (activity.indirizzoPubblico.isNotBlank()) {
                        ContactRow(
                            icon = Icons.Default.LocationOn,
                            label = "Indirizzo",
                            value = activity.indirizzoPubblico
                        )
                    }

                    if (activity.orariApertura.isNotBlank()) {
                        ContactRow(
                            icon = Icons.Default.AccessTime,
                            label = "Orari",
                            value = activity.orariApertura
                        )
                    }

                    if (activity.telefonoPubblico.isNotBlank()) {
                        ContactRow(
                            icon = Icons.Default.Phone,
                            label = "Telefono",
                            value = activity.telefonoPubblico,
                            onActionClick = {
                                val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${activity.telefonoPubblico}"))
                                context.startActivity(intent)
                            }
                        )
                    }

                    if (activity.emailPubblica.isNotBlank()) {
                        ContactRow(
                            icon = Icons.Default.Email,
                            label = "Email",
                            value = activity.emailPubblica,
                            onActionClick = {
                                val intent = Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:${activity.emailPubblica}"))
                                context.startActivity(intent)
                            }
                        )
                    }

                    if (activity.sitoWeb.isNotBlank()) {
                        ContactRow(
                            icon = Icons.Default.Language,
                            label = "Sito Web",
                            value = activity.sitoWeb,
                            onActionClick = {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(activity.sitoWeb))
                                context.startActivity(intent)
                            }
                        )
                    }

                    if (activity.socialInstagram.isNotBlank() || activity.socialLinkedin.isNotBlank()) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            if (activity.socialInstagram.isNotBlank()) {
                                Text(
                                    text = "IG: ${activity.socialInstagram}",
                                    fontSize = 12.sp,
                                    color = CivicBlue600,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                            if (activity.socialLinkedin.isNotBlank()) {
                                Text(
                                    text = "LI: ${activity.socialLinkedin}",
                                    fontSize = 12.sp,
                                    color = CivicNavy700,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }
                }
            }

            // Elementi [DA DEFINIRE] esplicitamente marcati
            Card(
                colors = CardDefaults.cardColors(containerColor = Slate50),
                border = BorderStroke(1.dp, StateToDefineAmber.copy(alpha = 0.3f)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            shape = RoundedCornerShape(4.dp),
                            color = StateToDefineAmberBg,
                            border = BorderStroke(1.dp, StateToDefineAmber.copy(alpha = 0.5f))
                        ) {
                            Text(
                                text = "DA DEFINIRE NELLE PROSSIME FASI",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = StateToDefineAmberText,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }

                    Text(
                        text = "• Mappa interattiva e calcolo percorsi (in attesa di selezione provider cartografico open/GDPR-compliant)\n• Modulo recensioni istituzionali verificate tra associati (nessuna recensione commerciale libera per rispetto statutario)\n• Sistema di prenotazione diretta e transazioni (non previsto nello statuto attuale dell'associazione)",
                        fontSize = 11.sp,
                        color = Slate600,
                        lineHeight = 16.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}

@Composable
private fun ContactRow(
    icon: ImageVector,
    label: String,
    value: String,
    onActionClick: (() -> Unit)? = null
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(
            modifier = Modifier.weight(1f),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = Slate500,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text(text = label, fontSize = 11.sp, color = Slate500)
                Text(text = value, fontSize = 13.sp, color = Slate900, fontWeight = FontWeight.Medium)
            }
        }
        if (onActionClick != null) {
            OutlinedButton(
                onClick = onActionClick,
                shape = RoundedCornerShape(8.dp),
                border = BorderStroke(1.dp, Slate300),
                modifier = Modifier.height(34.dp)
            ) {
                Text(text = "Apri", fontSize = 11.sp, color = CivicNavy700, fontWeight = FontWeight.Bold)
            }
        }
    }
}

internal fun getCategoryIcon(cat: ActivityCategory): ImageVector {
    return when (cat) {
        ActivityCategory.ARTIGIANATO_RESTAURO -> Icons.Default.Build
        ActivityCategory.CONSULENZA_PROFESSIONALE -> Icons.Default.BusinessCenter
        ActivityCategory.ENOGASTRONOMIA_LOCALE -> Icons.Default.Restaurant
        ActivityCategory.BENESSERE_PERSONA -> Icons.Default.Spa
        ActivityCategory.INFORMATICA_DIGITALE -> Icons.Default.Computer
        ActivityCategory.CULTURA_FORMAZIONE -> Icons.Default.School
        ActivityCategory.SERVIZI_CASA -> Icons.Default.HomeRepairService
    }
}
