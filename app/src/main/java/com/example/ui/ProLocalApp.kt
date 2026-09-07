package com.example.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Gavel
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.HowToVote
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Mail
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.People
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.NavigationDrawerItemDefaults
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.NavigationRailItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberDrawerState
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.core.data.ProLocalRepository
import com.example.core.model.DefinitionState
import com.example.core.model.ModuleKey
import com.example.ui.components.DefinitionBadge
import com.example.ui.council.CouncilScreen
import com.example.ui.dashboard.DashboardScreen
import com.example.ui.docs.ProjectDocsScreen
import com.example.ui.modules.ModularPlaceholdersScreen
import com.example.ui.theme.CivicBlue600
import com.example.ui.theme.CivicNavy700
import com.example.ui.theme.CivicNavy800
import com.example.ui.theme.CivicNavy900
import com.example.ui.theme.Slate100
import com.example.ui.theme.Slate200
import com.example.ui.theme.Slate500
import com.example.ui.theme.Slate600
import com.example.ui.theme.Slate700
import com.example.ui.theme.Slate900
import kotlinx.coroutines.launch

data class NavItem(
    val key: ModuleKey,
    val label: String,
    val icon: ImageVector,
    val isPrimaryBottom: Boolean = false
)

val AllNavItems = listOf(
    NavItem(ModuleKey.DASHBOARD, "Dashboard", Icons.Default.Dashboard, isPrimaryBottom = true),
    NavItem(ModuleKey.CONSIGLIO, "Consiglio", Icons.Default.Gavel, isPrimaryBottom = true),
    NavItem(ModuleKey.ASSOCIATI, "Associati", Icons.Default.People, isPrimaryBottom = false),
    NavItem(ModuleKey.ASSEMBLEA, "Assemblea", Icons.Default.HowToVote, isPrimaryBottom = false),
    NavItem(ModuleKey.DOCUMENTI, "Documenti", Icons.Default.Description, isPrimaryBottom = false),
    NavItem(ModuleKey.COMUNICAZIONI, "Comunicazioni", Icons.Default.Mail, isPrimaryBottom = false),
    NavItem(ModuleKey.RUOLI, "Ruoli & Permessi", Icons.Default.AdminPanelSettings, isPrimaryBottom = false),
    NavItem(ModuleKey.DOCUMENTAZIONE, "Documentazione", Icons.Default.MenuBook, isPrimaryBottom = true)
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProLocalApp(
    repository: ProLocalRepository,
    modifier: Modifier = Modifier
) {
    var currentModuleKey by remember { mutableStateOf(ModuleKey.DASHBOARD) }
    var showProjectInfoDialog by remember { mutableStateOf(false) }

    val modules by repository.projectModules.collectAsState()
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val coroutineScope = rememberCoroutineScope()

    BoxWithConstraints(modifier = modifier.fillMaxSize().testTag("prolocal_app_root")) {
        val isWideScreen = maxWidth >= 720.dp

        if (isWideScreen) {
            // Layout Desktop / Tablet con NavigationRail laterale permanente
            Row(modifier = Modifier.fillMaxSize()) {
                NavigationRail(
                    containerColor = CivicNavy900,
                    contentColor = Color.White,
                    header = {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.padding(vertical = 16.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .background(CivicBlue600, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.AccountBalance,
                                    contentDescription = "Logo Pro-Local",
                                    tint = Color.White,
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Pro-Local",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = "v0.1.0",
                                fontSize = 10.sp,
                                color = Color(0xFF93C5FD)
                            )
                        }
                    },
                    modifier = Modifier.fillMaxHeight().testTag("desktop_navigation_rail")
                ) {
                    Column(
                        modifier = Modifier.verticalScroll(rememberScrollState()),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        AllNavItems.forEach { item ->
                            NavigationRailItem(
                                selected = currentModuleKey == item.key,
                                onClick = { currentModuleKey = item.key },
                                icon = {
                                    Icon(
                                        imageVector = item.icon,
                                        contentDescription = item.label
                                    )
                                },
                                label = {
                                    Text(
                                        text = item.label,
                                        fontSize = 10.sp,
                                        fontWeight = if (currentModuleKey == item.key) FontWeight.Bold else FontWeight.Normal
                                    )
                                },
                                colors = NavigationRailItemDefaults.colors(
                                    selectedIconColor = Color.White,
                                    selectedTextColor = Color.White,
                                    indicatorColor = CivicNavy700,
                                    unselectedIconColor = Color(0xFF94A3B8),
                                    unselectedTextColor = Color(0xFF94A3B8)
                                ),
                                modifier = Modifier.padding(vertical = 2.dp)
                            )
                        }
                    }
                }

                // Area Contenuto Desktop
                Scaffold(
                    topBar = {
                        TopAppBar(
                            title = {
                                Column {
                                    Text(
                                        text = AllNavItems.find { it.key == currentModuleKey }?.label ?: "Pro-Local",
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Slate900
                                    )
                                    Text(
                                        text = "Associazione non riconosciuta • Pro-Local Digital Platform",
                                        fontSize = 11.sp,
                                        color = Slate500
                                    )
                                }
                            },
                            actions = {
                                IconButton(
                                    onClick = { showProjectInfoDialog = true },
                                    modifier = Modifier.testTag("btn_info_dialog")
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Info,
                                        contentDescription = "Informazioni di progetto",
                                        tint = CivicNavy700
                                    )
                                }
                            },
                            colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
                        )
                    }
                ) { innerPadding ->
                    MainScreenContent(
                        currentKey = currentModuleKey,
                        repository = repository,
                        modules = modules,
                        onNavigate = { currentModuleKey = it },
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        } else {
            // Layout Mobile / Smartphone con Drawer laterale + NavigationBar inferiore
            ModalNavigationDrawer(
                drawerState = drawerState,
                drawerContent = {
                    ModalDrawerSheet(
                        drawerContainerColor = MaterialTheme.colorScheme.surface,
                        modifier = Modifier.width(300.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(CivicNavy900)
                                .padding(20.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .background(CivicBlue600, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.AccountBalance,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = "Pro-Local",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = "Gestione Digitale Associazione",
                                fontSize = 12.sp,
                                color = Color(0xFF93C5FD)
                            )
                            Text(
                                text = "Stato: Associazione non riconosciuta",
                                fontSize = 11.sp,
                                color = Slate400Mob
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .verticalScroll(rememberScrollState())
                                .padding(horizontal = 8.dp)
                        ) {
                            Text(
                                text = "TUTTI I MODULI",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Slate500,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                            )

                            AllNavItems.forEach { item ->
                                NavigationDrawerItem(
                                    icon = { Icon(imageVector = item.icon, contentDescription = null) },
                                    label = { Text(text = item.label, fontSize = 13.sp) },
                                    selected = currentModuleKey == item.key,
                                    onClick = {
                                        currentModuleKey = item.key
                                        coroutineScope.launch { drawerState.close() }
                                    },
                                    colors = NavigationDrawerItemDefaults.colors(
                                        selectedContainerColor = CivicNavy700.copy(alpha = 0.12f),
                                        selectedIconColor = CivicNavy700,
                                        selectedTextColor = CivicNavy700
                                    ),
                                    modifier = Modifier.padding(vertical = 2.dp)
                                )
                            }
                        }
                    }
                }
            ) {
                Scaffold(
                    topBar = {
                        TopAppBar(
                            title = {
                                Column {
                                    Text(
                                        text = AllNavItems.find { it.key == currentModuleKey }?.label ?: "Pro-Local",
                                        fontSize = 17.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Slate900
                                    )
                                    Text(
                                        text = "Pro-Local • Associazione non riconosciuta",
                                        fontSize = 11.sp,
                                        color = Slate500
                                    )
                                }
                            },
                            navigationIcon = {
                                IconButton(
                                    onClick = { coroutineScope.launch { drawerState.open() } },
                                    modifier = Modifier.testTag("btn_menu_drawer")
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Menu,
                                        contentDescription = "Apri menu moduli",
                                        tint = Slate700
                                    )
                                }
                            },
                            actions = {
                                IconButton(
                                    onClick = { showProjectInfoDialog = true },
                                    modifier = Modifier.testTag("btn_info_mobile")
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Info,
                                        contentDescription = "Info Progetto",
                                        tint = CivicNavy700
                                    )
                                }
                            },
                            colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
                        )
                    },
                    bottomBar = {
                        val bottomItems = AllNavItems.filter { it.isPrimaryBottom }
                        NavigationBar(
                            containerColor = MaterialTheme.colorScheme.surface,
                            tonalElevation = 6.dp,
                            modifier = Modifier
                                .windowInsetsPadding(WindowInsets.navigationBars)
                                .testTag("mobile_bottom_bar")
                        ) {
                            bottomItems.forEach { item ->
                                val selected = currentModuleKey == item.key
                                NavigationBarItem(
                                    selected = selected,
                                    onClick = { currentModuleKey = item.key },
                                    icon = {
                                        Icon(
                                            imageVector = item.icon,
                                            contentDescription = item.label
                                        )
                                    },
                                    label = {
                                        Text(
                                            text = item.label,
                                            fontSize = 11.sp,
                                            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium
                                        )
                                    },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = CivicNavy700,
                                        selectedTextColor = CivicNavy700,
                                        indicatorColor = CivicNavy700.copy(alpha = 0.12f),
                                        unselectedIconColor = Slate500,
                                        unselectedTextColor = Slate500
                                    )
                                )
                            }
                        }
                    }
                ) { innerPadding ->
                    MainScreenContent(
                        currentKey = currentModuleKey,
                        repository = repository,
                        modules = modules,
                        onNavigate = { currentModuleKey = it },
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }

        // Dialog informativo di progetto
        if (showProjectInfoDialog) {
            ProjectInfoModal(
                onDismiss = { showProjectInfoDialog = false },
                onOpenDocs = {
                    showProjectInfoDialog = false
                    currentModuleKey = ModuleKey.DOCUMENTAZIONE
                }
            )
        }
    }
}

private val Slate400Mob = Color(0xFF94A3B8)

@Composable
private fun MainScreenContent(
    currentKey: ModuleKey,
    repository: ProLocalRepository,
    modules: List<com.example.core.model.ProjectModule>,
    onNavigate: (ModuleKey) -> Unit,
    modifier: Modifier = Modifier
) {
    Box(modifier = modifier.fillMaxSize()) {
        when (currentKey) {
            ModuleKey.DASHBOARD -> DashboardScreen(
                repository = repository,
                onNavigateToModule = onNavigate
            )
            ModuleKey.CONSIGLIO -> CouncilScreen(
                repository = repository
            )
            ModuleKey.DOCUMENTAZIONE -> ProjectDocsScreen(
                repository = repository
            )
            else -> {
                val module = modules.find { it.key == currentKey }
                    ?: modules.first()
                ModularPlaceholdersScreen(module = module)
            }
        }
    }
}

@Composable
private fun ProjectInfoModal(
    onDismiss: () -> Unit,
    onOpenDocs: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Informazioni sul Progetto Pro-Local",
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp,
                color = Slate900
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "Pro-Local è una base applicativa solida e modulare per la gestione digitale di un'associazione non riconosciuta, predisposta per un'eventuale futura iscrizione al RUNTS.",
                    fontSize = 13.sp,
                    color = Slate700
                )
                Text(
                    text = "• Fase attuale: Fondazione dell'architettura e disciplina consolidata del Consiglio Direttivo.\n• Nessun dato personale reale inserito (solo dati dimostrativi).\n• Requisiti aperti contrassegnati rigorosamente come [DA DEFINIRE].\n• Documentazione integrale (7 sezioni) inclusa per GitHub.",
                    fontSize = 12.sp,
                    color = Slate600,
                    lineHeight = 16.sp
                )
            }
        },
        confirmButton = {
            TextButton(onClick = onOpenDocs) {
                Text("Apri Documentazione", fontWeight = FontWeight.Bold, color = CivicNavy700)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Chiudi", color = Slate600)
            }
        }
    )
}
