# R8 / Play Console : obfuscation + shrinking (seuil 25 %).
# Capacitor charge les plugins par réflexion — les garder.

-keepattributes *Annotation*
-keepattributes InnerClasses
-keepattributes EnclosingMethod
-keepattributes Signature
-keepattributes Exceptions

-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.plugin.** { *; }
-keep public class * extends com.getcapacitor.Plugin
-keepclassmembers class * extends com.getcapacitor.Plugin { public *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.annotation.PluginMethod <methods>;
}

-keep class org.apache.cordova.** { *; }
-dontwarn com.getcapacitor.**
-dontwarn org.apache.cordova.**

-keep class com.talkfoot.app.** { *; }

# RevenueCat (Play Billing)
-keep class com.revenuecat.purchases.** { *; }
-dontwarn com.revenuecat.purchases.**

# AdMob / Play services
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.android.gms.common.** { *; }

# FCM
-keep class com.google.firebase.messaging.** { *; }
-keep class com.google.firebase.iid.** { *; }

# WebView / JS bridge
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
