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
  'tf-kit-preview-lock mx-auto w-full max-w-[220px] overflow-hidden rounded-xl bg-transparent p-1'

const VIEWPORT = 'relative aspect-[11/14] w-full'

function catalogThumbSrc(item: AvatarItem): string | null {
  const show = resolveBoutiqueGarmentShow(item)
  if (show === 'shoes') return resolveBoutiqueShoeSrc(item)
  if (show === 'jersey') {
    return item.jerseyVisual?.imageUrl?.trim() || item.jerseyVisual?.boutiqueImageUrl?.trim() || null
  }
  if (show === 'shorts') {
    return item.pantsVisual?.imageUrl?.trim() || item.pantsVisual?.boutiqueImageUrl?.trim() || null
  }
  return null
}

/** Pack complet : maillot + short en calques (pas le PNG pack fond blanc). */
function PackKitLayeredPreview({ item }: { item: AvatarItem }) {
  const jersey = item.jerseyVisual?.imageUrl?.trim() || item.jerseyVisual?.boutiqueImageUrl?.trim() || null
  const shorts = item.pantsVisual?.imageUrl?.trim() || item.pantsVisual?.boutiqueImageUrl?.trim() || null
  const [jerseyBroken, setJerseyBroken] = useState(false)
  const [shortsBroken, setShortsBroken] = useState(false)
  const showJersey = Boolean(jersey) && !jerseyBroken
  const showShorts = Boolean(shorts) && !shortsBroken

  if (!showJersey && !showShorts) {
    return <CatalogThumbPlaceholder item={item} />
  }

  return (
    <div className="relative h-full w-full">
      {showJersey ? (
        <img
          src={jersey!}
          alt=""
          draggable={false}
          loading="lazy"
          decoding="async"
          onError={() => setJerseyBroken(true)}
          className="pointer-events-none absolute left-1/2 top-[2%] z-[1] h-[54%] w-[92%] max-w-none -translate-x-1/2 select-none object-contain object-bottom"
        />
      ) : null}
      {showShorts ? (
        <img
          src={shorts!}
          alt=""
          draggable={false}
          loading="lazy"
          decoding="async"
          onError={() => setShortsBroken(true)}
          className="pointer-events-none absolute bottom-[2%] left-1/2 z-[2] h-[50%] w-[84%] max-w-none -translate-x-1/2 select-none object-contain object-top"
        />
      ) : null}
    </div>
  )
}

function CatalogThumbPlaceholder({ item }: { item: AvatarItem }) {
  const show = resolveBoutiqueGarmentShow(item)
  const src = catalogThumbSrc(item)
  const [broken, setBroken] = useState(false)
  const objectPos =
    show === 'shoes' ? 'object-[center_72%]' : show === 'shorts' ? 'object-[center_58%]' : 'object-center'

  if (!src || broken) {
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
      onError={() => setBroken(true)}
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

  if (garmentsShow === 'both') {
    return (
      <div ref={rootRef} className={cn('flex w-full max-w-full items-end justify-center', className)}>
        <div className={STUDIO_FRAME}>
          <div className={VIEWPORT}>
            <PackKitLayeredPreview item={item} />
          </div>
        </div>
      </div>
    )
  }

  const preferStaticThumb = Boolean(catalogThumbSrc(item))
  return (
    <div ref={rootRef} className={cn('flex w-full max-w-full items-end justify-center', className)}>
      <div className={STUDIO_FRAME}>
        <div className={VIEWPORT}>
          {preferStaticThumb || !active ? (
            <div className="flex h-full w-full items-center justify-center overflow-hidden">
              <CatalogThumbPlaceholder item={item} />
            </div>
          ) : (
            <VisibleKitStudio item={item} garmentsShow={garmentsShow} />
          )}
        </div>
      </div>
    </div>
  )
}
