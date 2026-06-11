import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { isClerkAuthConfigured } from '../contexts/AuthContext'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { LogoEncart } from '../layout/LogoMark'
import { useAppearance } from '../contexts/AppearanceContext'
import { ThemeAppearanceToggle } from '../components/ui/ThemeAppearanceToggle'
import { cn } from '../utils/cn'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { isReady } = useAuth()
  const { appearance } = useAppearance()
  const isLight = appearance === 'light'
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSessionChecked(true)
      return
    }
    const sb = getSupabaseBrowserClient()
    if (!sb) {
      setSessionChecked(true)
      return
    }

    let cancelled = false
    const check = async () => {
      const { data } = await sb.auth.getSession()
      if (cancelled) return
      setSessionReady(Boolean(data.session))
      setSessionChecked(true)
    }

    void check()
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      setSessionReady(Boolean(session))
      setSessionChecked(true)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  if (!isSupabaseConfigured() || isClerkAuthConfigured()) {
    return <Navigate to="/login" replace />
  }

  if (!isReady || !sessionChecked) {
    return (
      <div className="relative flex min-h-dvh items-center justify-center">
        <div className="tf-page-backdrop" aria-hidden />
        <div className="relative text-sm font-semibold text-tf-grey">Chargement…</div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    const sb = getSupabaseBrowserClient()
    if (!sb) {
      setError('Supabase non configuré.')
      return
    }
    setSubmitting(true)
    try {
      const { error: updateError } = await sb.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
        return
      }
      navigate('/', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-transparent p-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="tf-page-backdrop" aria-hidden />
      <div className="relative w-full max-w-sm">
        <div className="mb-3 flex items-start justify-end">
          <ThemeAppearanceToggle variant="headerIcon" className="shrink-0" />
        </div>
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoEncart size="lg" isLight={isLight} decorative={false} />
          <h1 className="sr-only">Nouveau mot de passe — Talk Foot</h1>
        </div>

        <Card className="border-white/45 bg-white/[0.88] p-6 shadow-tf-glass backdrop-blur-xl sm:p-8" elevation="soft">
          {!sessionReady ? (
            <>
              <h2 className="text-lg font-black text-tf-dark">Lien invalide ou expiré</h2>
              <p className="mt-2 text-sm font-medium text-tf-grey">
                Ce lien de réinitialisation n’est plus valable. Demande un nouveau mail depuis la page de connexion.
              </p>
              <Button
                type="button"
                variant="primary"
                className="mt-5 w-full rounded-xl py-3 font-bold"
                onClick={() => navigate('/login', { replace: true })}
              >
                Retour à la connexion
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-black text-tf-dark">Choisis un nouveau mot de passe</h2>
              <p className="mt-1 text-sm font-medium text-tf-grey">6 caractères minimum.</p>
              <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="reset-password" className="mb-1 block text-xs font-bold text-tf-grey">
                    Nouveau mot de passe
                  </label>
                  <Input
                    id="reset-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6 caractères minimum"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="w-full rounded-xl border-tf-grey-pastel/50"
                  />
                </div>
                <div>
                  <label htmlFor="reset-password-confirm" className="mb-1 block text-xs font-bold text-tf-grey">
                    Confirmer le mot de passe
                  </label>
                  <Input
                    id="reset-password-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    className="w-full rounded-xl border-tf-grey-pastel/50"
                  />
                </div>
                {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full rounded-xl py-3 font-bold"
                  disabled={submitting}
                >
                  {submitting ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
                </Button>
              </form>
            </>
          )}
          <p className="mt-4 text-center text-[11px] font-medium text-tf-grey">
            <Link to="/login" className={cn('font-bold text-tf-cta underline-offset-2 hover:underline')}>
              Retour à la connexion
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
