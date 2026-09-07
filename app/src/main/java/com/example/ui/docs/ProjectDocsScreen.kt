package com.example.ui.docs

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
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Gavel
import androidx.compose.material.icons.filled.HourglassEmpty
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
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
import com.example.core.model.DocCategory
import com.example.core.model.DocSection
import com.example.core.model.ProjectDocument
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
fun ProjectDocsScreen(
    repository: ProLocalRepository,
    modifier: Modifier = Modifier
) {
    val documents by repository.projectDocuments.collectAsState()
    var selectedCategoryIndex by remember { mutableIntStateOf(0) }

    val currentDoc = documents.getOrNull(selectedCategoryIndex) ?: documents.first()

    Column(modifier = modifier.fillMaxSize().testTag("project_docs_screen")) {
        // Tab row con le 7 categorie
        ScrollableTabRow(
            selectedTabIndex = selectedCategoryIndex,
            containerColor = MaterialTheme.colorScheme.surface,
            edgePadding = 16.dp,
            modifier = Modifier.fillMaxWidth().testTag("docs_tab_row")
        ) {
            DocCategory.entries.forEachIndexed { index, category ->
                Tab(
                    selected = selectedCategoryIndex == index,
                    onClick = { selectedCategoryIndex = index },
                    text = {
                        Text(
                            text = "${category.codice} - ${category.titolo.take(18)}...",
                            fontWeight = if (selectedCategoryIndex == index) FontWeight.Bold else FontWeight.Medium,
                            fontSize = 12.sp
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

            // Header documento selezionato
            item {
                DocumentHeaderCard(document = currentDoc)
            }

            // GitHub repository notice
            item {
                GitHubRepoNotice(markdownPath = currentDoc.fileMarkdownName)
            }

            // Sezioni del documento con stato
            item {
                SectionHeader(
                    title = "Articolazione dei Contenuti",
                    subtitle = "I singoli punti con indicazione esplicita DEFINITO vs DA DEFINIRE"
                )
            }

            items(currentDoc.sezioni) { section ->
                DocSectionCard(section = section)
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

@Composable
private fun DocumentHeaderCard(document: ProjectDocument) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, Slate200),
        shape = RoundedCornerShape(14.dp),
        modifier = Modifier.fillMaxWidth().testTag("doc_header_card")
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Surface(
                    color = CivicNavy700.copy(alpha = 0.1f),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = document.categoria.codice,
                        color = CivicNavy700,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
                Text(
                    text = "Aggiornato: ${document.ultimoAggiornamento}",
                    fontSize = 11.sp,
                    color = Slate500
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = document.categoria.titolo,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Slate900
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = document.sintesi,
                fontSize = 13.sp,
                color = Slate700,
                lineHeight = 18.sp
            )
        }
    }
}

@Composable
private fun GitHubRepoNotice(markdownPath: String) {
    Surface(
        color = Slate100,
        shape = RoundedCornerShape(10.dp),
        border = BorderStroke(1.dp, Slate200),
        modifier = Modifier.fillMaxWidth().testTag("github_notice")
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Description,
                contentDescription = null,
                tint = CivicBlue600,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text(
                    text = "File Markdown per Repository GitHub",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Slate900
                )
                Text(
                    text = "Percorso nel repository: $markdownPath",
                    fontSize = 11.sp,
                    color = Slate600
                )
            }
        }
    }
}

@Composable
private fun DocSectionCard(section: DocSection) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, Slate200),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth().testTag("doc_section_${section.sottotitolo.lowercase().replace(" ", "_")}")
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = section.sottotitolo,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Slate900,
                    modifier = Modifier.weight(1f)
                )
                Spacer(modifier = Modifier.width(8.dp))
                DefinitionBadge(state = section.stato)
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = section.testo,
                fontSize = 13.sp,
                color = Slate700,
                lineHeight = 18.sp
            )
        }
    }
}
