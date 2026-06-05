import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TokenGlyph } from '../ui/TokenGlyph'
import { useProfile } from '../../hooks/useProfile'
import { useWallet } from '../../hooks/useWallet'
import { getEffectiveMedalCost, getEffectiveTokenCost } from '../../data/boutiqueDailyDeal'
import type { AvatarItem } from '../../types/profile'
import { profileStudioHref } from '../../utils/boutiquePurchaseFlow'
import { mergePurchasedItemOntoProfile, shopItemToModularAssetId } from '../../utils/boutiqueModularState'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { BoutiqueShopModalPanel } from './BoutiqueShopModalPanel'

export function BoutiquePurchaseCelebration({
  item,
  currency,
  returnTo = '/boutique',
}: {
  item: AvatarItem
  currency: 'medals' | 'tokens'
  returnTo?: string
}) {
  const { profile } = useProfile()
  const { wallet } = useWallet()

  const previewState = useMemo(
    () => mergePurchasedItemOntoProfile(profile, item),
    [profile, item],
  )

  const studioTo = useMemo(
    () => profileStudioHref(shopItemToModularAssetId(item), item.id),
    [item],
  )

  const paidLabel =
    currency === 'medals'
      ? `${getEffectiveMedalCost(item).toLocaleString('fr-FR')} médailles 🏅`
      : `${getEffectiveTokenCost(item).toLocaleString('fr-FR')} jetons`

  const itemLabel = item.bundleIncludes?.length ? 'Pack maillot + short' : item.name

  return (
    <BoutiqueShopModalPanel
      ariaLabelledBy="purchase-celebration-title"
      tone="celebration"
      previewBadge="★ Nouveau look"
      eyebrow="Achat confirmé"
      title="Bravo, c'est à toi !"
      subtitle={
        <>
          <span className="text-white">{itemLabel}</span> est dans ton inventaire et porté sur ton
          personnage.
        </>
      }
      previewState={previewState}
      previewItem={item}
      footer={
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2 text-center text-xs font-bold text-white/75">
            <span className="rounded-lg bg-white/10 px-2.5 py-1">Payé : {paidLabel}</span>
            <span className="rounded-lg bg-white/10 px-2.5 py-1">
              Solde : {wallet.medals} 🏅 · {wallet.tokens}{' '}
              <TokenGlyph variant="onDark" className="inline size-3.5 align-[-2px]" />
            </span>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Link
              to={studioTo}
              className={cn(
                TF_FOCUS_VISIBLE,
                'inline-flex min-h-tf-touch flex-1 items-center justify-center rounded-2xl bg-tf-cdm-gold px-5 py-3 text-sm font-black text-tf-cdm-deep shadow-[0_8px_28px_rgba(244,197,66,0.35)] transition hover:bg-tf-cdm-gold/90 sm:flex-initial sm:min-w-[11rem]',
              )}
            >
              Personnaliser
            </Link>
            <Link
              to={returnTo}
              className={cn(
                TF_FOCUS_VISIBLE,
                'inline-flex min-h-tf-touch flex-1 items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15 sm:flex-initial sm:min-w-[11rem]',
              )}
            >
              Continuer mes achats
            </Link>
          </div>
          <p className="text-center text-[10px] font-semibold text-white/45">
            Tu peux ajuster le look dans le studio à tout moment.
          </p>
        </div>
      }
    />
  )
}
