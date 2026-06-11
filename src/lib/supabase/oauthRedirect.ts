/**
 * URL de retour OAuth (PKCE). Doit être **exactement** déclarée dans Supabase :
 * Authentication → URL Configuration → Redirect URLs.
 */
function authRedirectPath(suffix: string): string {
  const base = import.meta.env.BASE_URL ?? '/'
  const segment = typeof base === 'string' ? base.replace(/\/$/, '') : ''
  const origin = window.location.origin
  const path = suffix.startsWith('/') ? suffix : `/${suffix}`
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
