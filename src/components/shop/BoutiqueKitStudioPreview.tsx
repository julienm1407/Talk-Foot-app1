import type { AvatarItem } from '../../types/profile'
import { resolveBoutiqueGarmentShow } from '../../utils/boutiqueModularIds'
import { resolveBoutiqueShoeSrc } from '../../utils/boutiqueShoeAssets'
import { cn } from '../../utils/cn'

const STUDIO_FRAME =
  'mx-auto w-full max-w-[220px] overflow-hidden rounded-xl border border-white/15 bg-black/20 p-2 shadow-[0_16px_50px_rgba(2,8,23,0.55)] backdrop-blur-sm'

const VIEWPORT = 'relative aspect-[11/14] w-full'

function catalogThumbSrc(item: AvatarItem): string | null {
  const show = resolveBoutiqueGarmentShow(item)
  if (show === 'shoes') return resolveBoutiqueShoeSrc(item)
  if (show === 'both') {
    return (
      item.packVisual?.imageUrl?.trim() ||
      item.jerseyVisual?.boutiqueImageUrl?.trim() ||
      item.jerseyVisual?.imageUrl?.trim() ||
      null
    )
  }
  if (show === 'jersey') {
    return (
      item.jerseyVisual?.boutiqueImageUrl?.trim() ||
      item.jerseyVisual?.imageUrl?.trim() ||
      null
    )
  }
  if (show === 'shorts') {
    return (
      item.pantsVisual?.boutiqueImageUrl?.trim() ||
      item.pantsVisual?.imageUrl?.trim() ||
      null
    )
  }
  return null
}

/**
 * Grille boutique : vignette PNG légère (pas de canvas modulaire).
 * Le studio 3D reste dans le modal d’achat (lazy).
 */
export function BoutiqueKitStudioPreview({
  item,
  className,
}: {
  item: AvatarItem
  className?: string
}) {
  const show = resolveBoutiqueGarmentShow(item)
  const src = catalogThumbSrc(item)
  const objectPos =
    show === 'shoes' ? 'object-[center_72%]' : show === 'shorts' ? 'object-[center_58%]' : 'object-center'

  return (
    <div className={cn('flex w-full max-w-full items-end justify-center', className)}>
      <div className={STUDIO_FRAME}>
        <div className={cn('flex items-center justify-center overflow-hidden', VIEWPORT)}>
          {src ? (
            <img
              src={src}
              alt=""
              draggable={false}
              loading="lazy"
              decoding="async"
              className={cn(
                'pointer-events-none max-h-full w-full max-w-full select-none object-contain',
                objectPos,
                show === 'shoes' && 'max-h-[118%] w-[118%] max-w-none',
              )}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center">
              <span className="text-5xl" aria-hidden>
                {item.emoji ?? '👕'}
              </span>
              <span className="text-[10px] font-bold text-white/40">Visuel indisponible</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
