import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

/**
 * Ouvre une URL externe (OAuth Google, Stripe Checkout).
 * Sur natif : Custom Tabs / SFSafariViewController (évite le blocage WebView Google).
 * Sur web : navigation classique.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (!url) return
  if (Capacitor.isNativePlatform()) {
    try {
      await Browser.open({ url, presentationStyle: 'popover' })
      return
    } catch {
      /* fallback ci-dessous */
    }
  }
  window.location.assign(url)
}
