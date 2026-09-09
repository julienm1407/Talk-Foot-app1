import { Capacitor } from '@capacitor/core'
import { getPublicSiteOrigin } from '../../utils/sportMonksRelayOrigin'

/** Deep link déclaré dans AndroidManifest / Info.plist + dashboards Clerk/Supabase. */
export const NATIVE_APP_OAUTH_SCHEME = 'talkfoot://app'

/** Page HTTPS (Custom Tabs) qui renvoie vers le scheme natif — voir LoginNativeOAuthBridge. */
export const NATIVE_OAUTH_HTTPS_BRIDGE_PATH = '/login/native-oauth'

function publicHttpsOrigin(): string {
  const fromEnv = getPublicSiteOrigin()
  if (fromEnv) return fromEnv
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin
  return 'https://talk-foot.com'
}

/**
 * URL de retour OAuth (PKCE). Doit être **exactement** déclarée dans Supabase :
 * Authentication → URL Configuration → Redirect URLs.
 * Sur natif : HTTPS bridge (Custom Tabs) → deep link `talkfoot://app` (Google refuse souvent le scheme seul).
 */
function authRedirectPath(suffix: string): string {
  const path = suffix.startsWith('/') ? suffix : `/${suffix}`
  if (Capacitor.isNativePlatform()) {
    // Mot de passe / reset : deep link direct. OAuth Google : bridge HTTPS.
    if (path === '/' || path === NATIVE_OAUTH_HTTPS_BRIDGE_PATH) {
      return `${publicHttpsOrigin()}${NATIVE_OAUTH_HTTPS_BRIDGE_PATH}`
    }
    return `${NATIVE_APP_OAUTH_SCHEME}${path}`
  }
  const base = import.meta.env.BASE_URL ?? '/'
  const segment = typeof base === 'string' ? base.replace(/\/$/, '') : ''
  const origin = window.location.origin
  if (!segment || segment === '') return `${origin}${path}`
  return `${origin}${segment}${path}`
}

export function getSupabaseOAuthRedirectTo(): string {
  if (Capacitor.isNativePlatform()) {
    return `${publicHttpsOrigin()}${NATIVE_OAUTH_HTTPS_BRIDGE_PATH}`
  }
  return authRedirectPath('/')
}

/** Lien de retour après clic sur « mot de passe oublié » (à déclarer dans Supabase Redirect URLs). */
export function getSupabasePasswordResetRedirectTo(): string {
  return authRedirectPath('/login/reset-password')
}

/** Redirect Clerk SSO callback (natif = deep link dans la WebView Capacitor). */
export function getClerkOAuthRedirectUrl(): string {
  if (Capacitor.isNativePlatform()) {
    return `${NATIVE_APP_OAUTH_SCHEME}/login/sso-callback`
  }
  const base = window.location.origin + (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')
  return `${base}/login/sso-callback`
}

/** Après OAuth Clerk réussi — renvoyer dans l’app (deep link natif). */
export function getClerkOAuthCompleteUrl(fallbackPath = '/'): string {
  const path = fallbackPath.startsWith('/') ? fallbackPath : `/${fallbackPath}`
  if (Capacitor.isNativePlatform()) {
    return path === '/' ? `${NATIVE_APP_OAUTH_SCHEME}/` : `${NATIVE_APP_OAUTH_SCHEME}${path}`
  }
  const publicSite = getPublicSiteOrigin()
  if (publicSite && /^https?:\/\/localhost(?::\d+)?$/i.test(window.location.origin)) {
    return `${publicSite}${path}`
  }
  return `${window.location.origin}${path}`
}
