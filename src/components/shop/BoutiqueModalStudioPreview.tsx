import type { AvatarItem } from '../../types/profile'
import type { ModularAvatarState } from '../../features/avatar2d/modularAvatarState'
import { ModularAvatarCanvas } from '../profile/ModularAvatarCanvas'
import { resolveBoutiqueShoeSrc } from '../../utils/boutiqueShoeAssets'
import {
  resolveBoutiqueGarmentShow,
} from '../../utils/boutiqueModularState'

const GARMENTS_ZOOM = {
  both: 1.42,
  jersey: 1.58,
  shorts: 1.58,
  shoes: 1.85,
} as const

/**
 * Aperçu modale boutique — même logique que la grille, avec le personnage de l’utilisateur.
 */
export function BoutiqueModalStudioPreview({
  item,
  previewState,
}: {
  item: AvatarItem
  previewState: ModularAvatarState
}) {
  const garmentsShow = resolveBoutiqueGarmentShow(item)
  const isShoes = garmentsShow === 'shoes'
  const shoeFallbackSrc = isShoes ? (resolveBoutiqueShoeSrc(item) ?? undefined) : undefined

  return (
    <div className="relative mx-auto w-full max-w-[min(280px,100%)]">
      <div
        className={
          isShoes
            ? 'relative h-[min(56vw,260px)] min-h-[220px] w-full pt-1 sm:h-[300px] sm:min-h-0'
            : 'relative h-[min(52vw,240px)] min-h-[200px] w-full pt-1 sm:h-[340px] sm:min-h-0'
        }
      >
          <ModularAvatarCanvas
            state={previewState}
            crop="full"
            layersMode={isShoes ? 'full' : 'garments'}
            garmentsFocus={!isShoes}
            garmentsShow={garmentsShow}
            garmentsZoom={GARMENTS_ZOOM[garmentsShow]}
            feetFocus={isShoes}
            garmentFallbackSrc={shoeFallbackSrc}
            imagePriority
            fill
            className="h-full w-full"
          />
      </div>
    </div>
  )
}
