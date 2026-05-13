import { Button } from '../ui/Button'
import { TokenGlyph } from '../ui/TokenGlyph'
import { JerseyPreviewThumb } from './JerseyPreviewThumb'
import {
  ShopEncartContentPanel,
  ShopRarityEncart,
  shopEncartButtonClass,
  shopEncartTokenButtonClass,
} from './ShopRarityEncart'
import { cosmeticTokenPrice } from '../../data/shop'
import type { AvatarItem, AvatarSlot } from '../../types/profile'
import { cn } from '../../utils/cn'

const SLOT_LABELS: Record<AvatarSlot, string> = {
  scarf: 'Écharpe',
  hat: 'Casquette / chapeau',
  jersey: 'Maillot',
  accessory: 'Accessoire',
  pants: 'Bas',
  shoes: 'Chaussures',
}

export function BoutiqueCosmeticGridItem({
  item,
  ownsItem,
  openJerseyShop,
  handleBuyCosmetic,
}: {
  item: AvatarItem
  ownsItem: (id: string) => boolean
  openJerseyShop: (item: AvatarItem, medalPrice?: number) => void
  handleBuyCosmetic: (item: AvatarItem, currency: 'medals' | 'tokens', medalCost?: number) => void
}) {
  const owned = ownsItem(item.id)
  return (
    <ShopRarityEncart rarity={item.rarity}>
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <div className="tf-boutique-3dwrap flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          <div className="tf-boutique-float-target">
            <JerseyPreviewThumb item={item} size="showcase" />
          </div>
        </div>
        <ShopEncartContentPanel className="mt-auto flex min-h-0 w-full max-h-[72%] flex-col gap-1 space-y-0 overflow-hidden px-2.5 py-1.5 sm:max-h-[58%] sm:px-3 sm:py-2.5">
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
            <div
              className="break-words font-display text-sm font-black leading-snug tracking-tight text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.6)] line-clamp-2 sm:text-[0.95rem]"
              title={item.name}
            >
              {item.name}
            </div>
            <div className="truncate text-[10px] font-bold uppercase tracking-wider text-white/80 sm:text-[11px]">
              {SLOT_LABELS[item.slot]}
            </div>
            {item.inspirationNote ? (
              <p
                className="break-words text-[10px] font-bold leading-snug text-amber-100 line-clamp-2 sm:text-[11px]"
                title={item.inspirationNote}
              >
                {item.inspirationNote}
              </p>
            ) : null}
            {item.description ? (
              <p
                className="break-words text-[10px] font-medium leading-snug text-white/75 line-clamp-2 sm:text-xs sm:line-clamp-3"
                title={item.description}
              >
                {item.description}
              </p>
            ) : null}
          </div>
          <div className="shrink-0 space-y-2 border-t border-white/10 pt-2">
            <div className="font-display text-xs font-black tabular-nums text-white sm:text-sm">
              {item.cost} 🏅
              <span className="mx-1 text-white/45">·</span>
              <span className="inline-flex items-center gap-1 text-emerald-100">
                {cosmeticTokenPrice(item.cost)}
                <TokenGlyph variant="onDark" className="size-3.5 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] sm:size-4" />
              </span>
            </div>
            {item.jerseyVisual ? (
              <Button
                variant="soft"
                className={cn(shopEncartButtonClass(owned), 'min-h-11 w-full')}
                disabled={owned}
                onClick={() => !owned && openJerseyShop(item)}
              >
                {owned ? 'Possédé' : 'Personnaliser'}
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  variant="soft"
                  className={cn(shopEncartButtonClass(owned), 'min-h-11 px-2 text-[10px] sm:text-[11px]')}
                  disabled={owned}
                  onClick={() => !owned && handleBuyCosmetic(item, 'medals')}
                >
                  {owned ? 'Possédé' : '🏅 Médailles'}
                </Button>
                <Button
                  variant="soft"
                  className={cn(shopEncartTokenButtonClass(owned), 'min-h-11 px-2 text-[10px] sm:text-[11px]')}
                  disabled={owned}
                  onClick={() => !owned && handleBuyCosmetic(item, 'tokens')}
                >
                  {owned ? (
                    'Possédé'
                  ) : (
                    <span className="inline-flex items-center justify-center gap-1">
                      <TokenGlyph variant="onDark" className="size-3.5 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] sm:size-4" />
                      Jetons
                    </span>
                  )}
                </Button>
              </div>
            )}
          </div>
        </ShopEncartContentPanel>
      </div>
    </ShopRarityEncart>
  )
}
