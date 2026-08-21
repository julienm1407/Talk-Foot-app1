import type { AvatarItem } from '../../types/profile'
import { viteBasePath } from '../../seo/basePath'
import { cn } from '../../utils/cn'

function publicAssetUrl(path: string): string {
  if (!path.startsWith('/')) return path
  const base = viteBasePath()
  return base ? `${base}${path}` : path
}

function jerseySrc(item: AvatarItem): string | null {
  return (
    item.jerseyVisual?.boutiqueImageUrl ??
    item.jerseyVisual?.imageUrl ??
    item.packVisual?.imageUrl ??
    null
  )
}

function shortsSrc(item: AvatarItem): string | null {
  return item.pantsVisual?.boutiqueImageUrl ?? item.pantsVisual?.imageUrl ?? null
}

function shoesSrc(item: AvatarItem): string | null {
  return item.shoesVisual?.imageUrl ?? null
}

/**
 * Vignette catalogue légère (PNG public) — évite ModularAvatarCanvas
 * et le chargement eager de tout le catalogue assets/ au premier paint.
 */
export function BoutiqueCatalogThumb({
  item,
  className,
}: {
  item: AvatarItem
  className?: string
}) {
  const isPack = Boolean(item.bundleIncludes?.length)
  const jersey = jerseySrc(item)
  const shorts = shortsSrc(item)
  const shoes = shoesSrc(item)

  if (item.slot === 'shoes' && shoes) {
    return (
      <div className={cn('relative z-[1] flex w-full items-center justify-center px-4 pb-3 pt-10', className)}>
        <img
          src={publicAssetUrl(shoes)}
          alt=""
          loading="lazy"
          decoding="async"
          className="max-h-[200px] w-auto max-w-[85%] object-contain drop-shadow-lg sm:max-h-[260px]"
        />
      </div>
    )
  }

  if (isPack && jersey && shorts) {
    return (
      <div
        className={cn(
          'relative z-[1] flex w-full items-end justify-center gap-1 px-2 pb-2 pt-10 sm:gap-2',
          className,
        )}
      >
        <img
          src={publicAssetUrl(jersey)}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-auto max-h-[210px] w-[48%] object-contain drop-shadow-lg sm:max-h-[280px]"
        />
        <img
          src={publicAssetUrl(shorts)}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-auto max-h-[160px] w-[40%] object-contain drop-shadow-lg sm:max-h-[210px]"
        />
      </div>
    )
  }

  const solo = item.slot === 'pants' ? shorts : jersey
  if (solo) {
    return (
      <div className={cn('relative z-[1] flex w-full items-end justify-center px-3 pb-2 pt-10', className)}>
        <img
          src={publicAssetUrl(solo)}
          alt=""
          loading="lazy"
          decoding="async"
          className="max-h-[220px] w-auto max-w-[90%] object-contain drop-shadow-lg sm:max-h-[300px]"
        />
      </div>
    )
  }

  return (
    <div className={cn('relative z-[1] flex w-full items-center justify-center py-16', className)}>
      <span className="text-5xl" aria-hidden>
        {item.emoji}
      </span>
    </div>
  )
}
