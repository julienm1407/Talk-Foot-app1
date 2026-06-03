import { useMemo } from 'react'
import { TokenGlyph } from '../ui/TokenGlyph'
import { useProfile } from '../../hooks/useProfile'
import { cosmeticTokenPrice } from '../../data/shop'
import type { AvatarItem } from '../../types/profile'
import { mergePurchasedItemOntoProfile } from '../../utils/boutiqueModularState'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { boutiqueItemTypeLabel } from './boutiqueItemLabels'
import { BoutiqueShopModalPanel } from './BoutiqueShopModalPanel'

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
    <BoutiqueShopModalPanel
      ariaLabelledBy="purchase-confirm-title"
      onBackdropClick={handleBackdrop}
      onDismiss={onBack}
      dismissAriaLabel="Retour à la visualisation"
      eyebrow="Confirmation d'achat"
      title="Tu confirmes cet achat ?"
      subtitle={
        <>
          <span className="text-white">{item.name}</span>
          <span className="text-white/60"> · </span>
          <span className="text-sky-200/90">{typeLabel}</span>
        </>
      }
      previewState={previewState}
      footer={
        <div className="space-y-3">
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
      }
    />
  )
}
