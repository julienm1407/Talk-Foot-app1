import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getModalPortalRoot } from '../../utils/modalPortalRoot'
import { useModalBackdropGuard } from '../../utils/modalBackdropGuard'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { cn } from '../../utils/cn'

type ForgotPasswordDialogProps = {
  open: boolean
  initialIdentifier?: string
  onClose: () => void
  onSubmit: (identifier: string) => Promise<{ status: 'sent' } | { status: 'error'; message: string }>
}

export function ForgotPasswordDialog({
  open,
  initialIdentifier = '',
  onClose,
  onSubmit,
}: ForgotPasswordDialogProps) {
  const { shouldIgnoreBackdropClose, backdropPointerEvents } = useModalBackdropGuard(open)
  const [identifier, setIdentifier] = useState(initialIdentifier)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!open) return
    setIdentifier(initialIdentifier)
    setError(null)
    setSent(false)
    setSubmitting(false)
  }, [open, initialIdentifier])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const portalTarget = getModalPortalRoot()
  if (!portalTarget) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmed = identifier.trim()
    if (!trimmed) {
      setError('Indique ton email ou ton pseudo.')
      return
    }
    setSubmitting(true)
    try {
      const result = await onSubmit(trimmed)
      if (result.status === 'sent') {
        setSent(true)
        return
      }
      setError(result.message)
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div
      className={cn(
        'pointer-events-auto fixed inset-0 z-[2] grid w-full touch-manipulation place-items-center overflow-hidden',
        'h-[100dvh] max-h-[100dvh]',
        'p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]',
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-dialog-title"
    >
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        style={{ pointerEvents: backdropPointerEvents }}
        onClick={() => {
          if (shouldIgnoreBackdropClose()) return
          onClose()
        }}
      />
      <div className="relative z-[1] w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xl sm:p-6">
        {sent ? (
          <>
            <div
              className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl"
              aria-hidden
            >
              ✉️
            </div>
            <h2 id="forgot-password-dialog-title" className="mt-4 text-center font-display text-xl font-black text-tf-dark">
              Vérifie ta boîte mail
            </h2>
            <p className="mt-2 text-center text-sm font-semibold leading-relaxed text-tf-grey">
              Si un compte correspond à cet identifiant, un lien de réinitialisation vient d’être envoyé. Pense aussi aux
              spams.
            </p>
            <Button type="button" variant="primary" className="mt-5 w-full rounded-xl py-3 font-bold" onClick={onClose}>
              Retour à la connexion
            </Button>
          </>
        ) : (
          <>
            <h2 id="forgot-password-dialog-title" className="text-center font-display text-xl font-black text-tf-dark">
              Mot de passe oublié ?
            </h2>
            <p className="mt-2 text-center text-sm font-semibold leading-relaxed text-tf-grey">
              Indique l’email ou le pseudo de ton compte. Nous t’enverrons un lien pour choisir un nouveau mot de passe.
            </p>
            <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
              <div>
                <label htmlFor="forgot-identifier" className="mb-1 block text-xs font-bold text-tf-grey">
                  Email ou pseudo
                </label>
                <Input
                  id="forgot-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value)
                    setError(null)
                  }}
                  placeholder="toi@exemple.com ou ton pseudo"
                  autoComplete="username"
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
                {submitting ? 'Envoi…' : 'Envoyer le lien'}
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="w-full text-center text-xs font-bold text-tf-grey hover:text-tf-dark"
              >
                Annuler
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    portalTarget,
  )
}
