import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { isAdminEmail } from '../config/adminAccess'
import { hashPasswordForStorage, verifyPasswordAgainstStored } from '../utils/passwordHash'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { getSupabaseOAuthRedirectTo } from '../lib/supabase/oauthRedirect'
import { logSiteActivity } from '../lib/activityLog'
import {
  isTalkFootOAuthProvider,
  type TalkFootOauthProviderId,
} from '../config/oauthProviders'

const AUTH_KEY = 'talkfoot.auth.v1'
const AUTH_REGISTRY_KEY = 'talkfoot.auth.registry.v1'

export type AuthUser = {
  id: string
  email?: string
  displayName: string
  /** Connexion email/mot de passe, ou fournisseur OAuth Talk Foot, ou autre OAuth Supabase. */
  provider: 'email' | TalkFootOauthProviderId | 'oauth'
  avatarUrl?: string
  isAdmin?: boolean
  /** Session Supabase « invité » (sans email / OAuth) — pas d’accès salons membres synchronisés. */
  isAnonymous?: boolean
}

export type StoredEmailUser = {
  id: string
  displayName: string
  password?: string
  salt?: string
  passwordHash?: string
}

type AuthState = {
  user: AuthUser | null
  isReady: boolean
}

export type AuthContextValue = AuthState & {
  login: (user: AuthUser) => void
  loginWithEmail: (email: string, password: string) => Promise<boolean>
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<boolean>
  loginWithOAuthProvider: (provider: TalkFootOauthProviderId) => Promise<boolean>
  logout: () => void
  updateProfile: (displayName: string) => void
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>
  /** Cloud : inscription sans session immédiate (confirmation email). */
  authNotice: string | null
  clearAuthNotice: () => void
  /** Recharge l’utilisateur depuis la session (ex. après mise à jour du pseudo OAuth). */
  refreshAuthUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function withAdminFlag(user: AuthUser): AuthUser {
  return { ...user, isAdmin: isAdminEmail(user.email) }
}

function readOAuthProvider(u: SupabaseUser): AuthUser['provider'] {
  const appProv = typeof u.app_metadata?.provider === 'string' ? u.app_metadata.provider : ''
  const fromIdent = u.identities?.find((i) => i.provider && i.provider !== 'email')?.provider
  const raw = appProv || fromIdent || 'email'
  if (raw === 'email' || raw === '') return 'email'
  if (isTalkFootOAuthProvider(raw)) return raw
  return 'oauth'
}

function mapSupabaseUser(u: SupabaseUser): AuthUser {
  const meta = u.user_metadata as Record<string, unknown> | undefined
  const provider = readOAuthProvider(u)
  const dn =
    (typeof meta?.display_name === 'string' && meta.display_name.trim()) ||
    (typeof meta?.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta?.name === 'string' && meta.name.trim()) ||
    (typeof meta?.user_name === 'string' && meta.user_name.trim()) ||
    (typeof meta?.preferred_username === 'string' && meta.preferred_username.trim()) ||
    u.email?.split('@')[0] ||
    'Supporteur'
  return withAdminFlag({
    id: u.id,
    email: u.email ?? undefined,
    displayName: dn.trim(),
    provider,
    isAnonymous: Boolean(u.is_anonymous),
    avatarUrl:
      typeof meta?.avatar_url === 'string'
        ? meta.avatar_url
        : typeof meta?.picture === 'string'
          ? meta.picture
          : undefined,
  })
}

function loadStored(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

function saveStored(user: AuthUser | null) {
  try {
    if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user))
    else localStorage.removeItem(AUTH_KEY)
  } catch {
    /* ignore */
  }
}

function loadRegistry(): Record<string, StoredEmailUser> {
  try {
    const raw = localStorage.getItem(AUTH_REGISTRY_KEY)
    return raw ? (JSON.parse(raw) as Record<string, StoredEmailUser>) : {}
  } catch {
    return {}
  }
}

function saveRegistry(registry: Record<string, StoredEmailUser>) {
  try {
    localStorage.setItem(AUTH_REGISTRY_KEY, JSON.stringify(registry))
  } catch {
    /* ignore */
  }
}

async function verifyEmailPassword(existing: StoredEmailUser, password: string): Promise<boolean> {
  if (existing.passwordHash && existing.salt) {
    return verifyPasswordAgainstStored(password, existing.salt, existing.passwordHash)
  }
  if (existing.password !== undefined) return existing.password === password
  return false
}

async function migrateLegacyPassword(
  registry: Record<string, StoredEmailUser>,
  key: string,
  existing: StoredEmailUser,
  plainPassword: string,
) {
  const { salt, passwordHash } = await hashPasswordForStorage(plainPassword)
  registry[key] = {
    id: existing.id,
    displayName: existing.displayName,
    salt,
    passwordHash,
  }
  saveRegistry(registry)
}

function LocalAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isReady: false })
  const [authNotice, setAuthNotice] = useState<string | null>(null)
  const clearAuthNotice = useCallback(() => setAuthNotice(null), [])

  useEffect(() => {
    const raw = loadStored()
    const user = raw ? withAdminFlag(raw) : null
    if (raw && user) saveStored(user)
    setState({ user, isReady: true })
  }, [])

  const login = useCallback((user: AuthUser) => {
    const next = withAdminFlag(user)
    saveStored(next)
    setState((s) => ({ ...s, user: next }))
  }, [])

  const loginWithEmail = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      if (!email.trim() || !password) return false
      const key = email.trim().toLowerCase()
      const registry = loadRegistry()
      const existing = registry[key]
      if (existing) {
        const ok = await verifyEmailPassword(existing, password)
        if (!ok) return false
        if (existing.password !== undefined && !existing.passwordHash) {
          await migrateLegacyPassword(registry, key, existing, password)
        }
        login({
          id: existing.id,
          email: email.trim(),
          displayName: existing.displayName,
          provider: 'email',
        })
        return true
      }
      const { salt, passwordHash } = await hashPasswordForStorage(password)
      const reg: StoredEmailUser = {
        id: `email-${Date.now()}`,
        displayName: email.trim().split('@')[0],
        salt,
        passwordHash,
      }
      registry[key] = reg
      saveRegistry(registry)
      login({ id: reg.id, email: email.trim(), displayName: reg.displayName, provider: 'email' })
      return true
    },
    [login],
  )

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName?: string): Promise<boolean> => {
      if (!email.trim() || !password) return false
      const key = email.trim().toLowerCase()
      const registry = loadRegistry()
      if (registry[key]) return false
      const name = (displayName || email.trim().split('@')[0]).trim() || 'Supporteur'
      const { salt, passwordHash } = await hashPasswordForStorage(password)
      registry[key] = { id: `email-${Date.now()}`, displayName: name, salt, passwordHash }
      saveRegistry(registry)
      login({ id: registry[key].id, email: email.trim(), displayName: name, provider: 'email' })
      return true
    },
    [login],
  )

  const loginWithOAuthProvider = useCallback(
    async (provider: TalkFootOauthProviderId) => {
      const demoEmail =
        provider === 'github'
          ? 'dev@users.noreply.github.com'
          : provider === 'apple'
            ? undefined
            : `${provider}@demo.talkfoot.local`
      login({
        id: `${provider}-${Date.now()}`,
        email: demoEmail,
        displayName: 'You',
        provider,
      })
      return true
    },
    [login],
  )

  const logout = useCallback(() => {
    saveStored(null)
    setState((s) => ({ ...s, user: null }))
  }, [])

  const updateProfile = useCallback((displayName: string) => {
    const name = displayName.trim() || 'Supporteur'
    setState((s) => {
      if (!s.user) return s
      const updated = withAdminFlag({ ...s.user, displayName: name })
      saveStored(updated)
      if (s.user.provider === 'email' && s.user.email) {
        const registry = loadRegistry()
        const key = s.user.email.toLowerCase()
        if (registry[key]) {
          registry[key] = { ...registry[key], displayName: name }
          saveRegistry(registry)
        }
      }
      return { ...s, user: updated }
    })
  }, [])

  const refreshAuthUser = useCallback(async () => {
    const raw = loadStored()
    setState((s) => ({ ...s, user: raw ? withAdminFlag(raw) : null, isReady: true }))
  }, [])

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<{ ok: boolean; error?: string }> => {
      const user = loadStored()
      if (!user || user.provider !== 'email' || !user.email) {
        return { ok: false, error: 'Changement de mot de passe réservé aux comptes email.' }
      }
      if (newPassword.length < 6) {
        return { ok: false, error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' }
      }
      const registry = loadRegistry()
      const key = user.email.toLowerCase()
      const reg = registry[key]
      if (!reg) return { ok: false, error: 'Compte introuvable.' }
      const currentOk = await verifyEmailPassword(reg, currentPassword)
      if (!currentOk) return { ok: false, error: 'Mot de passe actuel incorrect.' }
      const { salt, passwordHash } = await hashPasswordForStorage(newPassword)
      registry[key] = { id: reg.id, displayName: reg.displayName, salt, passwordHash }
      saveRegistry(registry)
      return { ok: true }
    },
    [],
  )

  const value: AuthContextValue = {
    ...state,
    login,
    loginWithEmail,
    signUpWithEmail,
    loginWithOAuthProvider,
    logout,
    updateProfile,
    changePassword,
    authNotice,
    clearAuthNotice,
    refreshAuthUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isReady: false })
  const [authNotice, setAuthNotice] = useState<string | null>(null)
  const clearAuthNotice = useCallback(() => setAuthNotice(null), [])

  useEffect(() => {
    const sb = getSupabaseBrowserClient()
    if (!sb) {
      setState({ user: null, isReady: true })
      return
    }
    void sb.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ? mapSupabaseUser(session.user) : null,
        isReady: true,
      })
    })
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, session) => {
      setState((prev) => ({
        ...prev,
        user: session?.user ? mapSupabaseUser(session.user) : null,
        isReady: true,
      }))
      if (event === 'SIGNED_IN' && session?.user) {
        void logSiteActivity('auth_sign_in', { metadata: { provider: session.user.app_metadata?.provider } })
      }
      if (event === 'SIGNED_OUT') {
        void logSiteActivity('auth_sign_out')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const refreshAuthUser = useCallback(async () => {
    const sb = getSupabaseBrowserClient()
    if (!sb) return
    const {
      data: { user },
    } = await sb.auth.getUser()
    setState((prev) => ({
      ...prev,
      user: user ? mapSupabaseUser(user) : null,
      isReady: true,
    }))
  }, [])

  const login = useCallback((_user: AuthUser) => {
    /* réservé au mode local */
  }, [])

  const loginWithEmail = useCallback(async (email: string, password: string): Promise<boolean> => {
    const sb = getSupabaseBrowserClient()
    if (!sb) return false
    setAuthNotice(null)
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password })
    if (error || !data.user) return false
    return true
  }, [])

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName?: string): Promise<boolean> => {
      const sb = getSupabaseBrowserClient()
      if (!sb) return false
      setAuthNotice(null)
      const name = (displayName || email.trim().split('@')[0]).trim() || 'Supporteur'
      const { data, error } = await sb.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: name },
          // Même logique que OAuth : le mail de confirmation doit renvoyer vers l’URL réelle (Vercel, etc.)
          emailRedirectTo: getSupabaseOAuthRedirectTo(),
        },
      })
      if (error) {
        setAuthNotice(error.message)
        return false
      }
      if (data.session && data.user) {
        return true
      }
      setAuthNotice(
        'Compte créé : vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi. (Tu peux désactiver la confirmation email dans le tableau Supabase → Authentication.)',
      )
      return false
    },
    [],
  )

  const loginWithOAuthProvider = useCallback(async (provider: TalkFootOauthProviderId): Promise<boolean> => {
    const sb = getSupabaseBrowserClient()
    if (!sb) {
      setAuthNotice('Supabase non configuré (VITE_SUPABASE_URL / ANON_KEY).')
      return false
    }
    setAuthNotice(null)
    const redirectTo = getSupabaseOAuthRedirectTo()
    const { error } = await sb.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined,
      },
    })
    if (error) {
      setAuthNotice(error.message)
      return false
    }
    return true
  }, [])

  const logout = useCallback(async () => {
    const sb = getSupabaseBrowserClient()
    await sb?.auth.signOut()
  }, [])

  const updateProfile = useCallback((displayName: string) => {
    const name = displayName.trim() || 'Supporteur'
    void (async () => {
      const sb = getSupabaseBrowserClient()
      if (!sb) return
      const { data: u } = await sb.auth.getUser()
      if (!u.user) return
      await sb.auth.updateUser({ data: { display_name: name } })
      await sb.from('profiles').update({ display_name: name }).eq('id', u.user.id)
      setState((s) => (s.user ? { ...s, user: withAdminFlag({ ...s.user, displayName: name }) } : s))
    })()
  }, [])

  const changePassword = useCallback(
    async (_currentPassword: string, newPassword: string): Promise<{ ok: boolean; error?: string }> => {
      if (newPassword.length < 6) {
        return { ok: false, error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' }
      }
      const sb = getSupabaseBrowserClient()
      if (!sb) return { ok: false, error: 'Client indisponible.' }
      const { error } = await sb.auth.updateUser({ password: newPassword })
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    },
    [],
  )

  const value: AuthContextValue = {
    ...state,
    login,
    loginWithEmail,
    signUpWithEmail,
    loginWithOAuthProvider,
    logout,
    updateProfile,
    changePassword,
    authNotice,
    clearAuthNotice,
    refreshAuthUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (isSupabaseConfigured()) {
    return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>
  }
  return <LocalAuthProvider>{children}</LocalAuthProvider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
