import type { AvatarItem } from '../../types/profile'
import { ModularAvatarCanvas } from '../profile/ModularAvatarCanvas'
import { BoutiqueShoesStudioPreview } from './BoutiqueShoesStudioPreview'
import {
  boutiqueItemToModularState,
  resolveBoutiqueGarmentShow,
} from '../../utils/boutiqueModularState'
import { viteBasePath } from '../../seo/basePath'
import { cn } from '../../utils/cn'

const GARMENTS_ZOOM = {
  both: 1.42,
  jersey: 1.58,
  shorts: 1.58,
} as const

const STUDIO_FRAME =
  'mx-auto w-full max-w-[220px] overflow-hidden rounded-xl border border-white/15 bg-black/20 p-2 shadow-[0_16px_50px_rgba(2,8,23,0.55)] backdrop-blur-sm'

/** Taille relative à la carte boutique (évite le décalage en grille 2 colonnes mobile). */
const VIEWPORT = 'relative aspect-[11/14] w-full'

function boutiqueAssetSrc(url: string | undefined): string | undefined {
  if (!url) return undefined
  if (!url.startsWith('/')) return url
  const base = viteBasePath()
  return base ? `${base}${url}` : url
}

function BoutiqueGarmentPngPreview({
  src,
  objectPosition = 'center 58%',
  className,
}: {
  src: string
  objectPosition?: string
  className?: string
}) {
  return (
    <div className={cn('flex w-full max-w-full items-end justify-center', className)}>
      <div className={STUDIO_FRAME}>
        <div className={cn('flex items-center justify-center overflow-hidden', VIEWPORT)}>
          <img
            src={src}
            alt=""
            draggable={false}
            loading="eager"
            decoding="async"
            className="pointer-events-none max-h-[118%] w-[118%] max-w-none select-none object-contain"
            style={{ objectPosition }}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Studio profil : cadre sombre + canvas modulaire (maillot, short ou pack).
 */
export function BoutiqueKitStudioPreview({
  item,
  className,
}: {
  item: AvatarItem
  className?: string
}) {
  const garmentsShow = resolveBoutiqueGarmentShow(item)

  if (garmentsShow === 'shoes') {
    return <BoutiqueShoesStudioPreview item={item} className={className} />
  }

  if (garmentsShow === 'jersey') {
    const src = boutiqueAssetSrc(item.jerseyVisual?.boutiqueImageUrl ?? item.jerseyVisual?.imageUrl)
    if (src) {
      return <BoutiqueGarmentPngPreview src={src} className={className} />
    }
  }

  if (garmentsShow === 'shorts') {
    const src = boutiqueAssetSrc(item.pantsVisual?.boutiqueImageUrl ?? item.pantsVisual?.imageUrl)
    if (src) {
      return <BoutiqueGarmentPngPreview src={src} objectPosition="center 72%" className={className} />
    }
  }

  const state = boutiqueItemToModularState(item)

  return (
    <div className={cn('flex w-full max-w-full items-end justify-center', className)}>
      <div className={STUDIO_FRAME}>
        <div className={VIEWPORT}>
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
        </div>
      </div>
    </div>
  )
}
