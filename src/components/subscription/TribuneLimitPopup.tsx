import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSubscriptionPlan } from '../../data/subscriptionPlans'
import type { SubscriptionTierId } from '../../types/subscription'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'

export type TribuneLimitPopupKind = 'join' | 'create'

/** Libellé affiché pour la formule gratuite (Freemium). */
export function subscriptionFormulaDisplayName(tier: SubscriptionTierId): string {
  if (tier === 'freemium') return 'Supporter gratuite'
  const plan = getSubscriptionPlan(tier)
  return plan.priceLabel ? `${plan.name} (${plan.priceLabel})` : plan.name
}

function copyForKind(
  kind: TribuneLimitPopupKind,
  tier: SubscriptionTierId,
): { title: string; body: string; limit: number } {
  const plan = getSubscriptionPlan(tier)
  const formula = subscriptionFormulaDisplayName(tier)
  if (kind === 'join') {
    const limit = plan.limits.maxGroupsJoined ?? 5
    return {
      title: 'Vous avez atteint la limite de tribunes à rejoindre',
      body: `Avec la formule ${formula}, vous pouvez rejoindre jusqu’à ${limit} tribunes maximum.`,
      limit,
    }
  }
  const limit = plan.limits.maxGroupsCreated
  return {
    title: 'Vous avez atteint la limite de tribunes créées',
    body: `Avec la formule ${formula}, vous pouvez créer jusqu’à ${limit} tribunes maximum.`,
    limit,
  }
}

export function TribuneLimitPopup({
  open,
  kind,
  tier = 'freemium',
  onClose,
}: {
  open: boolean
  kind: TribuneLimitPopupKind
  tier?: SubscriptionTierId
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

  if (!open) return null

  const { title, body } = copyForKind(kind, tier)

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="tribune-limit-title"
      aria-describedby="tribune-limit-desc"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white shadow-[0_24px_80px_-12px_rgba(2,52,88,0.45)]',
          'tf-live-toast-in',
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
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Passe à une formule supérieure pour lever cette limite.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/formules"
              onClick={onClose}
              className={cn(
                'inline-flex min-h-12 w-full items-center justify-center rounded-2xl border-2 border-tf-cta-hover/40',
                'bg-tf-cta px-5 text-base font-black text-white shadow-tf-cta transition',
                'hover:bg-tf-cta-hover sm:w-auto sm:min-w-[10rem]',
              )}
            >
              Voir les formules
            </Link>
            <Button
              variant="soft"
              className="min-h-12 w-full rounded-2xl text-base font-black sm:w-auto sm:min-w-[10rem]"
              onClick={onClose}
            >
              OK
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
