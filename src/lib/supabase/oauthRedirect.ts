import { Capacitor } from '@capacitor/core'
import { getPublicSiteOrigin } from '../../utils/sportMonksRelayOrigin'

/** Deep link déclaré dans AndroidManifest / Info.plist + dashboards Clerk/Supabase. */
export const NATIVE_APP_OAUTH_SCHEME = 'talkfoot://app'

/**
 * URL de retour OAuth (PKCE). Doit être **exactement** déclarée dans Supabase :
 * Authentication → URL Configuration → Redirect URLs.
 * Sur natif : scheme custom (évite https://localhost).
 */
function authRedirectPath(suffix: string): string {
  const path = suffix.startsWith('/') ? suffix : `/${suffix}`
  if (Capacitor.isNativePlatform()) {
    if (path === '/') return `${NATIVE_APP_OAUTH_SCHEME}/`
    return `${NATIVE_APP_OAUTH_SCHEME}${path}`
  }
  const base = import.meta.env.BASE_URL ?? '/'
  const segment = typeof base === 'string' ? base.replace(/\/$/, '') : ''
  const origin = window.location.origin
  if (!segment || segment === '') return `${origin}${path}`
  return `${origin}${segment}${path}`
}

export function getSupabaseOAuthRedirectTo(): string {
  return authRedirectPath('/')
}

/** Lien de retour après clic sur « mot de passe oublié » (à déclarer dans Supabase Redirect URLs). */
export function getSupabasePasswordResetRedirectTo(): string {
  return authRedirectPath('/login/reset-password')
}

/** Redirect Clerk SSO callback (natif = deep link, web = origin courant). */
export function getClerkOAuthRedirectUrl(): string {
  if (Capacitor.isNativePlatform()) {
    return `${NATIVE_APP_OAUTH_SCHEME}/login/sso-callback`
  }
  const base = window.location.origin + (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')
  return `${base}/login/sso-callback`
}

/** Après OAuth Clerk réussi — renvoyer dans l’app. */
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
