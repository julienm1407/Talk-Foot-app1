import type { AvatarItem } from '../../types/profile'
import { ModularAvatarCanvas } from '../profile/ModularAvatarCanvas'
import { BoutiqueShoesStudioPreview } from './BoutiqueShoesStudioPreview'
import {
  boutiqueItemToModularState,
  resolveBoutiqueGarmentShow,
} from '../../utils/boutiqueModularState'
import { cn } from '../../utils/cn'

const GARMENTS_ZOOM = {
  both: 1.42,
  jersey: 1.58,
  shorts: 1.58,
} as const

const STUDIO_FRAME =
  'overflow-hidden rounded-xl border border-white/15 bg-black/20 p-2 shadow-[0_16px_50px_rgba(2,8,23,0.55)] backdrop-blur-sm'

const VIEWPORT = 'h-[min(72vw,260px)] w-[min(58vw,210px)] sm:h-[280px] sm:w-[220px]'

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

  const state = boutiqueItemToModularState(item)

  return (
    <div className={cn('flex w-full items-end justify-center', className)}>
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
