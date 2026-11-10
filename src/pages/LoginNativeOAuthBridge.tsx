import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import {
  consumeOAuthCallbackInApp,
  handoffOAuthToNativeApp,
  hasPkceVerifierInStorage,
  isExternalMobileBrowser,
} from '../lib/supabase/oauthCallback'

/**
 * Page HTTPS ouverte dans Custom Tabs après Google.
 * Renvoie vers `talkfoot://` / intent Android. Dans la WebView : échange PKCE.
 * À déclarer dans Supabase Redirect URLs : https://talk-foot.com/login/native-oauth
 */
export function LoginNativeOAuthBridgePage() {
  const [hint, setHint] = useState('Retour vers Talk Foot…')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (Capacitor.isNativePlatform()) {
        const ok = await consumeOAuthCallbackInApp()
        if (cancelled) return
        window.location.replace(ok ? '/' : '/login?oauth=retry')
        return
      }
      if (isExternalMobileBrowser() && !hasPkceVerifierInStorage()) {
        handoffOAuthToNativeApp()
        return
      }
      const ok = await consumeOAuthCallbackInApp()
      if (cancelled) return
      if (ok) {
        window.location.replace('/')
        return
      }
      setHint('Connexion incomplète — réessaie depuis l’app Talk Foot.')
      window.setTimeout(() => window.location.replace('/login?oauth=retry'), 1600)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-[#061222] px-6">
      <p className="relative text-center text-sm font-semibold text-white/80">{hint}</p>
    </div>
  )
}
