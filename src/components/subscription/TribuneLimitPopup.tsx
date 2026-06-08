import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getModalPortalRoot } from '../../utils/modalPortalRoot'
import { useModalBackdropGuard } from '../../utils/modalBackdropGuard'
import { Link } from 'react-router-dom'
import type { SupporterGroup } from '../../types/group'
import type { SubscriptionTierId } from '../../types/subscription'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'
import { TribuneLimitLeavePicker } from './TribuneLimitLeavePicker'

export type TribuneLimitPopupKind = 'join' | 'create' | 'debate'

function groupLimitsFallbackCount(
  tribunes: SupporterGroup[] | undefined,
  orphanJoinedIds: string[] | undefined,
): number | undefined {
  const n = (tribunes?.length ?? 0) + (orphanJoinedIds?.length ?? 0)
  return n > 0 ? n : undefined
}

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
  joinedCount?: number,
  maxJoined?: number,
): { title: string; body: string } {
  if (messageOverride?.trim()) {
    return { title: 'Limite atteinte', body: messageOverride.trim() }
  }
  if (kind === 'join') {
    const limit = maxJoined ?? 5
    const count = joinedCount ?? limit
    return {
      title: 'Limite atteinte',
      body:
        tier === 'freemium'
          ? `Tu utilises ${count}/${limit} tribunes avec la formule Supporter (celles que tu crées comptent). Libère une place ci-dessous ou passe à Ultra.`
          : `Vous avez atteint la limite de tribunes (${count}/${limit}).`,
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
      title: 'Formule Supporter',
      body:
        'Tu as la formule gratuite : la création de débats n’est pas disponible avec cette offre. Passe à Ultra ou Ambassadeur pour publier ton sujet dans le groupe.',
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
  myTribunes,
  orphanJoinedIds,
  joinedCount,
  maxJoined = 5,
  onLeaveTribune,
  leavingTribuneId,
}: {
  open: boolean
  kind: TribuneLimitPopupKind
  tier?: SubscriptionTierId
  /** Message personnalisé (ex. quota débat). */
  message?: string
  onClose: () => void
  /** Tribunes actuelles — affichées quand le plafond de rejoindre est atteint. */
  myTribunes?: SupporterGroup[]
  /** Adhésions sans fiche tribune (ex. tribune supprimée) — comptent quand même dans le plafond. */
  orphanJoinedIds?: string[]
  joinedCount?: number
  maxJoined?: number
  onLeaveTribune?: (groupId: string) => void
  leavingTribuneId?: string | null
}) {
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

  const effectiveJoined = joinedCount ?? groupLimitsFallbackCount(myTribunes, orphanJoinedIds)
  const { title, body } = copyForKind(kind, tier, message, effectiveJoined, maxJoined)
  const showUpgradeToUltra = kind === 'join' && tier === 'freemium'
  const showPlansLink = kind === 'create' || kind === 'debate' || showUpgradeToUltra
  const showLeavePicker =
    kind === 'join' &&
    tier === 'freemium' &&
    onLeaveTribune != null &&
    ((myTribunes?.length ?? 0) > 0 || (orphanJoinedIds?.length ?? 0) > 0)

  return createPortal(
    <div
      className={cn(
        'pointer-events-auto fixed inset-0 z-[2] grid w-full touch-manipulation place-items-center overflow-hidden',
        'data-tf-modal',
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
        style={{ pointerEvents: backdropPointerEvents }}
        aria-label="Fermer"
        onClick={() => {
          if (shouldIgnoreBackdropClose()) return
          onClose()
        }}
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

          {showLeavePicker ? (
            <TribuneLimitLeavePicker
              tribunes={myTribunes ?? []}
              orphanJoinedIds={orphanJoinedIds}
              joinedCount={effectiveJoined ?? maxJoined}
              maxJoined={maxJoined}
              onLeave={onLeaveTribune}
              leavingId={leavingTribuneId}
            />
          ) : null}

          <div className={cn('flex flex-col gap-3 sm:flex-row sm:justify-center', showLeavePicker ? 'mt-5' : 'mt-6')}>
            <Button
              variant="soft"
              className={cn(
                'min-h-12 w-full rounded-2xl text-base font-black sm:w-auto sm:min-w-[10rem]',
                showPlansLink
                  ? 'border-2 border-tf-dark/15 bg-white text-tf-dark shadow-tf-elev-1 hover:bg-tf-electric-soft'
                  : 'border-2 border-tf-cta-hover/40 bg-tf-cta text-white shadow-tf-cta hover:bg-tf-cta-hover',
              )}
              onClick={onClose}
            >
              {showPlansLink ? 'Retour' : 'Compris'}
            </Button>
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
          </div>
        </div>
      </div>
    </div>,
    portalTarget,
  )
}
