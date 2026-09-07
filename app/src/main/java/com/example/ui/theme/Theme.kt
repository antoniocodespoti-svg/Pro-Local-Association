package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

private val ProLocalLightColorScheme = lightColorScheme(
    primary = CivicNavy700,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFD8E7F5),
    onPrimaryContainer = CivicNavy900,
    secondary = CivicBlue600,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFDBEAFE),
    onSecondaryContainer = Color(0xFF1E3A8A),
    tertiary = StateDefinedGreen,
    onTertiary = Color.White,
    background = Slate50,
    onBackground = Slate900,
    surface = Color.White,
    onSurface = Slate900,
    surfaceVariant = Slate100,
    onSurfaceVariant = Slate700,
    outline = Slate300
)

private val ProLocalDarkColorScheme = darkColorScheme(
    primary = Color(0xFF90CAF9),
    onPrimary = CivicNavy900,
    primaryContainer = CivicNavy800,
    onPrimaryContainer = Color(0xFFD8E7F5),
    secondary = Color(0xFF93C5FD),
    onSecondary = CivicNavy900,
    secondaryContainer = CivicNavy700,
    onSecondaryContainer = Color(0xFFEFF6FF),
    tertiary = Color(0xFF6EE7B7),
    onTertiary = Color(0xFF064E3B),
    background = CivicNavy900,
    onBackground = Slate100,
    surface = CivicNavy800,
    onSurface = Slate100,
    surfaceVariant = CivicNavy700,
    onSurfaceVariant = Slate200,
    outline = Slate600
)

@Composable
fun ProLocalTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false, // Use our handcrafted institutional palette by default
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> ProLocalDarkColorScheme
        else -> ProLocalLightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}

// Backward compatibility alias for existing tests
@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    ProLocalTheme(darkTheme = darkTheme, dynamicColor = dynamicColor, content = content)
}
