import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.talkfoot.app',
  appName: 'Talk Foot',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // Phase test USB : charge le site prod. allowNavigation = OAuth Google/Clerk
    // reste DANS la WebView (sinon Android ouvre Chrome hors de l’app).
    // Note : talk-foot.fr ne résout pas partout (ERR_NAME_NOT_RESOLVED) → .com.
    url: 'https://talk-foot.com',
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
  },
}

export default config
