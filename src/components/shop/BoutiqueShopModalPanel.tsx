import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ModularAvatarCanvas } from '../profile/ModularAvatarCanvas'
import type { ModularAvatarState } from '../../features/avatar2d/modularAvatarState'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { ShopModalPortal } from './ShopModalPortal'

type BoutiqueShopModalPanelProps = {
  ariaLabelledBy: string
  onBackdropClick?: () => void
  /** Flèche retour en haut de la carte (ferme ou étape précédente). */
  onDismiss?: () => void
  dismissAriaLabel?: string
  tone?: 'shop' | 'celebration'
  previewBadge?: string
  eyebrow: string
  title: string
  subtitle?: ReactNode
  previewState: ModularAvatarState
  footer: ReactNode
}

/** Coque modale boutique (visualisation + confirmation) — même rendu centré et stable. */
export function BoutiqueShopModalPanel({
  ariaLabelledBy,
  onBackdropClick,
  onDismiss,
  dismissAriaLabel = 'Retour',
  tone = 'shop',
  previewBadge = 'Aperçu sur ton avatar',
  eyebrow,
  title,
  subtitle,
  previewState,
  footer,
}: BoutiqueShopModalPanelProps) {
  const isCelebration = tone === 'celebration'

  return (
    <ShopModalPortal ariaLabelledBy={ariaLabelledBy} onBackdropClick={onBackdropClick}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className={cn(
          'relative w-full shrink-0 overflow-x-hidden rounded-[22px] border sm:overflow-hidden sm:rounded-[28px]',
          isCelebration ? 'border-tf-cdm-gold/45' : 'border-sky-400/35',
          'max-sm:max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-1.5rem))] max-sm:overflow-y-auto max-sm:overscroll-contain',
          'bg-gradient-to-b from-[#0c1f3d] via-[#081628] to-[#050a12] shadow-[0_32px_100px_rgba(0,0,0,0.55)]',
        )}
      >
        <div
          className={cn(
            'pointer-events-none absolute -right-16 -top-16 size-48 rounded-full blur-3xl',
            isCelebration ? 'bg-tf-cdm-gold/25' : 'bg-sky-500/20',
          )}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-12 size-40 rounded-full bg-tf-cdm-gold/15 blur-3xl"
          aria-hidden
        />

        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className={cn(
              TF_FOCUS_VISIBLE,
              'absolute left-4 top-4 z-10 flex size-10 items-center justify-center rounded-full border border-white/25 bg-black/45 text-lg font-black text-white shadow-md transition hover:bg-white/15',
            )}
            aria-label={dismissAriaLabel}
          >
            <span aria-hidden>←</span>
          </button>
        ) : null}

        <header
          className={cn(
            'relative border-b border-white/10 px-4 py-4 text-center sm:px-7 sm:py-6',
            onDismiss && 'pt-11 sm:pt-14',
          )}
        >
          <p
            className={cn(
              'text-[10px] font-black uppercase tracking-[0.22em] sm:text-[11px] sm:tracking-[0.28em]',
              isCelebration ? 'text-tf-cdm-gold' : 'text-sky-300/90',
            )}
          >
            {eyebrow}
          </p>
          <h1
            id={ariaLabelledBy}
            className="mt-2 text-balance font-display text-xl font-black leading-tight text-white sm:text-2xl lg:text-3xl"
          >
            {title}
          </h1>
          {subtitle ? (
            <div className="mt-2 text-balance text-xs font-semibold text-sky-100/85 sm:text-sm">{subtitle}</div>
          ) : null}
        </header>

        <div className="flex flex-col items-center gap-2 px-3 py-3 sm:gap-3 sm:px-6 sm:py-5">
          <span
            className={cn(
              'max-w-full text-center text-[10px] font-black uppercase tracking-wide',
              isCelebration ? 'text-tf-cdm-gold' : 'text-sky-300/90',
            )}
          >
            {previewBadge}
          </span>
          <div className="relative w-full max-w-[min(280px,100%)]">
            <div
              className={cn(
                'pointer-events-none absolute inset-0 rounded-3xl',
                isCelebration
                  ? 'bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,rgba(244,197,66,0.22),transparent_70%)]'
                  : 'bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,rgba(56,189,248,0.18),transparent_70%)]',
              )}
              aria-hidden
            />
            <div className="relative h-[min(52vw,240px)] w-full min-h-[200px] pt-1 sm:h-[340px] sm:min-h-0 sm:max-h-[340px]">
              <ModularAvatarCanvas state={previewState} crop="full" fill className="h-full w-full" />
            </div>
          </div>
        </div>

        <div className="relative border-t border-white/10 px-4 py-3.5 sm:px-7 sm:py-4">{footer}</div>
      </motion.div>
    </ShopModalPortal>
  )
}
