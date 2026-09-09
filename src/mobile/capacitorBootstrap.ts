import { App as CapApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import { Keyboard } from '@capacitor/keyboard'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { configureRevenueCat } from '../lib/payments/revenueCat'
import { getSupabaseBrowserClient } from '../lib/supabase/client'

async function applyNativeOAuthUrl(raw: string): Promise<void> {
  let path = '/'

  if (raw.startsWith('talkfoot://app')) {
    const asHttps = raw.replace(/^talkfoot:\/\/app\/?/, 'https://talk-foot.com/')
    const url = new URL(asHttps)
    path = `${url.pathname}${url.search}${url.hash}` || '/'
  } else if (raw.startsWith('com.talkfoot.app://oauth')) {
    const asHttps = raw.replace(/^com\.talkfoot\.app:\/\/oauth\/?/, 'https://talk-foot.com/')
    const url = new URL(asHttps)
    path = `${url.pathname}${url.search}${url.hash}` || '/'
  } else {
    const url = new URL(raw)
    path = `${url.pathname}${url.search}${url.hash}` || '/'
  }

  await Browser.close().catch(() => undefined)

  const abs = new URL(path, 'https://talk-foot.com')
  const code = abs.searchParams.get('code')
  if (code) {
    const sb = getSupabaseBrowserClient()
    if (sb) {
      try {
        await sb.auth.exchangeCodeForSession(code)
      } catch {
        /* detectSessionInUrl / hash tokens en secours */
      }
    }
  }

  if (path.includes('#')) {
    window.location.replace(path)
    return
  }
  if (path && path !== `${window.location.pathname}${window.location.search}`) {
    window.history.replaceState(null, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}

/** Initialise le shell natif Capacitor (status bar, splash, retour Android, deep links, IAP). */
export async function initCapacitorShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  document.documentElement.classList.add('tf-native-shell')

  try {
    await StatusBar.setStyle({ style: Style.Dark })
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#061222' })
    }
  } catch {
    /* plugin indisponible en preview web */
  }

  try {
    await SplashScreen.hide()
  } catch {
    /* ignore */
  }

  const rc = await configureRevenueCat()
  if (!rc.ok && import.meta.env.DEV) {
    console.warn('[Talk Foot] RevenueCat non initialisé:', rc.error)
  }

  if (Capacitor.getPlatform() === 'android') {
    void CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
        return
      }
      void CapApp.exitApp()
    })
  }

  void CapApp.addListener('appUrlOpen', (event) => {
    void applyNativeOAuthUrl(event.url).catch(() => undefined)
  })

  if (Capacitor.getPlatform() === 'ios') {
    try {
      await Keyboard.setAccessoryBarVisible({ isVisible: true })
    } catch {
      /* ignore */
    }
  }
}
