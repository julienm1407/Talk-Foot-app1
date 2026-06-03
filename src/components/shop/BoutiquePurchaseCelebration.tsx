import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ModularAvatarCanvas } from '../profile/ModularAvatarCanvas'
import { TokenGlyph } from '../ui/TokenGlyph'
import { useProfile } from '../../hooks/useProfile'
import { useWallet } from '../../hooks/useWallet'
import { cosmeticTokenPrice } from '../../data/shop'
import type { AvatarItem } from '../../types/profile'
import { profileStudioHref } from '../../utils/boutiquePurchaseFlow'
import { mergePurchasedItemOntoProfile, shopItemToModularAssetId } from '../../utils/boutiqueModularState'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

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
      ? `${item.cost.toLocaleString('fr-FR')} médailles 🏅`
      : `${cosmeticTokenPrice(item.cost).toLocaleString('fr-FR')} jetons`

  const itemLabel = item.bundleIncludes?.length ? 'Pack maillot + short' : item.name

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-[#030912]/88 p-4 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-celebration-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className={cn(
          'relative w-full max-w-lg overflow-hidden rounded-[28px] border border-tf-cdm-gold/45',
          'bg-gradient-to-b from-[#0c1f3d] via-[#081628] to-[#050a12] shadow-[0_32px_100px_rgba(0,0,0,0.55)]',
        )}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-tf-cdm-gold/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-12 size-40 rounded-full bg-sky-500/20 blur-3xl"
          aria-hidden
        />

        <header className="relative border-b border-white/10 px-5 py-5 text-center sm:px-7 sm:py-6">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-tf-cdm-gold">
            Achat confirmé
          </p>
          <h1
            id="purchase-celebration-title"
            className="mt-2 font-display text-2xl font-black leading-tight text-white sm:text-3xl"
          >
            Bravo, c&apos;est à toi !
          </h1>
          <p className="mt-2 text-sm font-semibold text-sky-100/85">
            <span className="text-white">{itemLabel}</span> est dans ton inventaire et porté sur ton
            personnage.
          </p>
        </header>

        <div className="relative flex justify-center px-4 py-4 sm:px-6 sm:py-5">
          <div className="relative w-full max-w-[280px]">
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,rgba(244,197,66,0.22),transparent_70%)]"
              aria-hidden
            />
            <div className="relative h-[min(72vw,320px)] w-full sm:h-[340px]">
              <ModularAvatarCanvas state={previewState} crop="full" fill className="h-full w-full" />
            </div>
            <span
              className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full border border-tf-cdm-gold/50 bg-tf-cdm-gold/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-tf-cdm-gold shadow-lg"
              aria-hidden
            >
              ★ Nouveau look
            </span>
          </div>
        </div>

        <div className="relative space-y-3 border-t border-white/10 px-5 py-4 sm:px-7">
          <div className="flex flex-wrap items-center justify-center gap-2 text-center text-xs font-bold text-white/75">
            <span className="rounded-lg bg-white/10 px-2.5 py-1">Payé : {paidLabel}</span>
            <span className="rounded-lg bg-white/10 px-2.5 py-1">
              Solde : {wallet.medals} 🏅 · {wallet.tokens}{' '}
              <TokenGlyph variant="onDark" className="inline size-3.5 align-[-2px]" />
            </span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
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
      </motion.div>
    </div>
  )
}
