package com.example.ui.modules

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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.HourglassEmpty
import androidx.compose.material.icons.filled.HowToVote
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Mail
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.core.model.AppRole
import com.example.core.model.DefinitionState
import com.example.core.model.ModuleKey
import com.example.core.model.PermissionType
import com.example.core.model.ProjectModule
import com.example.ui.components.DefinitionBadge
import com.example.ui.components.LegalNoticeBanner
import com.example.ui.components.SectionHeader
import com.example.ui.theme.CivicBlue600
import com.example.ui.theme.CivicNavy700
import com.example.ui.theme.CivicNavy900
import com.example.ui.theme.Slate100
import com.example.ui.theme.Slate200
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
fun ModularPlaceholdersScreen(
    module: ProjectModule,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier.fillMaxSize().testTag("module_screen_${module.key.slug}"),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            LegalNoticeBanner()
        }

        // Testata Modulo
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, Slate200),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
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
                                    .size(40.dp)
                                    .background(CivicNavy700.copy(alpha = 0.1f), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = getModuleIcon(module.key),
                                    contentDescription = null,
                                    tint = CivicNavy700,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = module.titolo,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Slate900
                                )
                                Text(
                                    text = module.sottotitolo,
                                    fontSize = 12.sp,
                                    color = Slate500
                                )
                            }
                        }
                        DefinitionBadge(state = module.statoDefinizione)
                    }

                    Spacer(modifier = Modifier.height(14.dp))
                    Text(
                        text = module.descrizioneFunzionale,
                        fontSize = 13.sp,
                        color = Slate700,
                        lineHeight = 18.sp
                    )
                }
            }
        }

        // Architettura Predisposta
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, Slate200),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Security,
                            contentDescription = null,
                            tint = CivicBlue600,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Predisposizione Architetturale Realizzata",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate900
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "La struttura software è già separata tra modello dati, repository e interfaccia. Nessuna scorciatoia temporanea: il codice è pronto per accogliere database persistente (Room/SQL) e autenticazione non appena i requisiti saranno stabiliti.",
                        fontSize = 12.sp,
                        color = Slate600,
                        lineHeight = 16.sp
                    )
                }
            }
        }

        // Requisiti DEFINITI vs DA DEFINIRE
        item {
            SectionHeader(
                title = "Stato dei Requisiti di Questo Modulo",
                subtitle = "Conformità al principio: non inventare regole non deliberate"
            )
        }

        if (module.elementiDefiniti.isNotEmpty()) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = StateDefinedGreenBg.copy(alpha = 0.5f)),
                    border = BorderStroke(1.dp, StateDefinedGreen.copy(alpha = 0.3f)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = StateDefinedGreenText,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "ELEMENTI DEFINITI",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = StateDefinedGreenText
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        module.elementiDefiniti.forEach { item ->
                            Text(
                                text = "• $item",
                                fontSize = 12.sp,
                                color = StateDefinedGreenText,
                                modifier = Modifier.padding(vertical = 2.dp)
                            )
                        }
                    }
                }
            }
        }

        if (module.elementiDaDefinire.isNotEmpty()) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = StateToDefineAmberBg.copy(alpha = 0.5f)),
                    border = BorderStroke(1.dp, StateToDefineAmber.copy(alpha = 0.3f)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.HourglassEmpty,
                                contentDescription = null,
                                tint = StateToDefineAmberText,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "ELEMENTI DA DEFINIRE STATUTARIAMENTE",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = StateToDefineAmberText
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        module.elementiDaDefinire.forEach { item ->
                            Text(
                                text = "• [DA DEFINIRE] $item",
                                fontSize = 12.sp,
                                color = StateToDefineAmberText,
                                modifier = Modifier.padding(vertical = 2.dp)
                            )
                        }
                    }
                }
            }
        }

        // Sezione Specifica per il Modulo
        item {
            when (module.key) {
                ModuleKey.ASSOCIATI -> DemoAssociatiSection()
                ModuleKey.ASSEMBLEA -> DemoAssembleaSection()
                ModuleKey.DOCUMENTI -> DemoDocumentiSection()
                ModuleKey.COMUNICAZIONI -> DemoComunicazioniSection()
                ModuleKey.RUOLI -> DemoRuoliSection()
                else -> Spacer(modifier = Modifier.height(0.dp))
            }
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun DemoAssociatiSection() {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, Slate200),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Anteprima Struttura Libro Soci (Dati Dimostrativi)",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = Slate900
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Campi predisposti con protezione privacy (conformità GDPR, nessun dato personale reale):",
                fontSize = 12.sp,
                color = Slate500
            )
            Spacer(modifier = Modifier.height(10.dp))

            val demoMembers = listOf(
                Triple("SOC-001", "Socio Dimostrativo Alpha", "Attivo • Quota 2024 Regolare"),
                Triple("SOC-002", "Socio Dimostrativo Beta", "Attivo • Quota 2024 Regolare"),
                Triple("SOC-003", "Aspirante Socio Gamma", "In attesa approvazione [DA DEFINIRE organo]")
            )

            demoMembers.forEach { (code, name, status) ->
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(text = name, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = Slate900)
                        Text(text = "ID: $code • $status", fontSize = 11.sp, color = Slate500)
                    }
                    Surface(color = Slate100, shape = RoundedCornerShape(4.dp)) {
                        Text(
                            text = "DEMO",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate600,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
                HorizontalDivider(color = Slate100)
            }
        }
    }
}

@Composable
private fun DemoAssembleaSection() {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, Slate200),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Struttura Assembleare & Elezione Cariche",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = Slate900
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "• L'Assemblea è l'organo sovrano incaricato per statuto di eleggere direttamente le 4 cariche del Consiglio.\n• La scheda elettorale digitale predisporrà la selezione per Presidente, Vicepresidente, Segretario e Tesoriere.\n• I quorum di prima e seconda convocazione rimangono [DA DEFINIRE].",
                fontSize = 12.sp,
                color = Slate700,
                lineHeight = 16.sp
            )
        }
    }
}

@Composable
private fun DemoDocumentiSection() {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, Slate200),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Registro Atti e Documenti Istituzionali",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = Slate900
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Predisposto per archiviare:\n1. Atto Costitutivo e Statuto Sociale\n2. Verbali delle adunanze consiliari con le deliberazioni approvate\n3. Verbali dell'Assemblea e rendiconti economici",
                fontSize = 12.sp,
                color = Slate700,
                lineHeight = 16.sp
            )
        }
    }
}

@Composable
private fun DemoComunicazioniSection() {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, Slate200),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Canale Notifiche e Comunicazioni",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = Slate900
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Predisposto per l'invio e il tracciamento sicuro di convocazioni formali e informative agli associati, con attestazione di recapito non appena stabilite le modalità telematiche legali [DA DEFINIRE].",
                fontSize = 12.sp,
                color = Slate700,
                lineHeight = 16.sp
            )
        }
    }
}

@Composable
private fun DemoRuoliSection() {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, Slate200),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Matrice Ruoli e Permessi (RBAC)",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = Slate900
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Mappatura dei ruoli e relative prerogative d'accesso previste nel software:",
                fontSize = 12.sp,
                color = Slate500
            )
            Spacer(modifier = Modifier.height(10.dp))

            AppRole.entries.forEach { role ->
                Column(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = role.label,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 13.sp,
                            color = Slate900
                        )
                        Surface(
                            color = Slate100,
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                text = "RUOLO PREDISPOSTO",
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                color = Slate600,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                    Text(
                        text = role.descrizione,
                        fontSize = 11.sp,
                        color = Slate600
                    )
                }
                HorizontalDivider(color = Slate100, modifier = Modifier.padding(vertical = 4.dp))
            }
        }
    }
}

private fun getModuleIcon(key: ModuleKey): ImageVector {
    return when (key) {
        ModuleKey.VETRINA -> Icons.Default.Storefront
        ModuleKey.AREA_SOCIO -> Icons.Default.Badge
        ModuleKey.AMMINISTRAZIONE -> Icons.Default.AdminPanelSettings
        ModuleKey.DASHBOARD -> Icons.Default.Assignment
        ModuleKey.CONSIGLIO -> Icons.Default.People
        ModuleKey.ASSOCIATI -> Icons.Default.People
        ModuleKey.ASSEMBLEA -> Icons.Default.HowToVote
        ModuleKey.DOCUMENTI -> Icons.Default.Description
        ModuleKey.COMUNICAZIONI -> Icons.Default.Mail
        ModuleKey.RUOLI -> Icons.Default.AdminPanelSettings
        ModuleKey.DOCUMENTAZIONE -> Icons.Default.Assignment
    }
}
