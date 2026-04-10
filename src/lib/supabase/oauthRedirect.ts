/**
 * URL de retour OAuth (PKCE). Doit être **exactement** déclarée dans Supabase :
 * Authentication → URL Configuration → Redirect URLs.
 */
export function getSupabaseOAuthRedirectTo(): string {
  const base = import.meta.env.BASE_URL ?? '/'
  const segment = typeof base === 'string' ? base.replace(/\/$/, '') : ''
  const origin = window.location.origin
  if (!segment || segment === '') return `${origin}/`
  return `${origin}${segment}/`
}
