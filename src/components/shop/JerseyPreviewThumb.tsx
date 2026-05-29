import type { AvatarItem } from '../../types/profile'
import { viteBasePath } from '../../seo/basePath'
import { cn } from '../../utils/cn'

type Props = {
  item: AvatarItem
  fillCard?: boolean
  className?: string
}

function publicSrc(url: string): string {
  if (!url.startsWith('/')) return url
  const base = viteBasePath()
  return base ? `${base}${url}` : url
}

function GarmentImg({ src, className }: { src: string; className?: string }) {
  return (
    <img
      src={publicSrc(src)}
      alt=""
      draggable={false}
      loading="eager"
      decoding="async"
      className={cn('pointer-events-none max-w-full select-none object-contain', className)}
    />
  )
}

/** Aperçu simple (chaussures, vignettes hors carte tenue). */
export function JerseyPreviewThumb({ item, fillCard = false, className }: Props) {
  if (fillCard) {
    if (item.slot === 'shoes' && item.shoesVisual?.imageUrl) {
      return (
        <div className={cn('flex h-full w-full items-center justify-center', className)}>
          <GarmentImg src={item.shoesVisual.imageUrl} className="h-[85%] w-[85%]" />
        </div>
      )
    }

    return (
      <div className={cn('flex h-full w-full items-center justify-center', className)}>
        <span className="text-5xl" aria-hidden>
          {item.emoji}
        </span>
      </div>
    )
  }

  const url =
    item.jerseyVisual?.imageUrl ?? item.pantsVisual?.imageUrl ?? item.shoesVisual?.imageUrl
  if (url) {
    return (
      <div className={cn('flex h-full w-full items-center justify-center', className)}>
        <GarmentImg src={url} className="max-h-full max-w-full" />
      </div>
    )
  }

  return (
    <span className={cn('text-4xl', className)} aria-hidden>
      {item.emoji}
    </span>
  )
}
