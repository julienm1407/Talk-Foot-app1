import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { NATIVE_APP_OAUTH_SCHEME } from '../lib/supabase/oauthRedirect'

/**
 * Page HTTPS ouverte dans Custom Tabs après Google.
 * Renvoie immédiatement vers le deep link `talkfoot://app…` pour rouvrir l’app.
 * À déclarer dans Supabase Redirect URLs : https://talk-foot.com/login/native-oauth
 */
export function LoginNativeOAuthBridgePage() {
  useEffect(() => {
    const { search, hash } = window.location
    const target = `${NATIVE_APP_OAUTH_SCHEME}/${search}${hash}`

    // Natif : le bridge tourne dans Custom Tabs → deep link ramène l’app.
    // Web (erreur de config) : rester sur le site sans boucle.
    if (Capacitor.isNativePlatform() || /Android|iPhone|iPad/i.test(navigator.userAgent)) {
      window.location.replace(target)
      return
    }

    window.location.replace(`/${search}${hash}`)
  }, [])

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-[#061222] px-6">
      <p className="relative text-center text-sm font-semibold text-white/80">
        Retour vers Talk Foot…
      </p>
    </div>
  )
}
