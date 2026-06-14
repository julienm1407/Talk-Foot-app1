import type { Session, SupabaseClient, User } from '@supabase/supabase-js'

function isAnonymousUser(user: User | null | undefined): boolean {
  return user?.is_anonymous === true
}

/** Évite plusieurs signInAnonymously() en parallèle (sessions Supabase conflictuelles). */
let anonymousSessionInFlight: Promise<Session | null> | null = null
let lastAnonymousSignInAt = 0

/** Session chat en mémoire — évite refresh/sign-in répétés (Safari ITP, live lourd). */
let cachedChatSession: Session | null = null
let cachedChatSessionAt = 0
let chatSessionInFlight: Promise<Session | null> | null = null
let refreshSessionInFlight: Promise<Session | null> | null = null
let lastRefreshSessionAt = 0

const CHAT_SESSION_CACHE_MS = 8_000
const REFRESH_SESSION_COOLDOWN_MS = 20_000
const ANONYMOUS_SIGNIN_COOLDOWN_MS = 15_000

export function invalidateSupabaseChatSessionCache(): void {
  cachedChatSession = null
  cachedChatSessionAt = 0
}

async function refreshSessionThrottled(sb: SupabaseClient): Promise<Session | null> {
  const now = Date.now()
  if (refreshSessionInFlight) return refreshSessionInFlight
  if (now - lastRefreshSessionAt < REFRESH_SESSION_COOLDOWN_MS && cachedChatSession?.user) {
    return cachedChatSession
  }

  refreshSessionInFlight = (async () => {
    lastRefreshSessionAt = Date.now()
    const { data: refreshed } = await sb.auth.refreshSession()
    const session = refreshed.session?.user ? refreshed.session : null
    if (session) {
      cachedChatSession = session
      cachedChatSessionAt = Date.now()
    }
    return session
  })()

  try {
    return await refreshSessionInFlight
  } finally {
    refreshSessionInFlight = null
  }
}

async function signInAnonymouslyOnce(sb: SupabaseClient): Promise<Session | null> {
  if (anonymousSessionInFlight) return anonymousSessionInFlight

  const now = Date.now()
  if (now - lastAnonymousSignInAt < ANONYMOUS_SIGNIN_COOLDOWN_MS && cachedChatSession?.user) {
    return cachedChatSession
  }

  anonymousSessionInFlight = (async () => {
    lastAnonymousSignInAt = Date.now()
    const { data, error } = await sb.auth.signInAnonymously()
    if (error || !data.session) return null
    cachedChatSession = data.session
    cachedChatSessionAt = Date.now()
    return data.session
  })()

  try {
    return await anonymousSessionInFlight
  } finally {
    anonymousSessionInFlight = null
  }
}

async function resolveSupabaseChatSession(sb: SupabaseClient): Promise<Session | null> {
  const { data: sessionWrap } = await sb.auth.getSession()
  let session = sessionWrap.session
  if (session?.user) {
    cachedChatSession = session
    cachedChatSessionAt = Date.now()
    return session
  }

  const { data: userWrap } = await sb.auth.getUser()
  if (userWrap.user) {
    const { data: again } = await sb.auth.getSession()
    session = again.session
    if (session?.user) {
      cachedChatSession = session
      cachedChatSessionAt = Date.now()
      return session
    }
    const refreshed = await refreshSessionThrottled(sb)
    if (refreshed?.user) return refreshed
  }

  return signInAnonymouslyOnce(sb)
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
    const refreshed = await refreshSessionThrottled(sb)
    if (refreshed?.user && !isAnonymousUser(refreshed.user)) return refreshed
  }
  return null
}

/**
 * Session pour le live public : compte connecté si déjà présent, sinon session anonyme.
 * Tente getUser + refresh pour éviter une fausse absence de session au premier chargement.
 */
export async function ensureSupabaseChatSession(sb: SupabaseClient): Promise<Session | null> {
  const now = Date.now()
  if (cachedChatSession?.user && now - cachedChatSessionAt < CHAT_SESSION_CACHE_MS) {
    return cachedChatSession
  }
  if (chatSessionInFlight) return chatSessionInFlight

  chatSessionInFlight = (async () => {
    try {
      return await resolveSupabaseChatSession(sb)
    } finally {
      chatSessionInFlight = null
    }
  })()

  return chatSessionInFlight
}
