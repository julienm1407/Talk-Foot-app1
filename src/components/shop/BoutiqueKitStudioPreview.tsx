import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { AvatarItem } from '../../types/profile'
import type { ModularAvatarState } from '../../features/avatar2d/modularAvatarState'
import { resolveBoutiqueGarmentShow } from '../../utils/boutiqueModularIds'
import { resolveBoutiqueShoeSrc } from '../../utils/boutiqueShoeAssets'
import { cn } from '../../utils/cn'

const ModularAvatarCanvas = lazy(() =>
  import('../profile/ModularAvatarCanvas').then((m) => ({ default: m.ModularAvatarCanvas })),
)

const GARMENTS_ZOOM = {
  both: 1.42,
  jersey: 1.58,
  shorts: 1.58,
} as const

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

function CatalogThumbPlaceholder({ item }: { item: AvatarItem }) {
  const show = resolveBoutiqueGarmentShow(item)
  const src = catalogThumbSrc(item)
  const objectPos =
    show === 'shoes' ? 'object-[center_72%]' : show === 'shorts' ? 'object-[center_58%]' : 'object-center'

  if (!src) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center">
        <span className="text-5xl" aria-hidden>
          {item.emoji ?? '👕'}
        </span>
      </div>
    )
  }

  return (
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
  )
}

function VisibleKitStudio({
  item,
  garmentsShow,
}: {
  item: AvatarItem
  garmentsShow: 'both' | 'jersey' | 'shorts'
}) {
  const [state, setState] = useState<ModularAvatarState | null>(null)

  useEffect(() => {
    let cancelled = false
    void import('../../utils/boutiqueModularState').then((m) => {
      if (cancelled) return
      setState(m.boutiqueItemToModularState(item))
    })
    return () => {
      cancelled = true
    }
  }, [item])

  if (!state) {
    return (
      <div className="flex h-full w-full items-center justify-center overflow-hidden">
        <CatalogThumbPlaceholder item={item} />
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center overflow-hidden">
          <CatalogThumbPlaceholder item={item} />
        </div>
      }
    >
      <ModularAvatarCanvas
        state={state}
        crop="full"
        layersMode="garments"
        garmentsFocus
        garmentsShow={garmentsShow}
        garmentsZoom={GARMENTS_ZOOM[garmentsShow]}
        fill
        className="h-full w-full"
      />
    </Suspense>
  )
}

/**
 * Studio profil dans la grille : beau canvas, monté seulement hors écran proche
 * (IntersectionObserver) + import lazy pour ne pas figer le mobile.
 */
export function BoutiqueKitStudioPreview({
  item,
  className,
}: {
  item: AvatarItem
  className?: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const garmentsShow = resolveBoutiqueGarmentShow(item)

  useEffect(() => {
    const el = rootRef.current
    if (!el || active) return
    if (typeof IntersectionObserver === 'undefined') {
      setActive(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true)
          io.disconnect()
        }
      },
      { root: null, rootMargin: '160px 0px', threshold: 0.05 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [active])

  if (garmentsShow === 'shoes') {
    const src = resolveBoutiqueShoeSrc(item)
    return (
      <div ref={rootRef} className={cn('flex w-full max-w-full items-end justify-center', className)}>
        <div className={STUDIO_FRAME}>
          <div className={cn('flex items-center justify-center overflow-hidden', VIEWPORT)}>
            {src ? (
              <img
                src={src}
                alt=""
                draggable={false}
                loading="lazy"
                decoding="async"
                className="pointer-events-none max-h-[118%] w-[118%] max-w-none select-none object-contain object-[center_72%]"
              />
            ) : (
              <CatalogThumbPlaceholder item={item} />
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={rootRef} className={cn('flex w-full max-w-full items-end justify-center', className)}>
      <div className={STUDIO_FRAME}>
        <div className={VIEWPORT}>
          {active ? (
            <VisibleKitStudio item={item} garmentsShow={garmentsShow} />
          ) : (
            <div className="flex h-full w-full items-center justify-center overflow-hidden">
              <CatalogThumbPlaceholder item={item} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
