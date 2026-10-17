# =============================================================================
# ProGuard / R8 Rules for Backgammon Pro (Capacitor Hybrid App)
# =============================================================================

# Preserve Capacitor core and JS bridge classes
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }

# Preserve Capacitor plugins
-keep class com.capacitorjs.plugins.haptics.** { *; }
-keep class com.capacitorjs.plugins.share.** { *; }
-keep class com.getcapacitor.community.database.sqlite.** { *; }

# Preserve WebView JavaScript Interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve line numbers for Sentry / Firebase crash stack traces
-keepattributes SourceFile,LineNumberTable
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses
-keepattributes Signature

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}
