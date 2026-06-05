import { useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import type { SubscriptionTierId } from '../../types/subscription'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'

export type TribuneLimitPopupKind = 'join' | 'create' | 'debate'

/** Libellé affiché pour la formule de l’utilisateur. */
export function subscriptionFormulaDisplayName(tier: SubscriptionTierId): string {
  if (tier === 'freemium') return 'Supporter'
  if (tier === 'supporter_plus') return 'Ultra'
  return 'Ambassadeur'
}

function copyForKind(
  kind: TribuneLimitPopupKind,
  tier: SubscriptionTierId,
  messageOverride?: string,
): { title: string; body: string } {
  if (messageOverride?.trim()) {
    return { title: 'Limite atteinte', body: messageOverride.trim() }
  }
  if (kind === 'join') {
    return {
      title: 'Limite atteinte',
      body: 'Vous ne pouvez pas rejoindre plus de groupes. Vous avez atteint la limite de votre abonnement.',
    }
  }
  if (kind === 'create') {
    return {
      title: 'Limite atteinte',
      body: 'Vous avez atteint le nombre maximum de groupes autorisés par votre abonnement.',
    }
  }
  if (tier === 'freemium') {
    return {
      title: 'Limite atteinte',
      body: 'La création de débats est réservée aux formules Ultra et Ambassadeur.',
    }
  }
  return {
    title: 'Limite atteinte',
    body:
      tier === 'ambassador'
        ? 'Tu as déjà publié ton débat du jour. Reviens demain pour en créer un nouveau.'
        : 'Tu as déjà publié ton débat de la semaine. Reviens la semaine prochaine pour en créer un nouveau.',
  }
}

export function TribuneLimitPopup({
  open,
  kind,
  tier = 'freemium',
  message,
  onClose,
}: {
  open: boolean
  kind: TribuneLimitPopupKind
  tier?: SubscriptionTierId
  /** Message personnalisé (ex. quota débat). */
  message?: string
  onClose: () => void
}) {
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

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  useLayoutEffect(() => {
    setPortalTarget(document.body)
  }, [])

  if (!open || !portalTarget) return null

  const { title, body } = copyForKind(kind, tier, message)
  const showUpgradeToUltra = kind === 'join' && tier === 'freemium'
  const showPlansLink = kind === 'create' || kind === 'debate' || showUpgradeToUltra

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[300] grid w-full place-items-center overflow-hidden',
        'h-[100dvh] max-h-[100dvh]',
        'p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]',
      )}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="tribune-limit-title"
      aria-describedby="tribune-limit-desc"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-md overflow-y-auto overscroll-contain',
          'max-h-[calc(100dvh-2rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))]',
          'rounded-3xl border border-white/10 bg-white shadow-[0_24px_80px_-12px_rgba(2,52,88,0.45)] tf-modal-pop-in',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-[#023458] to-[#0b4a7a] px-6 py-8 text-center text-white">
          <div
            className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-white/15 text-3xl"
            aria-hidden
          >
            🏟️
          </div>
          <h2
            id="tribune-limit-title"
            className="text-balance font-display text-xl font-black leading-snug tracking-tight sm:text-2xl"
          >
            {title}
          </h2>
        </div>

        <div className="px-6 py-6 text-center">
          <p
            id="tribune-limit-desc"
            className="text-base font-semibold leading-relaxed text-slate-700"
          >
            {body}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {showPlansLink ? (
              <Link
                to="/formules"
                onClick={onClose}
                className={cn(
                  'inline-flex min-h-12 w-full items-center justify-center rounded-2xl border-2 border-tf-cta-hover/40',
                  'bg-tf-cta px-5 text-base font-black text-white shadow-tf-cta transition',
                  'hover:bg-tf-cta-hover sm:w-auto sm:min-w-[10rem]',
                )}
              >
                {showUpgradeToUltra ? 'Passer à Ultra' : 'Voir les abonnements'}
              </Link>
            ) : null}
            <Button
              variant={showPlansLink ? 'soft' : 'primary'}
              className={cn(
                'min-h-12 w-full rounded-2xl text-base font-black sm:w-auto sm:min-w-[10rem]',
                !showPlansLink &&
                  'border-2 border-tf-cta-hover/40 bg-tf-cta text-white shadow-tf-cta hover:bg-tf-cta-hover',
              )}
              onClick={onClose}
            >
              Compris
            </Button>
          </div>
        </div>
      </div>
    </div>,
    portalTarget,
  )
}
