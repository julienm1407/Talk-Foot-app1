import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { useAuth as useClerkAuth, useClerk, useSignIn, useSignUp, useUser } from '@clerk/clerk-react'
import { isAdminEmail } from '../config/adminAccess'
import { hashPasswordForStorage, verifyPasswordAgainstStored } from '../utils/passwordHash'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { getSupabaseOAuthRedirectTo, getSupabasePasswordResetRedirectTo } from '../lib/supabase/oauthRedirect'
import { resolveLocalLoginEmail, resolveLoginEmail } from '../lib/supabase/loginIdentifier'
import { logSiteActivity } from '../lib/activityLog'
import { isCloudAdminEmail } from '../lib/supabase/adminUsers'
import {
  isTalkFootOAuthProvider,
  type TalkFootOauthProviderId,
} from '../config/oauthProviders'
import { containsBannedWord } from '../utils/bannedWords'
import { checkDisplayNameAvailabilityCloud } from '../lib/supabase/displayName'
import { sanitizeDisplayNameInput, validateDisplayNameFormat } from '../utils/displayNameRules'

const AUTH_KEY = 'talkfoot.auth.v1'
const AUTH_REGISTRY_KEY = 'talkfoot.auth.registry.v1'

export function isClerkAuthConfigured(): boolean {
  return Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim())
}

export type AuthUser = {
  id: string
  email?: string
  displayName: string
  /** Connexion email/mot de passe, ou fournisseur OAuth Talk Foot, ou autre OAuth Supabase. */
  provider: 'email' | TalkFootOauthProviderId | 'oauth'
  avatarUrl?: string
  isAdmin?: boolean
  /** Session Supabase « invité » (sans email / OAuth) — pas d’accès tribunes membres synchronisés. */
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

/** Inscription email : session immédiate, confirmation mail, ou échec. */
export type SignUpEmailResult =
  | { status: 'signed_in' }
  | { status: 'confirm_email'; email: string }
  | { status: 'error'; message: string }

export type LoginEmailResult =
  | { status: 'success' }
  | { status: 'email_not_verified'; email: string }
  | { status: 'failure'; message?: string }

export type PasswordResetRequestResult =
  | { status: 'sent' }
  | { status: 'error'; message: string }

export type AuthContextValue = AuthState & {
  login: (user: AuthUser) => void
  /** Connexion par email ou pseudo + mot de passe. */
  loginWithEmail: (identifier: string, password: string) => Promise<LoginEmailResult>
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<SignUpEmailResult>
  /** Demande de réinitialisation (email ou pseudo). */
  requestPasswordReset: (identifier: string) => Promise<PasswordResetRequestResult>
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
    async (identifier: string, password: string): Promise<LoginEmailResult> => {
      if (!identifier.trim() || !password) {
        return { status: 'failure', message: 'Identifiant et mot de passe requis.' }
      }
      const registry = loadRegistry()
      const key = resolveLocalLoginEmail(identifier, registry)
      if (!key) {
        return { status: 'failure', message: 'Email, pseudo ou mot de passe incorrect.' }
      }
      const existing = registry[key]
      if (existing) {
        const ok = await verifyEmailPassword(existing, password)
        if (!ok) return { status: 'failure', message: 'Email, pseudo ou mot de passe incorrect.' }
        if (existing.password !== undefined && !existing.passwordHash) {
          await migrateLegacyPassword(registry, key, existing, password)
        }
        login({
          id: existing.id,
          email: key,
          displayName: existing.displayName,
          provider: 'email',
        })
        return { status: 'success' }
      }
      if (!identifier.trim().includes('@')) {
        return { status: 'failure', message: 'Email, pseudo ou mot de passe incorrect.' }
      }
      const { salt, passwordHash } = await hashPasswordForStorage(password)
      const reg: StoredEmailUser = {
        id: `email-${Date.now()}`,
        displayName: identifier.trim().split('@')[0],
        salt,
        passwordHash,
      }
      registry[key] = reg
      saveRegistry(registry)
      login({ id: reg.id, email: key, displayName: reg.displayName, provider: 'email' })
      return { status: 'success' }
    },
    [login],
  )

  const requestPasswordReset = useCallback(async (): Promise<PasswordResetRequestResult> => {
    return {
      status: 'error',
      message: 'Réinitialisation indisponible en mode local. Utilise Supabase pour cette fonctionnalité.',
    }
  }, [])

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName?: string): Promise<SignUpEmailResult> => {
      if (!email.trim() || !password) {
        return { status: 'error', message: 'Email et mot de passe requis.' }
      }
      const key = email.trim().toLowerCase()
      const registry = loadRegistry()
      if (registry[key]) {
        return { status: 'error', message: 'Cet email est déjà utilisé.' }
      }
      const name = (displayName || email.trim().split('@')[0]).trim() || 'Supporteur'
      if (containsBannedWord(name)) {
        return { status: 'error', message: 'Pseudo ou nom d’affichage non autorisé.' }
      }
      const { salt, passwordHash } = await hashPasswordForStorage(password)
      registry[key] = { id: `email-${Date.now()}`, displayName: name, salt, passwordHash }
      saveRegistry(registry)
      login({ id: registry[key].id, email: email.trim(), displayName: name, provider: 'email' })
      return { status: 'signed_in' }
    },
    [login],
  )

  const loginWithOAuthProvider = useCallback(
    async (provider: TalkFootOauthProviderId) => {
      if (provider !== 'google') return false
      login({
        id: `${provider}-${Date.now()}`,
        email: `${provider}@demo.talkfoot.local`,
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
    if (containsBannedWord(name)) return
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
    requestPasswordReset,
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

    let cancelled = false
    const hydratedRef = { current: false }

    const applySession = async (session: Session | null) => {
      if (cancelled) return
      hydratedRef.current = true
      if (!session?.user) {
        setState({
          user: null,
          isReady: true,
        })
        return
      }
      const mapped = mapSupabaseUser(session.user)
      const cloudAdmin = await isCloudAdminEmail(sb, mapped.email)
      const merged = cloudAdmin ? { ...mapped, isAdmin: true } : mapped
      if (cancelled) return
      setState({
        user: merged,
        isReady: true,
      })
    }

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, session) => {
      void applySession(session)
      if (event === 'SIGNED_IN' && session?.user) {
        void logSiteActivity('auth_sign_in', { metadata: { provider: session.user.app_metadata?.provider } })
      }
      if (event === 'SIGNED_OUT') {
        void logSiteActivity('auth_sign_out')
      }
    })

    // Évite la course refresh : getSession() peut répondre null avant que le stockage PKCE soit prêt,
    // alors que onAuthStateChange (INITIAL_SESSION) fournit la session. Filet si l’écouteur tarde.
    const fallbackTimer = window.setTimeout(() => {
      if (cancelled || hydratedRef.current) return
      void sb.auth.getSession().then(({ data: { session } }) => {
        if (cancelled || hydratedRef.current) return
        void applySession(session)
      })
    }, 200)

    return () => {
      cancelled = true
      window.clearTimeout(fallbackTimer)
      subscription.unsubscribe()
    }
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

  const loginWithEmail = useCallback(async (identifier: string, password: string): Promise<LoginEmailResult> => {
    const sb = getSupabaseBrowserClient()
    if (!sb) return { status: 'failure', message: 'Supabase non configuré.' }
    setAuthNotice(null)
    const trimmed = identifier.trim()
    if (!trimmed || !password) {
      return { status: 'failure', message: 'Identifiant et mot de passe requis.' }
    }
    const resolvedEmail = await resolveLoginEmail(sb, trimmed)
    if (!resolvedEmail) {
      return { status: 'failure', message: 'Email, pseudo ou mot de passe incorrect.' }
    }
    const { data, error } = await sb.auth.signInWithPassword({ email: resolvedEmail, password })
    if (error || !data.user) {
      if (isEmailNotVerifiedMessage(error?.code, error?.message)) {
        return { status: 'email_not_verified', email: resolvedEmail }
      }
      return { status: 'failure', message: 'Email, pseudo ou mot de passe incorrect.' }
    }
    return { status: 'success' }
  }, [])

  const requestPasswordReset = useCallback(async (identifier: string): Promise<PasswordResetRequestResult> => {
    const sb = getSupabaseBrowserClient()
    if (!sb) return { status: 'error', message: 'Supabase non configuré.' }
    const trimmed = identifier.trim()
    if (!trimmed) {
      return { status: 'error', message: 'Indique ton email ou ton pseudo.' }
    }
    const resolvedEmail = await resolveLoginEmail(sb, trimmed)
    if (!resolvedEmail) {
      // Ne pas révéler si le compte existe.
      return { status: 'sent' }
    }
    const { error } = await sb.auth.resetPasswordForEmail(resolvedEmail, {
      redirectTo: getSupabasePasswordResetRedirectTo(),
    })
    if (error) {
      const msg = /rate limit/i.test(error.message ?? '')
        ? 'Trop de mails envoyés récemment. Réessaie dans une heure.'
        : error.message
      return { status: 'error', message: msg }
    }
    return { status: 'sent' }
  }, [])

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName?: string): Promise<SignUpEmailResult> => {
      const sb = getSupabaseBrowserClient()
      if (!sb) {
        return { status: 'error', message: 'Supabase non configuré.' }
      }
      setAuthNotice(null)
      const name = sanitizeDisplayNameInput(
        (displayName || email.trim().split('@')[0]).trim() || 'Supporteur',
      )
      const formatErr = validateDisplayNameFormat(name)
      if (formatErr) {
        return { status: 'error', message: formatErr }
      }
      if (containsBannedWord(name)) {
        return { status: 'error', message: 'Pseudo ou nom d’affichage non autorisé.' }
      }
      const availability = await checkDisplayNameAvailabilityCloud(sb, name)
      if (!availability.available) {
        const hint =
          availability.error === 'taken' && availability.suggestions?.length
            ? ` Suggestions : ${availability.suggestions.join(', ')}`
            : ''
        return { status: 'error', message: `${availability.message}${hint}` }
      }
      const { data, error } = await sb.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: availability.displayName },
          // Même logique que OAuth : le mail de confirmation doit renvoyer vers l’URL réelle (Vercel, etc.)
          emailRedirectTo: getSupabaseOAuthRedirectTo(),
        },
      })
      if (error) {
        return { status: 'error', message: error.message }
      }
      if (!data.user) {
        return { status: 'error', message: 'Inscription impossible. Réessaie dans un instant.' }
      }
      if (data.session) {
        return { status: 'signed_in' }
      }
      // Supabase renvoie identities vide si l’email est déjà inscrit (sans erreur explicite).
      if (!data.user.identities?.length) {
        return {
          status: 'error',
          message:
            'Cet email est peut-être déjà utilisé. Connecte-toi ou utilise la réinitialisation du mot de passe si besoin.',
        }
      }
      setAuthNotice(
        'Compte créé : un lien de confirmation vient d’être envoyé par email. Ouvre ta boîte mail pour activer ton compte.',
      )
      return { status: 'confirm_email', email: email.trim() }
    },
    [],
  )

  const loginWithOAuthProvider = useCallback(async (provider: TalkFootOauthProviderId): Promise<boolean> => {
    if (provider !== 'google') return false
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
    if (containsBannedWord(name)) return
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
    requestPasswordReset,
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

function clerkAuthProviderErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'errors' in err) {
    const first = (err as { errors?: { longMessage?: string; message?: string }[] }).errors?.[0]
    return first?.longMessage || first?.message || fallback
  }
  if (err instanceof Error && err.message.trim()) return err.message
  return fallback
}

function isEmailNotVerifiedMessage(code?: string | null, message?: string | null): boolean {
  const c = (code ?? '').toLowerCase()
  const m = (message ?? '').toLowerCase()
  return (
    c === 'email_not_confirmed' ||
    m.includes('email not confirmed') ||
    m.includes('not verified') ||
    m.includes('email address is not verified') ||
    (m.includes('confirm') && m.includes('email'))
  )
}

function ClerkAuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: userLoaded } = useUser()
  const { isSignedIn, userId, isLoaded: clerkAuthLoaded } = useClerkAuth()
  const clerk = useClerk()
  const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn()
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp()
  const [authNotice, setAuthNotice] = useState<string | null>(null)
  const clearAuthNotice = useCallback(() => setAuthNotice(null), [])
  const stableUserRef = useRef<AuthUser | null>(null)
  const isLoaded = clerkAuthLoaded && userLoaded && signInLoaded && signUpLoaded

  const mappedUser: AuthUser | null = useMemo(() => {
    if (!isSignedIn || !userId) {
      stableUserRef.current = null
      return null
    }

    if (user) {
      const next = withAdminFlag({
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        displayName:
          [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
          user.username ||
          user.primaryEmailAddress?.emailAddress?.split('@')[0] ||
          'Supporteur',
        provider: user.externalAccounts?.some((a) => a.provider === 'google') ? 'google' : 'email',
        avatarUrl: user.imageUrl,
      })
      stableUserRef.current = next
      return next
    }

    if (stableUserRef.current?.id === userId) {
      return stableUserRef.current
    }

    const fallback = withAdminFlag({
      id: userId,
      displayName: 'Supporteur',
      provider: 'email',
    })
    stableUserRef.current = fallback
    return fallback
  }, [user, isSignedIn, userId])

  const login = useCallback((_user: AuthUser) => {
    /* géré par Clerk */
  }, [])

  const loginWithEmail = useCallback(
    async (identifier: string, password: string): Promise<LoginEmailResult> => {
      if (!signIn) return { status: 'failure', message: 'Connexion indisponible.' }
      setAuthNotice(null)
      const trimmed = identifier.trim()
      try {
        const result = await signIn.create({ identifier: trimmed, password })
        if (result.status === 'complete' && result.createdSessionId) {
          await setSignInActive({ session: result.createdSessionId })
          return { status: 'success' }
        }
        return { status: 'failure', message: 'Connexion impossible. Vérifie ton identifiant et ton mot de passe.' }
      } catch (err) {
        const message = clerkAuthProviderErrorMessage(err, 'Email, pseudo ou mot de passe incorrect.')
        if (isEmailNotVerifiedMessage(null, message)) {
          return { status: 'email_not_verified', email: trimmed }
        }
        setAuthNotice(message)
        return { status: 'failure', message }
      }
    },
    [signIn, setSignInActive],
  )

  const requestPasswordReset = useCallback(
    async (identifier: string): Promise<PasswordResetRequestResult> => {
      if (!signIn) return { status: 'error', message: 'Réinitialisation indisponible.' }
      const trimmed = identifier.trim()
      if (!trimmed) return { status: 'error', message: 'Indique ton email ou ton pseudo.' }
      try {
        await signIn.create({
          strategy: 'reset_password_email_code',
          identifier: trimmed,
        })
        return { status: 'sent' }
      } catch (err) {
        return {
          status: 'error',
          message: clerkAuthProviderErrorMessage(err, 'Impossible d’envoyer le mail de réinitialisation.'),
        }
      }
    },
    [signIn],
  )

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName?: string): Promise<SignUpEmailResult> => {
      if (!signUp) {
        return { status: 'error', message: 'Inscription indisponible, réessaie dans un instant.' }
      }
      setAuthNotice(null)
      const name = (displayName || email.trim().split('@')[0]).trim() || 'Supporteur'
      try {
        await signUp.create({
          emailAddress: email.trim(),
          password,
          firstName: name,
        })
        if (signUp.status === 'complete' && signUp.createdSessionId) {
          await setSignUpActive({ session: signUp.createdSessionId })
          return { status: 'signed_in' }
        }
        if (signUp.unverifiedFields?.includes('email_address')) {
          const base = window.location.origin + (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')
          await signUp.prepareEmailAddressVerification({
            strategy: 'email_link',
            redirectUrl: `${base}/login`,
          })
        }
        setAuthNotice(
          'Compte créé : un lien de confirmation vient d’être envoyé par email. Ouvre ta boîte mail pour activer ton compte.',
        )
        return { status: 'confirm_email', email: email.trim() }
      } catch (err) {
        return {
          status: 'error',
          message: clerkAuthProviderErrorMessage(err, 'Inscription impossible. Réessaie avec un autre email.'),
        }
      }
    },
    [signUp, setSignUpActive],
  )

  const loginWithOAuthProvider = useCallback(
    async (provider: TalkFootOauthProviderId): Promise<boolean> => {
      if (provider !== 'google') return false
      const next = new URLSearchParams(window.location.search).get('next') || '/'
      const fallback = next.startsWith('/') ? next : '/'
      setAuthNotice(null)
      if (signIn) {
        try {
          const base = window.location.origin + (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')
          await signIn.authenticateWithRedirect({
            strategy: 'oauth_google',
            redirectUrl: `${base}/login/sso-callback`,
            redirectUrlComplete: fallback,
          })
          return true
        } catch {
          /* repli Clerk hébergé */
        }
      }
      await clerk.redirectToSignIn({ signInFallbackRedirectUrl: fallback })
      return true
    },
    [clerk, signIn],
  )

  const logout = useCallback(async () => {
    await clerk.signOut()
  }, [clerk])

  const updateProfile = useCallback(
    (displayName: string) => {
      const name = displayName.trim()
      if (!name || !user) return
      void user.update({ firstName: name, lastName: '', username: name })
    },
    [user],
  )

  const changePassword = useCallback(
    async (_currentPassword: string, _newPassword: string): Promise<{ ok: boolean; error?: string }> => {
      return { ok: false, error: 'Gestion du mot de passe via Clerk Dashboard.' }
    },
    [],
  )

  const refreshAuthUser = useCallback(async () => {
    await clerk.user?.reload()
  }, [clerk.user])

  const value: AuthContextValue = {
    user: mappedUser,
    isReady: isLoaded,
    login,
    loginWithEmail,
    signUpWithEmail,
    requestPasswordReset,
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
  if (isClerkAuthConfigured()) {
    return <ClerkAuthProvider>{children}</ClerkAuthProvider>
  }
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
