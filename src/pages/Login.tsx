import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { cn } from '../utils/cn'
import { LogoMark } from '../layout/LogoMark'
import { markPendingFanOnboardingAfterLogin } from '../constants/fanSession'

type Mode = 'login' | 'signup'

export function LoginPage() {
  const { user, isReady, loginWithEmail, signUpWithEmail, loginWithGoogle, loginWithApple } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!isReady) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-tf-grey-pastel/20">
        <div className="text-sm font-semibold text-tf-grey">Chargement…</div>
      </div>
    )
  }
  if (user) {
    return <Navigate to="/" replace />
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.')
        return
      }
      if (password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères.')
        return
      }
      if (!signUpWithEmail(email, password, displayName || undefined)) {
        setError('Merci de remplir l\'email et le mot de passe.')
        return
      }
      markPendingFanOnboardingAfterLogin()
    } else {
      if (!loginWithEmail(email, password)) {
        setError('Merci de remplir l\'email et le mot de passe.')
        return
      }
      markPendingFanOnboardingAfterLogin()
    }
  }

  const handleGoogle = () => {
    setError(null)
    markPendingFanOnboardingAfterLogin()
    loginWithGoogle()
  }

  const handleApple = () => {
    setError(null)
    markPendingFanOnboardingAfterLogin()
    loginWithApple()
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-tf-mist p-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark variant="hero" className="max-w-[220px]" decorative={false} />
          <h1 className="sr-only">Talk Foot</h1>
          <p className="mt-4 text-sm font-semibold text-tf-grey">
            Rejoins la communauté foot en direct
          </p>
        </div>

        <Card className="p-6 sm:p-8" elevation="soft">
          <div className="flex gap-1 rounded-xl bg-tf-grey-pastel/40 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError(null)
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
            {error && (
              <p className="text-sm font-semibold text-rose-600">{error}</p>
            )}
            <Button
              type="submit"
              variant="primary"
              className="w-full rounded-xl py-3 font-bold"
            >
              {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-tf-grey-pastel/60" />
            <span className="text-xs font-semibold text-tf-grey">ou</span>
            <div className="h-px flex-1 bg-tf-grey-pastel/60" />
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handleGoogle}
              className={cn(
                'flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm',
                'transition hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-tf-grey/30',
              )}
            >
              <svg className="size-5" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuer avec Google
            </button>
            <button
              type="button"
              onClick={handleApple}
              className={cn(
                'flex w-full items-center justify-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-bold text-white',
                'transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500',
              )}
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Continuer avec Apple
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
