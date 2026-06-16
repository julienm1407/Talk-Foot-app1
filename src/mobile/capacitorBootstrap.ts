import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { Keyboard } from '@capacitor/keyboard'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'

/** Initialise le shell natif Capacitor (status bar, splash, retour Android, deep links). */
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
    try {
      const url = new URL(event.url)
      const path = `${url.pathname}${url.search}${url.hash}`
      if (path && path !== window.location.pathname) {
        window.history.replaceState(null, '', path)
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
    } catch {
      /* URL OAuth / scheme non routable */
    }
  })

  if (Capacitor.getPlatform() === 'ios') {
    try {
      await Keyboard.setAccessoryBarVisible({ isVisible: true })
    } catch {
      /* ignore */
    }
  }
}
