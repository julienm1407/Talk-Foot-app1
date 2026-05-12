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
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="tf-boutique-3dwrap flex min-h-0 flex-1 items-center justify-center">
          <div className="tf-boutique-float-target">
            <JerseyPreviewThumb item={item} size="showcase" />
          </div>
        </div>
        <ShopEncartContentPanel>
          <div className="font-display font-black tracking-tight text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
            {item.name}
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-white/80">
            {SLOT_LABELS[item.slot]}
          </div>
          {item.inspirationNote ? (
            <p className="text-[11px] font-bold leading-snug text-amber-100">{item.inspirationNote}</p>
          ) : null}
          {item.description ? (
            <div className="text-xs font-medium leading-snug text-white/75">{item.description}</div>
          ) : null}
          <div className="space-y-2 border-t border-white/10 pt-2">
            <div className="font-display text-sm font-black tabular-nums text-white">
              {item.cost} 🏅
              <span className="mx-1 text-white/45">·</span>
              <span className="inline-flex items-center gap-1 text-emerald-100">
                {cosmeticTokenPrice(item.cost)}
                <TokenGlyph variant="onDark" className="size-4 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
              </span>
            </div>
            {item.jerseyVisual ? (
              <Button
                variant="soft"
                className={cn(shopEncartButtonClass(owned), 'w-full')}
                disabled={owned}
                onClick={() => !owned && openJerseyShop(item)}
              >
                {owned ? 'Possédé' : 'Personnaliser'}
              </Button>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant="soft"
                  className={cn(shopEncartButtonClass(owned), 'min-w-0 flex-1 text-[11px]')}
                  disabled={owned}
                  onClick={() => !owned && handleBuyCosmetic(item, 'medals')}
                >
                  {owned ? 'Possédé' : '🏅 Médailles'}
                </Button>
                <Button
                  variant="soft"
                  className={cn(shopEncartTokenButtonClass(owned), 'min-w-0 flex-1 text-[11px]')}
                  disabled={owned}
                  onClick={() => !owned && handleBuyCosmetic(item, 'tokens')}
                >
                  {owned ? (
                    'Possédé'
                  ) : (
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <TokenGlyph variant="onDark" className="size-4 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]" />
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
