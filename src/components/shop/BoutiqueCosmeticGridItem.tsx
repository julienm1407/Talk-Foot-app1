import { TokenGlyph } from '../ui/TokenGlyph'
import { BoutiqueKitStudioPreview } from './BoutiqueKitStudioPreview'
import { shopEncartButtonClass, shopEncartTokenButtonClass } from './ShopRarityEncart'
import {
  getEffectiveMedalCost,
  getEffectiveTokenCost,
  isDailyDealItem,
} from '../../data/boutiqueDailyDeal'
import type { AvatarItem } from '../../types/profile'
import type { ShopRarity } from './ShopRarityEncart'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { boutiqueItemTypeLabel } from './boutiqueItemLabels'

const RARITY_RING: Record<ShopRarity, string> = {
  common: 'ring-cyan-400/50',
  rare: 'ring-orange-400/50',
  epic: 'ring-violet-400/55',
  legendary: 'ring-amber-300/55',
}

function usesStudioPreview(item: AvatarItem): boolean {
  return (
    item.slot === 'shoes' ||
    Boolean(item.bundleIncludes?.length) ||
    item.slot === 'jersey' ||
    item.slot === 'pants' ||
    Boolean(item.jerseyVisual?.imageUrl) ||
    Boolean(item.pantsVisual?.imageUrl)
  )
}

const encartClass = (item: AvatarItem, owned: boolean, dailyDeal: boolean) =>
  cn(
    'relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/20 bg-[#0a1220] text-left shadow-[0_12px_40px_rgba(0,0,0,0.35)] ring-2',
    dailyDeal && !owned ? 'ring-amber-400/65' : RARITY_RING[item.rarity],
    usesStudioPreview(item) ? 'max-w-[300px]' : 'max-w-[220px]',
    !owned &&
      cn(
        TF_FOCUS_VISIBLE,
        'cursor-pointer appearance-none border-0 p-0 font-inherit transition hover:border-sky-400/40 hover:shadow-[0_16px_48px_rgba(56,189,248,0.2)]',
      ),
  )

function EncartBody({
  item,
  owned,
  typeLabel,
  medalCost,
  listCost,
  tokenPrice,
  dailyDeal,
  studioCard,
}: {
  item: AvatarItem
  owned: boolean
  typeLabel: string
  medalCost: number
  listCost: number
  tokenPrice: number
  dailyDeal: boolean
  studioCard: boolean
}) {
  return (
    <>
      {dailyDeal && !owned ? (
        <span className="absolute left-2 top-2 z-[3] rounded-md border border-amber-300/50 bg-amber-500/90 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-950 shadow-sm">
          Offre du jour
        </span>
      ) : null}
      {studioCard ? (
        <div
          className={cn(
            'pointer-events-none relative flex w-full flex-col items-center justify-end overflow-hidden',
            'min-h-[300px] bg-[radial-gradient(circle_at_50%_16%,rgba(56,189,248,0.26),transparent_58%)]',
            'px-2 pb-1 pt-5 sm:min-h-[340px] sm:px-3 sm:pt-6',
          )}
        >
          <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:20px_20px]" />
          {!owned ? (
            <span className="absolute inset-x-0 top-3 z-[2] text-center text-[9px] font-black uppercase tracking-[0.2em] text-sky-200/70">
              Toucher pour visualiser
            </span>
          ) : null}
          <BoutiqueKitStudioPreview item={item} className="relative z-[1]" />
        </div>
      ) : (
        <div className="pointer-events-none relative flex aspect-square w-full items-center justify-center overflow-hidden bg-white p-3">
          <span className="text-5xl" aria-hidden>
            {item.emoji}
          </span>
        </div>
      )}

      <div className="shrink-0 border-t border-white/10 bg-[#050a12] px-2.5 py-2.5 sm:px-3 sm:py-3">
        <div className="min-w-0 space-y-0.5">
          <p
            className="font-display text-[11px] font-black leading-snug text-white sm:text-xs"
            title={item.name}
          >
            {item.emoji ? `${item.emoji} ` : null}
            {item.name}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-wide text-white/55 sm:text-[10px]">
            {typeLabel}
          </p>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <div
            className={cn(
              shopEncartButtonClass(owned),
              'flex min-h-9 items-center justify-center px-1 text-[10px] sm:min-h-10 sm:text-xs',
              owned && 'opacity-70',
            )}
          >
            {owned ? (
              'Possédé'
            ) : dailyDeal && listCost > medalCost ? (
              <span className="tabular-nums">
                <span className="text-white/45 line-through">{listCost}</span>{' '}
                {medalCost} <span aria-hidden>🏅</span>
              </span>
            ) : (
              <span className="tabular-nums">
                {medalCost} <span aria-hidden>🏅</span>
              </span>
            )}
          </div>
          <div
            className={cn(
              shopEncartTokenButtonClass(owned),
              'flex min-h-9 items-center justify-center px-1 text-[10px] sm:min-h-10 sm:text-xs',
              owned && 'opacity-70',
            )}
          >
            {owned ? (
              'Possédé'
            ) : (
              <span className="inline-flex items-center justify-center gap-0.5 tabular-nums">
                {tokenPrice.toLocaleString('fr-FR')}
                <TokenGlyph variant="onDark" className="size-3.5 shrink-0" />
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export function BoutiqueCosmeticGridItem({
  item,
  owned,
  onOpenItem,
}: {
  item: AvatarItem
  owned: boolean
  onOpenItem: (item: AvatarItem) => void
}) {
  const medalCost = getEffectiveMedalCost(item)
  const listCost = item.cost
  const tokenPrice = getEffectiveTokenCost(item)
  const dailyDeal = isDailyDealItem(item.id)
  const typeLabel = boutiqueItemTypeLabel(item)
  const studioCard = usesStudioPreview(item)
  const bodyProps = {
    item,
    owned,
    typeLabel,
    medalCost,
    listCost,
    tokenPrice,
    dailyDeal,
    studioCard,
  }

  const handleOpen = () => {
    window.setTimeout(() => onOpenItem(item), 0)
  }

  if (owned) {
    return (
      <article className={encartClass(item, true, dailyDeal)}>
        <EncartBody {...bodyProps} />
      </article>
    )
  }

  return (
    <button type="button" className={encartClass(item, false, dailyDeal)} onClick={handleOpen}>
      <EncartBody {...bodyProps} />
    </button>
  )
}
