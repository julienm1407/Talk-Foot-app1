import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { isClerkAuthConfigured, useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { cn } from '../utils/cn'
import { LogoEncart } from '../layout/LogoMark'
import { useAppearance } from '../contexts/AppearanceContext'
import { ThemeAppearanceToggle } from '../components/ui/ThemeAppearanceToggle'
import { markPendingFanOnboardingAfterLogin } from '../constants/fanSession'
import { safeInternalNext } from '../utils/safeInternalPath'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { LOGIN_OAUTH_PROVIDERS, type TalkFootOauthProviderId } from '../config/oauthProviders'
import { OAuthProviderIcon } from '../components/auth/OAuthProviderIcon'
import { containsBannedWord, MODERATION_REFUSED_MESSAGE_FR } from '../utils/bannedWords'
import { sanitizeDisplayNameInput, validateDisplayNameFormat } from '../utils/displayNameRules'
import { useDisplayNameAvailabilityHint } from '../hooks/useDisplayNameAvailabilityHint'
import { DisplayNameAvailabilityHint } from '../components/auth/DisplayNameAvailabilityHint'

type Mode = 'login' | 'signup'

const GOOGLE_BUTTON_CLASS = cn(
  'flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold shadow-sm transition focus:outline-none focus:ring-2',
  'border-slate-200/80 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300 focus:ring-tf-grey/30',
)

export function LoginPage() {
  const navigate = useNavigate()
  const clerkEnabled = isClerkAuthConfigured()
  const [searchParams] = useSearchParams()
  const nextPath = safeInternalNext(searchParams.get('next'))
  const cameFromSharedSpace = searchParams.get('gate') === 'shared'
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
  const [oauthLoading, setOauthLoading] = useState(false)
  const pseudoHint = useDisplayNameAvailabilityHint(displayName, {
    enabled: mode === 'signup' && isSupabaseConfigured() && !clerkEnabled,
  })
  const pseudoBlocked =
    mode === 'signup' &&
    !clerkEnabled &&
    (pseudoHint.status === 'taken' ||
      pseudoHint.status === 'invalid' ||
      pseudoHint.status === 'checking' ||
      pseudoHint.status === 'error')
  const backLabel = nextPath ? 'Retour' : 'Retour à l’accueil'

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
      const signupName = sanitizeDisplayNameInput(
        (displayName || email.trim().split('@')[0]).trim() || 'Supporteur',
      )
      const formatErr = validateDisplayNameFormat(signupName)
      if (formatErr) {
        setError(formatErr)
        return
      }
      if (containsBannedWord(signupName)) {
        setError(MODERATION_REFUSED_MESSAGE_FR)
        return
      }
      if (pseudoBlocked) {
        setError(pseudoHint.message ?? 'Ce pseudo n’est pas utilisable.')
        return
      }
      setSubmitting(true)
      try {
        const signup = await signUpWithEmail(email, password, displayName || undefined)
        if (signup.status === 'error') {
          setError(signup.message)
          return
        }
        setError(null)
        if (signup.status === 'confirm_email') {
          setMode('login')
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
          if (!authNotice) setError('Email ou mot de passe incorrect.')
          return
        }
        markPendingFanOnboardingAfterLogin()
      } finally {
        setSubmitting(false)
      }
    }
  }

  const runGoogleOAuth = async () => {
    setError(null)
    setOauthLoading(true)
    try {
      const ok = await loginWithOAuthProvider('google')
      if (ok && !isSupabaseConfigured()) markPendingFanOnboardingAfterLogin()
    } finally {
      setOauthLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-transparent p-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="tf-page-backdrop" aria-hidden />
      <div className="relative w-full max-w-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) navigate(-1)
              else navigate(nextPath ?? '/')
            }}
            className={cn(
              'inline-flex min-h-10 min-w-0 flex-1 items-center gap-1 rounded-xl border px-3 py-2 text-xs font-black transition sm:text-sm',
              isLight
                ? 'border-slate-300/70 bg-white/80 text-slate-800 hover:border-slate-400 hover:bg-white'
                : 'border-white/20 bg-white/[0.08] text-slate-100 hover:bg-white/[0.14]',
            )}
            aria-label="Retour à la page précédente"
          >
            ← {backLabel}
          </button>
          <ThemeAppearanceToggle variant="headerIcon" className="shrink-0" />
        </div>
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoEncart size="lg" isLight={isLight} decorative={false} />
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

          {cameFromSharedSpace && (
            <div
              role="status"
              className="mt-6 rounded-xl border border-amber-200/80 bg-amber-50/95 p-3 text-xs font-semibold text-amber-950"
            >
              ⚽ Le coup d&apos;envoi de la tribune est lancé : connecte-toi pour entrer sur le terrain et participer au
              live avec les supporters.
            </div>
          )}

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

          <h2 className="mt-6 text-lg font-black text-tf-dark">Choisis ton entrée dans le match</h2>
          <p className="mt-1 text-sm font-medium text-tf-grey">
            Email + mot de passe, ou connexion Google.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 md:items-stretch">
            <section className="rounded-2xl border border-tf-grey-pastel/60 bg-white/75 p-4">
              <h3 className="text-sm font-black text-tf-dark">
                {mode === 'login' ? 'Connexion email' : 'Créer un compte'}
              </h3>
              <p className="mt-1 text-[11px] font-medium text-tf-grey">
                {mode === 'login' ? 'Email + mot de passe' : 'Inscription rapide en 30 secondes'}
              </p>
              <form onSubmit={handleEmailSubmit} className="mt-4 space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label htmlFor="signup-displayName" className="mb-1 block text-xs font-bold text-tf-grey">
                      Pseudo {!clerkEnabled ? <span className="text-rose-600"> *</span> : null}
                    </label>
                    <Input
                      id="signup-displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value)
                        setError(null)
                      }}
                      placeholder={
                        clerkEnabled ? 'Optionnel — ton prénom ou pseudo' : 'Ton pseudo (unique sur Talk Foot)'
                      }
                      autoComplete="username"
                      required={!clerkEnabled}
                      minLength={clerkEnabled ? undefined : 2}
                      maxLength={24}
                      className={cn(
                        'w-full rounded-xl border-tf-grey-pastel/50',
                        !clerkEnabled &&
                          (pseudoHint.status === 'taken' || pseudoHint.status === 'invalid'
                            ? 'border-rose-300 ring-1 ring-rose-200'
                            : pseudoHint.status === 'available'
                              ? 'border-emerald-300 ring-1 ring-emerald-200'
                              : null),
                      )}
                      aria-invalid={
                        !clerkEnabled &&
                        (pseudoHint.status === 'taken' || pseudoHint.status === 'invalid')
                      }
                    />
                    {!clerkEnabled ? (
                      <>
                        <DisplayNameAvailabilityHint
                          status={pseudoHint.status}
                          message={pseudoHint.message}
                          suggestions={pseudoHint.suggestions}
                          onPickSuggestion={(s) => {
                            setDisplayName(s)
                            setError(null)
                          }}
                        />
                        {pseudoHint.status === 'idle' ? (
                          <p className="mt-1 text-[10px] font-semibold text-tf-grey">
                            2 à 24 caractères — vérification automatique pendant la saisie.
                          </p>
                        ) : null}
                      </>
                    ) : null}
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
                    required
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
                    required
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
                      required
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
                      et les{' '}
                      <Link to="/terms" className="font-bold text-tf-cta underline-offset-2 hover:underline">
                        conditions d&apos;utilisation
                      </Link>{' '}
                      et j&apos;accepte le stockage des données nécessaires sur mon appareil.
                    </span>
                  </label>
                )}
                {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full rounded-xl py-3 font-bold"
                  disabled={submitting || pseudoBlocked}
                >
                  {submitting
                    ? 'Patience…'
                    : mode === 'login'
                      ? 'Se connecter'
                      : pseudoHint.status === 'checking'
                        ? 'Vérification du pseudo…'
                        : 'Créer mon compte'}
                </Button>
              </form>
            </section>

            <section className="rounded-2xl border border-tf-grey-pastel/60 bg-white/75 p-4">
              <h3 className="text-sm font-black text-tf-dark">Connexion Google</h3>
              <p className="mt-1 text-[11px] font-medium text-tf-grey">
                Un clic avec ton compte Google
              </p>
              <div className="mt-4 space-y-3">
                {LOGIN_OAUTH_PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => void runGoogleOAuth()}
                    disabled={oauthLoading}
                    className={cn(GOOGLE_BUTTON_CLASS, oauthLoading && 'pointer-events-none opacity-60')}
                  >
                    <OAuthProviderIcon id={p.id as TalkFootOauthProviderId} />
                    {oauthLoading ? 'Redirection…' : p.label}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <p className="mt-4 text-center text-[11px] font-medium leading-snug text-tf-grey">
            {isSupabaseConfigured() || clerkEnabled ? (
              <>
                Connexion par email ou Google uniquement. En continuant, tu reconnais la{' '}
                <Link to="/privacy" className="font-bold text-tf-cta underline-offset-2 hover:underline">
                  politique de confidentialité
                </Link>{' '}
                et les{' '}
                <Link to="/terms" className="font-bold text-tf-cta underline-offset-2 hover:underline">
                  conditions d&apos;utilisation
                </Link>
                .
              </>
            ) : (
              <>
                Mode local sans cloud : les boutons simulent une connexion. Renseigne Supabase ou Clerk pour une vraie
                auth.{' '}
                <Link to="/privacy" className="font-bold text-tf-cta underline-offset-2 hover:underline">
                  Confidentialité
                </Link>{' '}
                &{' '}
                <Link to="/terms" className="font-bold text-tf-cta underline-offset-2 hover:underline">
                  Conditions
                </Link>
                .
              </>
            )}
          </p>
          <p className="mt-3 text-center text-[11px] font-medium text-tf-grey">
            <Link to="/about" className="font-bold text-tf-cta underline-offset-2 hover:underline">
              À propos
            </Link>{' '}
            ·{' '}
            <Link to="/privacy" className="font-bold text-tf-cta underline-offset-2 hover:underline">
              Confidentialité
            </Link>{' '}
            ·{' '}
            <Link to="/terms" className="font-bold text-tf-cta underline-offset-2 hover:underline">
              CGU
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
