import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AUTH_KEY = 'talkfoot.auth.v1'
const AUTH_REGISTRY_KEY = 'talkfoot.auth.registry.v1' // email -> { id, displayName, password }

export type AuthUser = {
  id: string
  email?: string
  displayName: string
  provider: 'email' | 'google' | 'apple'
  avatarUrl?: string
}

type AuthState = {
  user: AuthUser | null
  isReady: boolean
}

type AuthContextValue = AuthState & {
  login: (user: AuthUser) => void
  loginWithEmail: (email: string, password: string) => boolean
  signUpWithEmail: (email: string, password: string, displayName?: string) => boolean
  loginWithGoogle: () => void
  loginWithApple: () => void
  logout: () => void
  updateProfile: (displayName: string) => void
  changePassword: (currentPassword: string, newPassword: string) => { ok: boolean; error?: string }
}

const AuthContext = createContext<AuthContextValue | null>(null)

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
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(AUTH_KEY)
    }
  } catch {
    // ignore
  }
}

type EmailUser = { id: string; displayName: string; password: string }

function loadRegistry(): Record<string, EmailUser> {
  try {
    const raw = localStorage.getItem(AUTH_REGISTRY_KEY)
    return raw ? (JSON.parse(raw) as Record<string, EmailUser>) : {}
  } catch {
    return {}
  }
}

function saveRegistry(registry: Record<string, EmailUser>) {
  try {
    localStorage.setItem(AUTH_REGISTRY_KEY, JSON.stringify(registry))
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isReady: false,
  })

  useEffect(() => {
    const user = loadStored()
    setState({ user, isReady: true })
  }, [])

  const login = useCallback((user: AuthUser) => {
    saveStored(user)
    setState((s) => ({ ...s, user }))
  }, [])

  const loginWithEmail = useCallback((email: string, password: string): boolean => {
    if (!email.trim() || !password) return false
    const key = email.trim().toLowerCase()
    const registry = loadRegistry()
    const existing = registry[key]
    if (existing) {
      if (existing.password !== password) return false
      login({ id: existing.id, email: email.trim(), displayName: existing.displayName, provider: 'email' })
      return true
    }
    const reg: EmailUser = {
      id: `email-${Date.now()}`,
      displayName: email.trim().split('@')[0],
      password,
    }
    registry[key] = reg
    saveRegistry(registry)
    login({ id: reg.id, email: email.trim(), displayName: reg.displayName, provider: 'email' })
    return true
  }, [login])

  const signUpWithEmail = useCallback(
    (email: string, password: string, displayName?: string): boolean => {
      if (!email.trim() || !password) return false
      const key = email.trim().toLowerCase()
      const registry = loadRegistry()
      if (registry[key]) return false
      const name = (displayName || email.trim().split('@')[0]).trim() || 'Supporteur'
      const reg: EmailUser = { id: `email-${Date.now()}`, displayName: name, password }
      registry[key] = reg
      saveRegistry(registry)
      login({ id: reg.id, email: email.trim(), displayName: reg.displayName, provider: 'email' })
      return true
    },
    [login],
  )

  const loginWithGoogle = useCallback(() => {
    // Simulation : en production, intégrer Google Sign-In (Firebase, Auth0, etc.)
    login({
      id: `google-${Date.now()}`,
      email: 'utilisateur@gmail.com',
      displayName: 'You',
      provider: 'google',
      avatarUrl: undefined,
    })
  }, [login])

  const loginWithApple = useCallback(() => {
    // Simulation : en production, intégrer Sign in with Apple
    login({
      id: `apple-${Date.now()}`,
      displayName: 'You',
      provider: 'apple',
    })
  }, [login])

  const logout = useCallback(() => {
    saveStored(null)
    setState((s) => ({ ...s, user: null }))
  }, [])

  const updateProfile = useCallback((displayName: string) => {
    const name = displayName.trim() || 'Supporteur'
    setState((s) => {
      if (!s.user) return s
      const updated = { ...s.user, displayName: name }
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

  const changePassword = useCallback(
    (currentPassword: string, newPassword: string): { ok: boolean; error?: string } => {
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
      if (!reg || reg.password !== currentPassword) {
        return { ok: false, error: 'Mot de passe actuel incorrect.' }
      }
      registry[key] = { ...reg, password: newPassword }
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
    loginWithGoogle,
    loginWithApple,
    logout,
    updateProfile,
    changePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
