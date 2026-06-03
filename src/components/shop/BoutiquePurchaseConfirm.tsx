import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ModularAvatarCanvas } from '../profile/ModularAvatarCanvas'
import { TokenGlyph } from '../ui/TokenGlyph'
import { useProfile } from '../../hooks/useProfile'
import { cosmeticTokenPrice } from '../../data/shop'
import type { AvatarItem } from '../../types/profile'
import { mergePurchasedItemOntoProfile } from '../../utils/boutiqueModularState'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { boutiqueItemTypeLabel } from './boutiqueItemLabels'
import { ShopModalPortal } from './ShopModalPortal'

export function BoutiquePurchaseConfirm({
  item,
  currency,
  walletMedals,
  walletTokens,
  confirming,
  onConfirm,
  onCancel,
  onBack,
  onNeedMedals,
}: {
  item: AvatarItem
  currency: 'medals' | 'tokens'
  walletMedals: number
  walletTokens: number
  confirming?: boolean
  onConfirm: () => void
  onCancel: () => void
  onBack?: () => void
  onNeedMedals?: () => void
}) {
  const { profile } = useProfile()

  const previewState = useMemo(
    () => mergePurchasedItemOntoProfile(profile, item),
    [profile, item],
  )

  const medalCost = item.cost
  const tokenCost = cosmeticTokenPrice(item.cost)
  const typeLabel = boutiqueItemTypeLabel(item)

  const insufficientMedals = currency === 'medals' && walletMedals < medalCost
  const insufficientTokens = currency === 'tokens' && walletTokens < tokenCost

  const paidLabel =
    currency === 'medals'
      ? `${medalCost.toLocaleString('fr-FR')} médailles 🏅`
      : `${tokenCost.toLocaleString('fr-FR')} jetons`

  const confirmDisabled = confirming || insufficientMedals || insufficientTokens

  const handleBackdrop = onBack ?? onCancel

  return (
    <ShopModalPortal
      ariaLabelledBy="purchase-confirm-title"
      onBackdropClick={handleBackdrop}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className={cn(
          'relative w-full overflow-y-auto overflow-x-hidden rounded-[28px] border border-sky-400/35',
          'bg-gradient-to-b from-[#0c1f3d] via-[#081628] to-[#050a12] shadow-[0_32px_100px_rgba(0,0,0,0.55)]',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-sky-500/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-12 size-40 rounded-full bg-tf-cdm-gold/15 blur-3xl"
          aria-hidden
        />

        <header className="relative border-b border-white/10 px-5 py-5 text-center sm:px-7 sm:py-6">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-sky-300/90">
            Confirmation d&apos;achat
          </p>
          <h1
            id="purchase-confirm-title"
            className="mt-2 font-display text-2xl font-black leading-tight text-white sm:text-3xl"
          >
            Tu confirmes cet achat ?
          </h1>
          <p className="mt-2 text-sm font-semibold text-sky-100/85">
            <span className="text-white">{item.name}</span>
            <span className="text-white/60"> · </span>
            <span className="text-sky-200/90">{typeLabel}</span>
          </p>
        </header>

        <div className="relative flex justify-center px-4 py-4 sm:px-6 sm:py-5">
          <div className="relative w-full max-w-[280px]">
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,rgba(56,189,248,0.18),transparent_70%)]"
              aria-hidden
            />
            <div className="relative h-[min(72vw,320px)] w-full sm:h-[340px]">
              <ModularAvatarCanvas state={previewState} crop="full" fill className="h-full w-full" />
            </div>
            <span
              className="absolute left-1/2 top-2 z-[2] w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 whitespace-nowrap rounded-full border border-sky-400/45 bg-sky-500/20 px-4 py-1 text-[10px] font-black uppercase tracking-wide text-sky-200 shadow-lg"
              aria-hidden
            >
              Aperçu sur ton avatar
            </span>
          </div>
        </div>

        <div className="relative space-y-3 border-t border-white/10 px-5 py-4 sm:px-7">
          <div className="flex flex-wrap items-center justify-center gap-2 text-center text-xs font-bold text-white/75">
            <span className="rounded-lg bg-white/10 px-2.5 py-1">Prix : {paidLabel}</span>
            <span className="rounded-lg bg-white/10 px-2.5 py-1">
              Solde : {walletMedals} 🏅 · {walletTokens}{' '}
              <TokenGlyph variant="onDark" className="inline size-3.5 align-[-2px]" />
            </span>
          </div>

          {insufficientMedals ? (
            <p className="text-center text-xs font-bold text-amber-200">
              Pas assez de médailles pour cet achat.
            </p>
          ) : null}
          {insufficientTokens ? (
            <p className="text-center text-xs font-bold text-amber-200">
              Pas assez de jetons pour cet achat.
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {insufficientMedals && onNeedMedals ? (
              <button
                type="button"
                onClick={onNeedMedals}
                className={cn(
                  TF_FOCUS_VISIBLE,
                  'inline-flex min-h-tf-touch flex-1 items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-amber-950 shadow-md transition hover:bg-amber-400 sm:flex-initial sm:min-w-[11rem]',
                )}
              >
                Acheter des médailles
              </button>
            ) : (
              <button
                type="button"
                disabled={confirmDisabled}
                onClick={onConfirm}
                className={cn(
                  TF_FOCUS_VISIBLE,
                  'inline-flex min-h-tf-touch flex-1 items-center justify-center rounded-2xl bg-tf-cdm-gold px-5 py-3 text-sm font-black text-tf-cdm-deep shadow-[0_8px_28px_rgba(244,197,66,0.35)] transition hover:bg-tf-cdm-gold/90 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-initial sm:min-w-[11rem]',
                )}
              >
                {confirming ? 'Achat en cours…' : 'Confirmer l’achat'}
              </button>
            )}
            {onBack ? (
              <button
                type="button"
                disabled={confirming}
                onClick={onBack}
                className={cn(
                  TF_FOCUS_VISIBLE,
                  'inline-flex min-h-tf-touch flex-1 items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15 disabled:opacity-50 sm:flex-initial sm:min-w-[11rem]',
                )}
              >
                Retour
              </button>
            ) : (
              <button
                type="button"
                disabled={confirming}
                onClick={onCancel}
                className={cn(
                  TF_FOCUS_VISIBLE,
                  'inline-flex min-h-tf-touch flex-1 items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15 disabled:opacity-50 sm:flex-initial sm:min-w-[11rem]',
                )}
              >
                Annuler
              </button>
            )}
          </div>
          <p className="text-center text-[10px] font-semibold text-white/45">
            L&apos;article sera ajouté à ton inventaire après confirmation.
          </p>
        </div>
      </motion.div>
    </ShopModalPortal>
  )
}
