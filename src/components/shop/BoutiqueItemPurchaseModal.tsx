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
import { BoutiquePurchaseConfirm } from './BoutiquePurchaseConfirm'
import { shopEncartButtonClass, shopEncartTokenButtonClass } from './ShopRarityEncart'
import { ShopModalPortal } from './ShopModalPortal'

type Step = 'preview' | 'confirm'

export function BoutiqueItemPurchaseModal({
  item,
  step,
  currency,
  walletMedals,
  walletTokens,
  confirming,
  onClose,
  onChooseCurrency,
  onBack,
  onConfirm,
  onNeedMedals,
}: {
  item: AvatarItem
  step: Step
  currency?: 'medals' | 'tokens'
  walletMedals: number
  walletTokens: number
  confirming?: boolean
  onClose: () => void
  onChooseCurrency: (currency: 'medals' | 'tokens') => void
  onBack: () => void
  onConfirm: () => void
  onNeedMedals?: () => void
}) {
  const { profile } = useProfile()
  const previewState = useMemo(
    () => mergePurchasedItemOntoProfile(profile, item),
    [profile, item],
  )

  const tokenPrice = cosmeticTokenPrice(item.cost)
  const typeLabel = boutiqueItemTypeLabel(item)

  if (step === 'confirm' && currency) {
    return (
      <BoutiquePurchaseConfirm
        item={item}
        currency={currency}
        walletMedals={walletMedals}
        walletTokens={walletTokens}
        confirming={confirming}
        onConfirm={onConfirm}
        onCancel={onClose}
        onBack={onBack}
        onNeedMedals={onNeedMedals}
      />
    )
  }

  return (
    <ShopModalPortal ariaLabelledBy="item-preview-title" onBackdropClick={onClose}>
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
        <button
          type="button"
          onClick={onClose}
          className={cn(
            TF_FOCUS_VISIBLE,
            'absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-lg font-bold text-white/80 transition hover:bg-white/15',
          )}
          aria-label="Fermer"
        >
          ×
        </button>

        <header className="relative border-b border-white/10 px-5 py-5 text-center sm:px-7 sm:py-6">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-sky-300/90">
            Visualisation
          </p>
          <h1
            id="item-preview-title"
            className="mt-2 font-display text-2xl font-black leading-tight text-white sm:text-3xl"
          >
            {item.name}
          </h1>
          <p className="mt-2 text-sm font-semibold text-sky-100/85">{typeLabel}</p>
        </header>

        <div className="relative flex justify-center px-4 py-4 sm:px-6 sm:py-5">
          <div className="relative w-full max-w-[300px]">
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,rgba(56,189,248,0.22),transparent_70%)]"
              aria-hidden
            />
            <div className="relative h-[min(76vw,360px)] w-full sm:h-[380px]">
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
          <p className="text-center text-xs font-bold text-white/70">
            Choisis ton mode de paiement pour continuer
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChooseCurrency('medals')}
              className={cn(
                TF_FOCUS_VISIBLE,
                shopEncartButtonClass(false),
                'min-h-12 w-full text-sm font-black',
              )}
            >
              <span className="tabular-nums">
                {item.cost} <span aria-hidden>🏅</span>
              </span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wide opacity-80">
                Médailles
              </span>
            </button>
            <button
              type="button"
              onClick={() => onChooseCurrency('tokens')}
              className={cn(
                TF_FOCUS_VISIBLE,
                shopEncartTokenButtonClass(false),
                'min-h-12 w-full text-sm font-black',
              )}
            >
              <span className="inline-flex items-center justify-center gap-1 tabular-nums">
                {tokenPrice.toLocaleString('fr-FR')}
                <TokenGlyph variant="onDark" className="size-4 shrink-0" />
              </span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wide opacity-80">
                Jetons
              </span>
            </button>
          </div>
          <p className="text-center text-[10px] font-semibold text-white/45">
            Solde : {walletMedals} 🏅 · {walletTokens}{' '}
            <TokenGlyph variant="onDark" className="inline size-3 align-[-2px]" />
          </p>
        </div>
      </motion.div>
    </ShopModalPortal>
  )
}
