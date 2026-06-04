import { useMemo } from 'react'
import { TokenGlyph } from '../ui/TokenGlyph'
import { useProfile } from '../../hooks/useProfile'
import { getEffectiveMedalCost, getEffectiveTokenCost } from '../../data/boutiqueDailyDeal'
import type { AvatarItem } from '../../types/profile'
import { mergePurchasedItemOntoProfile } from '../../utils/boutiqueModularState'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { boutiqueItemTypeLabel } from './boutiqueItemLabels'
import { BoutiquePurchaseConfirm } from './BoutiquePurchaseConfirm'
import { BoutiqueShopModalPanel } from './BoutiqueShopModalPanel'

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

  const medalCost = getEffectiveMedalCost(item)
  const tokenPrice = getEffectiveTokenCost(item)
  const listCost = item.cost
  const onDailyDeal = medalCost < listCost
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
    <BoutiqueShopModalPanel
      ariaLabelledBy="item-preview-title"
      onBackdropClick={onClose}
      onDismiss={onClose}
      dismissAriaLabel="Retour au catalogue"
      eyebrow="Visualisation"
      title={item.name}
      subtitle={typeLabel}
      previewState={previewState}
      footer={
        <div className="space-y-3">
          <p className="text-center text-xs font-bold text-white/70">
            Choisis ton mode de paiement pour continuer
          </p>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => onChooseCurrency('medals')}
              className={cn(
                TF_FOCUS_VISIBLE,
                'inline-flex min-h-tf-touch flex-1 flex-col items-center justify-center rounded-2xl border-2 border-sky-200/50 bg-gradient-to-b from-sky-400 to-blue-700 px-4 py-3 text-sm font-black text-white shadow-md transition hover:from-sky-300 hover:to-blue-600 sm:min-w-[11rem]',
              )}
            >
              <span className="tabular-nums text-base">
                {onDailyDeal ? (
                  <>
                    <span className="text-white/50 line-through">{listCost}</span> {medalCost}
                  </>
                ) : (
                  medalCost
                )}{' '}
                <span aria-hidden>🏅</span>
              </span>
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide opacity-90">
                Médailles
              </span>
            </button>
            <button
              type="button"
              onClick={() => onChooseCurrency('tokens')}
              className={cn(
                TF_FOCUS_VISIBLE,
                'inline-flex min-h-tf-touch flex-1 flex-col items-center justify-center rounded-2xl border-2 border-lime-200/80 bg-gradient-to-b from-lime-400 to-emerald-800 px-4 py-3 text-sm font-black text-white shadow-lg transition hover:from-lime-300 hover:to-emerald-700 sm:min-w-[11rem]',
              )}
            >
              <span className="inline-flex items-center gap-1 tabular-nums text-base">
                {tokenPrice.toLocaleString('fr-FR')}
                <TokenGlyph variant="onDark" className="size-4 shrink-0" />
              </span>
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide opacity-90">
                Jetons
              </span>
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-center text-xs font-bold text-white/75">
            <span className="rounded-lg bg-white/10 px-2.5 py-1">
              Solde : {walletMedals} 🏅 · {walletTokens}{' '}
              <TokenGlyph variant="onDark" className="inline size-3.5 align-[-2px]" />
            </span>
          </div>
          <p className="text-center text-[10px] font-semibold text-white/45">
            Clic à l&apos;extérieur pour revenir au catalogue.
          </p>
        </div>
      }
    />
  )
}
