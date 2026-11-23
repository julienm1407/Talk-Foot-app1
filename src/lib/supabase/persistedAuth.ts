/** Lecture du jeton Supabase déjà stocké (sans attendre getSession). */

type PersistedAuthHint = {
  hasSession: boolean
  hasRealUser: boolean
  isAnonymous: boolean
}

const EMPTY: PersistedAuthHint = {
  hasSession: false,
  hasRealUser: false,
  isAnonymous: false,
}

function userFromStoredValue(raw: string): { id?: string; is_anonymous?: boolean } | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const o = parsed as Record<string, unknown>
    const direct = o.user
    if (direct && typeof direct === 'object') return direct as { id?: string; is_anonymous?: boolean }
    const nested =
      (o.currentSession && typeof o.currentSession === 'object'
        ? (o.currentSession as Record<string, unknown>).user
        : null) ??
      (o.session && typeof o.session === 'object' ? (o.session as Record<string, unknown>).user : null)
    if (nested && typeof nested === 'object') return nested as { id?: string; is_anonymous?: boolean }
  } catch {
    /* ignore */
  }
  return null
}

export function readPersistedSupabaseAuthHint(): PersistedAuthHint {
  if (typeof window === 'undefined') return EMPTY
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (!key) continue
      const looksLikeSb =
        (key.startsWith('sb-') && key.includes('auth-token')) ||
        key.includes('supabase.auth.token')
      if (!looksLikeSb) continue
      const raw = localStorage.getItem(key)
      if (!raw || raw === 'null' || raw.length < 20) continue
      const user = userFromStoredValue(raw)
      if (!user?.id) {
        return { hasSession: true, hasRealUser: false, isAnonymous: false }
      }
      const isAnonymous = user.is_anonymous === true
      return {
        hasSession: true,
        hasRealUser: !isAnonymous,
        isAnonymous,
      }
    }
  } catch {
    /* private mode */
  }
  return EMPTY
}

export function hasPersistedRealSupabaseUser(): boolean {
  return readPersistedSupabaseAuthHint().hasRealUser
}
