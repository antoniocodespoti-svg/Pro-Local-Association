package com.example.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Gavel
import androidx.compose.material.icons.filled.HourglassEmpty
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import com.example.core.model.DefinitionState
import com.example.ui.theme.LegalWarningBg
import com.example.ui.theme.LegalWarningBorder
import com.example.ui.theme.LegalWarningText
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
fun DefinitionBadge(
    state: DefinitionState,
    modifier: Modifier = Modifier
) {
    val (bgColor, textColor, label, icon) = when (state) {
        DefinitionState.DEFINITO -> Quadruple(
            StateDefinedGreenBg,
            StateDefinedGreenText,
            "DEFINITO",
            Icons.Default.CheckCircle
        )
        DefinitionState.DA_DEFINIRE -> Quadruple(
            StateToDefineAmberBg,
            StateToDefineAmberText,
            "DA DEFINIRE",
            Icons.Default.HourglassEmpty
        )
    }

    Surface(
        color = bgColor,
        shape = RoundedCornerShape(6.dp),
        border = BorderStroke(1.dp, textColor.copy(alpha = 0.3f)),
        modifier = modifier.testTag("badge_${label.lowercase()}")
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = textColor,
                modifier = Modifier.size(12.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = label,
                color = textColor,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp
            )
        }
    }
}

private data class Quadruple<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)

@Composable
fun LegalNoticeBanner(
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = LegalWarningBg),
        border = BorderStroke(1.dp, LegalWarningBorder),
        shape = RoundedCornerShape(12.dp),
        modifier = modifier.fillMaxWidth().testTag("legal_notice_banner")
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.Top
        ) {
            Icon(
                imageVector = Icons.Default.Gavel,
                contentDescription = "Avviso normativo",
                tint = LegalWarningText,
                modifier = Modifier.size(20.dp).padding(top = 2.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = "Requisito di Progetto & Avviso di Conformità Normativa",
                    color = LegalWarningText,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp
                )
                Spacer(modifier = Modifier.height(3.dp))
                Text(
                    text = "Le regole qui esposte costituiscono requisiti del progetto software e non devono essere interpretate come consulenza legale. Eventuali incompatibilità con la normativa italiana dovranno essere evidenziate prima dell'implementazione definitiva.",
                    color = LegalWarningText.copy(alpha = 0.9f),
                    fontSize = 12.sp,
                    lineHeight = 16.sp
                )
            }
        }
    }
}

@Composable
fun StatCard(
    title: String,
    value: String,
    subtitle: String,
    icon: ImageVector,
    iconTint: Color = MaterialTheme.colorScheme.primary,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, Slate200),
        shape = RoundedCornerShape(12.dp),
        modifier = modifier.testTag("stat_card_${title.lowercase().replace(" ", "_")}")
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Slate600,
                    fontWeight = FontWeight.Medium
                )
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .background(iconTint.copy(alpha = 0.12f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = iconTint,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = value,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = Slate900
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = subtitle,
                fontSize = 12.sp,
                color = Slate500
            )
        }
    }
}

@Composable
fun SectionHeader(
    title: String,
    subtitle: String? = null,
    badgeState: DefinitionState? = null,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Slate900
            )
            badgeState?.let {
                DefinitionBadge(state = it)
            }
        }
        if (!subtitle.isNullOrBlank()) {
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = Slate600
            )
        }
    }
}
