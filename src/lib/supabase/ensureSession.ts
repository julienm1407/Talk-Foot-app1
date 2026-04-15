import type { Session, SupabaseClient, User } from '@supabase/supabase-js'

function isAnonymousUser(user: User | null | undefined): boolean {
  return user?.is_anonymous === true
}

/**
 * Compte réel Supabase (email / OAuth), pas l’accès anonyme.
 * Réservé aux salons membres, MP, etc.
 */
export async function ensureSupabaseAuthenticatedSession(
  sb: SupabaseClient,
): Promise<Session | null> {
  const { data: sessionWrap } = await sb.auth.getSession()
  let session = sessionWrap.session
  if (session?.user && !isAnonymousUser(session.user)) return session

  const { data: userWrap } = await sb.auth.getUser()
  if (userWrap.user && !isAnonymousUser(userWrap.user)) {
    const { data: again } = await sb.auth.getSession()
    session = again.session
    if (session?.user && !isAnonymousUser(session.user)) return session
    const { data: refreshed } = await sb.auth.refreshSession()
    if (refreshed.session?.user && !isAnonymousUser(refreshed.session.user)) return refreshed.session
  }
  return null
}

/**
 * Session pour le live public : compte connecté si déjà présent, sinon session anonyme.
 * Tente getUser + refresh pour éviter une fausse absence de session au premier chargement.
 */
export async function ensureSupabaseChatSession(sb: SupabaseClient): Promise<Session | null> {
  const { data: sessionWrap } = await sb.auth.getSession()
  let session = sessionWrap.session
  if (session?.user) return session

  const { data: userWrap } = await sb.auth.getUser()
  if (userWrap.user) {
    const { data: again } = await sb.auth.getSession()
    session = again.session
    if (session?.user) return session
    const { data: refreshed } = await sb.auth.refreshSession()
    if (refreshed.session?.user) return refreshed.session
  }

  const { data, error } = await sb.auth.signInAnonymously()
  if (error || !data.session) return null
  return data.session
}
