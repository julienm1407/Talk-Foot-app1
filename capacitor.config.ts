import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.talkfoot.app',
  appName: 'Talk Foot',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Pas de `url` prod : l’UI est le bundle `dist/` dans l’APK/IPA.
    // Scores / relais : fetch https://talk-foot.com/api/* (CDN, 1 origine pour N fans).
    // OAuth : Custom Tabs + bridge HTTPS, pas une WebView du site entier.
    iosScheme: 'capacitor',
    cleartext: false,
    allowNavigation: [
      'talk-foot.com',
      'www.talk-foot.com',
      'talk-foot.fr',
      'www.talk-foot.fr',
      '*.clerk.com',
      '*.clerk.accounts.dev',
      'accounts.clerk.com',
      'clerk.talk-foot.fr',
      'clerk.talk-foot.com',
      '*.google.com',
      '*.google.fr',
      'accounts.google.com',
      '*.gstatic.com',
      '*.googleapis.com',
      '*.supabase.co',
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      launchFadeOutDuration: 400,
      backgroundColor: '#061222',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#061222',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    allowsLinkPreview: false,
    // Langue App Store : CFBundleDevelopmentRegion / CFBundleLocalizations dans ios/App/App/Info.plist (fr).
  },
}

export default config
