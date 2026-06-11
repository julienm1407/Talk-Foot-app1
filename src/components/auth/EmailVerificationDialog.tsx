import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getModalPortalRoot } from '../../utils/modalPortalRoot'
import { useModalBackdropGuard } from '../../utils/modalBackdropGuard'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'

export type EmailVerificationDialogKind = 'signup_sent' | 'login_pending'

type EmailVerificationDialogProps = {
  open: boolean
  kind: EmailVerificationDialogKind
  email: string
  onClose: () => void
}

function copyForKind(kind: EmailVerificationDialogKind, email: string) {
  const address = email.trim() || 'ton adresse email'
  if (kind === 'login_pending') {
    return {
      title: 'Active ton compte',
      lead: 'Ton email n’est pas encore confirmé.',
      steps: [
        `Ouvre la boîte mail de ${address}.`,
        'Clique sur le lien de confirmation Talk Foot (valable quelques minutes).',
        'Reviens ici et connecte-toi avec ton mot de passe.',
      ],
    }
  }
  return {
    title: 'Compte créé — vérifie ton email',
    lead: `Un lien de confirmation vient d’être envoyé à ${address}.`,
    steps: [
      'Ouvre ta boîte mail (pense aussi aux spams / courrier indésirable).',
      'Clique sur le lien « Confirmer mon email » pour activer ton compte.',
      'Une fois le lien validé, reviens ici et connecte-toi.',
    ],
  }
}

export function EmailVerificationDialog({ open, kind, email, onClose }: EmailVerificationDialogProps) {
  const { shouldIgnoreBackdropClose, backdropPointerEvents } = useModalBackdropGuard(open)

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

  const { title, lead, steps } = copyForKind(kind, email)

  return createPortal(
    <div
      className={cn(
        'pointer-events-auto fixed inset-0 z-[2] grid w-full touch-manipulation place-items-center overflow-hidden',
        'h-[100dvh] max-h-[100dvh]',
        'p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]',
      )}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="email-verification-dialog-title"
      aria-describedby="email-verification-dialog-desc"
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
      <div
        className={cn(
          'relative z-[1] w-full max-w-md rounded-2xl border border-sky-200/80 bg-white p-5 shadow-2xl sm:p-6',
        )}
      >
        <div
          className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-sky-100 text-2xl"
          aria-hidden
        >
          ✉️
        </div>
        <h2 id="email-verification-dialog-title" className="mt-4 text-center font-display text-xl font-black text-tf-dark">
          {title}
        </h2>
        <p id="email-verification-dialog-desc" className="mt-2 text-center text-sm font-semibold leading-relaxed text-tf-grey">
          {lead}
        </p>
        <ol className="mt-4 space-y-2.5 rounded-xl border border-sky-100 bg-sky-50/80 p-4 text-sm font-medium text-slate-800">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-2.5 leading-snug">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sky-200 text-xs font-black text-sky-950">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-center text-[11px] font-medium leading-relaxed text-tf-grey">
          Le mail peut mettre 1 à 2 minutes à arriver. Sans nouvelles, vérifie l’orthographe de l’adresse ou les
          filtres anti-spam.
        </p>
        <Button type="button" variant="primary" className="mt-5 w-full rounded-xl py-3 font-bold" onClick={onClose}>
          J’ai compris
        </Button>
      </div>
    </div>,
    portalTarget,
  )
}
