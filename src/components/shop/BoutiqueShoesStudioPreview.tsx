import type { AvatarItem } from '../../types/profile'
import { resolveBoutiqueShoeSrc } from '../../utils/boutiqueShoeAssets'
import { cn } from '../../utils/cn'

const STUDIO_FRAME =
  'mx-auto w-full max-w-[220px] overflow-hidden rounded-xl border border-white/15 bg-black/20 p-2 shadow-[0_16px_50px_rgba(2,8,23,0.55)] backdrop-blur-sm'

const VIEWPORT = 'relative aspect-[11/14] w-full'

/**
 * Aperçu chaussures — PNG crampons centré et zoomé dans le cadre studio.
 */
export function BoutiqueShoesStudioPreview({
  item,
  className,
}: {
  item: AvatarItem
  className?: string
}) {
  const src = resolveBoutiqueShoeSrc(item)

  return (
    <div className={cn('flex w-full max-w-full items-end justify-center', className)}>
      <div className={STUDIO_FRAME}>
        <div className={cn('flex items-center justify-center overflow-hidden', VIEWPORT)}>
          {src ? (
            <img
              src={src}
              alt=""
              draggable={false}
              loading="eager"
              decoding="async"
              className="pointer-events-none max-h-[118%] w-[118%] max-w-none select-none object-contain object-[center_72%]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center">
              <span className="text-5xl" aria-hidden>
                {item.emoji ?? '👟'}
              </span>
              <span className="text-[10px] font-bold text-white/40">Visuel indisponible</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
