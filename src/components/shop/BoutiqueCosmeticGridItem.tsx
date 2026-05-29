import { Button } from '../ui/Button'
import { TokenGlyph } from '../ui/TokenGlyph'
import { BoutiqueKitStudioPreview } from './BoutiqueKitStudioPreview'
import { shopEncartButtonClass, shopEncartTokenButtonClass } from './ShopRarityEncart'
import { cosmeticTokenPrice } from '../../data/shop'
import type { AvatarItem, AvatarSlot } from '../../types/profile'
import type { ShopRarity } from './ShopRarityEncart'
import { cn } from '../../utils/cn'

const SLOT_LABELS: Record<AvatarSlot, string> = {
  scarf: 'Écharpe',
  hat: 'Casquette',
  jersey: 'Maillot',
  accessory: 'Accessoire',
  pants: 'Short',
  shoes: 'Chaussures',
}

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

export function BoutiqueCosmeticGridItem({
  item,
  owned,
  handleBuyCosmetic,
}: {
  item: AvatarItem
  owned: boolean
  handleBuyCosmetic: (item: AvatarItem, currency: 'medals' | 'tokens', medalCost?: number) => void
}) {
  const tokenPrice = cosmeticTokenPrice(item.cost)
  const typeLabel = item.bundleIncludes?.length ? 'Pack maillot + short' : SLOT_LABELS[item.slot]
  const studioCard = usesStudioPreview(item)

  return (
    <article
      className={cn(
        'relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/20 bg-[#0a1220] shadow-[0_12px_40px_rgba(0,0,0,0.35)] ring-2',
        RARITY_RING[item.rarity],
        studioCard ? 'max-w-[300px]' : 'max-w-[220px]',
      )}
    >
      {studioCard ? (
        <div
          className={cn(
            'relative flex w-full flex-col items-center justify-end overflow-hidden',
            'min-h-[300px] bg-[radial-gradient(circle_at_50%_16%,rgba(56,189,248,0.26),transparent_58%)]',
            'px-2 pb-1 pt-5 sm:min-h-[340px] sm:px-3 sm:pt-6',
          )}
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:20px_20px]" />
          <BoutiqueKitStudioPreview item={item} className="relative z-[1]" />
        </div>
      ) : (
        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-white p-3">
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
          <Button
            variant="soft"
            className={cn(shopEncartButtonClass(owned), 'min-h-9 px-1 text-[10px] sm:min-h-10 sm:text-xs')}
            disabled={owned}
            onClick={() => !owned && handleBuyCosmetic(item, 'medals')}
          >
            {owned ? 'Possédé' : (
              <span className="tabular-nums">
                {item.cost} <span aria-hidden>🏅</span>
              </span>
            )}
          </Button>
          <Button
            variant="soft"
            className={cn(shopEncartTokenButtonClass(owned), 'min-h-9 px-1 text-[10px] sm:min-h-10 sm:text-xs')}
            disabled={owned}
            onClick={() => !owned && handleBuyCosmetic(item, 'tokens')}
          >
            {owned ? (
              'Possédé'
            ) : (
              <span className="inline-flex items-center justify-center gap-0.5 tabular-nums">
                {tokenPrice.toLocaleString('fr-FR')}
                <TokenGlyph variant="onDark" className="size-3.5 shrink-0" />
              </span>
            )}
          </Button>
        </div>
      </div>
    </article>
  )
}
