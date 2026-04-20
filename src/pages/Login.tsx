import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { cn } from '../utils/cn'
import { LogoMark } from '../layout/LogoMark'
import { useAppearance } from '../contexts/AppearanceContext'
import { ThemeAppearanceToggle } from '../components/ui/ThemeAppearanceToggle'
import { markPendingFanOnboardingAfterLogin } from '../constants/fanSession'
import { safeInternalNext } from '../utils/safeInternalPath'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { TALKFOOT_OAUTH_PROVIDERS, type TalkFootOauthProviderId } from '../config/oauthProviders'
import { OAuthProviderIcon } from '../components/auth/OAuthProviderIcon'
import { containsBannedWord, MODERATION_REFUSED_MESSAGE_FR } from '../utils/bannedWords'

type Mode = 'login' | 'signup'

function oauthButtonShell(variant: (typeof TALKFOOT_OAUTH_PROVIDERS)[number]['variant']) {
  const base =
    'flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold shadow-sm transition focus:outline-none focus:ring-2'
  switch (variant) {
    case 'google':
      return cn(
        base,
        'border-slate-200/80 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300 focus:ring-tf-grey/30',
      )
    case 'apple':
      return cn(base, 'border-slate-800 bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-500')
    case 'facebook':
      return cn(
        base,
        'border-[#166fe5] bg-[#1877F2] text-white hover:bg-[#166fe5] focus:ring-blue-400/50',
      )
    case 'discord':
      return cn(
        base,
        'border-[#4752c4] bg-[#5865F2] text-white hover:bg-[#4752c4] focus:ring-indigo-400/50',
      )
    case 'github':
      return cn(base, 'border-slate-700 bg-slate-800 text-white hover:bg-slate-700 focus:ring-slate-500')
    default:
      return base
  }
}

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const nextPath = safeInternalNext(searchParams.get('next'))
  const {
    user,
    isReady,
    loginWithEmail,
    signUpWithEmail,
    loginWithOAuthProvider,
    authNotice,
    clearAuthNotice,
  } = useAuth()
  const { appearance } = useAppearance()
  const isLight = appearance === 'light'
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<null | TalkFootOauthProviderId>(null)

  if (!isReady) {
    return (
      <div className="relative flex min-h-dvh items-center justify-center">
        <div className="tf-page-backdrop" aria-hidden />
        <div className="relative text-sm font-semibold text-tf-grey">Chargement…</div>
      </div>
    )
  }
  if (user) {
    return <Navigate to={nextPath ?? '/'} replace />
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (mode === 'signup') {
      if (!acceptedPrivacy) {
        setError('Tu dois accepter la politique de confidentialité pour créer un compte.')
        return
      }
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.')
        return
      }
      if (password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères.')
        return
      }
      const signupName = (displayName || email.trim().split('@')[0]).trim() || 'Supporteur'
      if (containsBannedWord(signupName)) {
        setError(MODERATION_REFUSED_MESSAGE_FR)
        return
      }
      setSubmitting(true)
      try {
        const ok = await signUpWithEmail(email, password, displayName || undefined)
        if (!ok) {
          setError('Cet email est déjà utilisé ou les champs sont invalides.')
          return
        }
        markPendingFanOnboardingAfterLogin()
      } finally {
        setSubmitting(false)
      }
    } else {
      setSubmitting(true)
      try {
        const ok = await loginWithEmail(email, password)
        if (!ok) {
          setError('Email ou mot de passe incorrect.')
          return
        }
        markPendingFanOnboardingAfterLogin()
      } finally {
        setSubmitting(false)
      }
    }
  }

  const runOAuth = async (which: TalkFootOauthProviderId) => {
    setError(null)
    setOauthLoading(which)
    try {
      const ok = await loginWithOAuthProvider(which)
      if (ok && !isSupabaseConfigured()) markPendingFanOnboardingAfterLogin()
    } finally {
      setOauthLoading(null)
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-transparent p-4">
      <div className="tf-page-backdrop" aria-hidden />
      <div className="absolute right-3 top-3 z-10 sm:right-5 sm:top-5">
        <ThemeAppearanceToggle variant="floating" className="shadow-sm" />
      </div>
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark variant="hero" className="max-w-[220px]" decorative={false} />
          <h1 className="sr-only">Talk Foot</h1>
          <p
            className={cn(
              'mt-4 text-sm font-semibold',
              isLight ? 'text-tf-dark/72' : 'text-slate-200',
            )}
          >
            Rejoins la communauté foot en direct
          </p>
        </div>

        <Card
          className="border-white/45 bg-white/[0.88] p-6 shadow-tf-glass backdrop-blur-xl sm:p-8"
          elevation="soft"
        >
          <div className="flex gap-1 rounded-xl bg-tf-grey-pastel/40 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError(null)
                clearAuthNotice()
                setAcceptedPrivacy(false)
              }}
              className={cn(
                'flex-1 rounded-lg px-4 py-2 text-sm font-bold transition',
                mode === 'login'
                  ? 'bg-white text-tf-dark shadow-sm'
                  : 'text-tf-grey hover:text-tf-dark',
              )}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setError(null)
                clearAuthNotice()
                setAcceptedPrivacy(false)
              }}
              className={cn(
                'flex-1 rounded-lg px-4 py-2 text-sm font-bold transition',
                mode === 'signup'
                  ? 'bg-white text-tf-dark shadow-sm'
                  : 'text-tf-grey hover:text-tf-dark',
              )}
            >
              Créer un compte
            </button>
          </div>

          {authNotice && (
            <div
              role="status"
              className="mt-6 rounded-xl border border-sky-200/80 bg-sky-50/95 p-3 text-xs font-medium text-sky-950"
            >
              <div className="flex gap-2">
                <p className="min-w-0 flex-1 leading-snug">{authNotice}</p>
                <button
                  type="button"
                  onClick={() => clearAuthNotice()}
                  className="shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-bold text-sky-800 hover:bg-sky-100"
                >
                  OK
                </button>
              </div>
            </div>
          )}

          <h2 className="mt-6 text-lg font-black text-tf-dark">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h2>
          <p className="mt-1 text-sm font-medium text-tf-grey">
            {mode === 'login'
              ? 'Connecte-toi pour accéder au live et aux paris'
              : 'Rejoins la communauté Talk Foot en quelques secondes'}
          </p>

          <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="signup-displayName" className="mb-1 block text-xs font-bold text-tf-grey">
                  Nom d&apos;affichage (optionnel)
                </label>
                <Input
                  id="signup-displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ton pseudo"
                  autoComplete="username"
                  className="w-full rounded-xl border-tf-grey-pastel/50"
                />
              </div>
            )}
            <div>
              <label htmlFor="login-email" className="mb-1 block text-xs font-bold text-tf-grey">
                Email
              </label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="toi@exemple.com"
                autoComplete="email"
                className="w-full rounded-xl border-tf-grey-pastel/50"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="mb-1 block text-xs font-bold text-tf-grey">
                Mot de passe
              </label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? '6 caractères minimum' : '••••••••'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="w-full rounded-xl border-tf-grey-pastel/50"
              />
            </div>
            {mode === 'signup' && (
              <div>
                <label htmlFor="login-confirm" className="mb-1 block text-xs font-bold text-tf-grey">
                  Confirmer le mot de passe
                </label>
                <Input
                  id="login-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full rounded-xl border-tf-grey-pastel/50"
                />
              </div>
            )}
            {mode === 'signup' && (
              <label className="flex cursor-pointer items-start gap-2.5 text-xs font-medium text-tf-dark">
                <input
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 rounded border-tf-grey-pastel text-tf-cta focus:ring-tf-cta"
                />
                <span>
                  J&apos;ai lu la{' '}
                  <Link to="/privacy" className="font-bold text-tf-cta underline-offset-2 hover:underline">
                    politique de confidentialité
                  </Link>{' '}
                  et j&apos;accepte le stockage des données nécessaires sur mon appareil.
                </span>
              </label>
            )}
            {error && (
              <p className="text-sm font-semibold text-rose-600">{error}</p>
            )}
            <Button
              type="submit"
              variant="primary"
              className="w-full rounded-xl py-3 font-bold"
              disabled={submitting}
            >
              {submitting ? 'Patience…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </Button>
          </form>

          <p className="mt-4 text-center text-[11px] font-medium text-tf-grey">
            <Link to="/privacy" className="font-bold text-tf-cta underline-offset-2 hover:underline">
              Confidentialité & données
            </Link>
          </p>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-tf-grey-pastel/60" />
            <span className="text-xs font-semibold text-tf-grey">ou</span>
            <div className="h-px flex-1 bg-tf-grey-pastel/60" />
          </div>

          <p className="mt-2 text-center text-[11px] font-medium leading-snug text-tf-grey">
            {isSupabaseConfigured() ? (
              <>
                Connexion réelle via Supabase : Google, Apple, Facebook, Discord, GitHub. Active chaque
                fournisseur dans le tableau Supabase (Authentication → Providers) et ajoute l’URL de retour
                (Redirect URLs). En continuant, tu reconnais la{' '}
                <Link to="/privacy" className="font-bold text-tf-cta underline-offset-2 hover:underline">
                  politique de confidentialité
                </Link>
                .
              </>
            ) : (
              <>
                Mode local sans Supabase : les boutons ci-dessous simulent une connexion (maquette). Pour une
                vraie OAuth, renseigne <span className="font-mono text-[10px]">VITE_SUPABASE_URL</span> et{' '}
                <span className="font-mono text-[10px]">VITE_SUPABASE_ANON_KEY</span>.{' '}
                <Link to="/privacy" className="font-bold text-tf-cta underline-offset-2 hover:underline">
                  Confidentialité
                </Link>
                .
              </>
            )}
          </p>

          <div className="mt-6 space-y-3">
            {TALKFOOT_OAUTH_PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => runOAuth(p.id)}
                disabled={oauthLoading !== null}
                className={cn(
                  oauthButtonShell(p.variant),
                  oauthLoading !== null && 'pointer-events-none opacity-60',
                )}
              >
                <OAuthProviderIcon id={p.id} />
                {oauthLoading === p.id ? 'Redirection…' : p.label}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
