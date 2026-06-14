import type { Session, SupabaseClient, User } from '@supabase/supabase-js'

function isAnonymousUser(user: User | null | undefined): boolean {
  return user?.is_anonymous === true
}

/** Évite plusieurs signInAnonymously() en parallèle (sessions Supabase conflictuelles). */
let anonymousSessionInFlight: Promise<Session | null> | null = null

async function signInAnonymouslyOnce(sb: SupabaseClient): Promise<Session | null> {
  if (anonymousSessionInFlight) return anonymousSessionInFlight

  anonymousSessionInFlight = (async () => {
    const { data, error } = await sb.auth.signInAnonymously()
    if (error || !data.session) return null
    return data.session
  })()

  try {
    return await anonymousSessionInFlight
  } finally {
    anonymousSessionInFlight = null
  }
}

/**
 * Compte réel Supabase (email / OAuth), pas l’accès anonyme.
 * Réservé aux tribunes membres, MP, etc.
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

  return signInAnonymouslyOnce(sb)
}
