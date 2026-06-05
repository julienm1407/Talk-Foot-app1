import type { AvatarItem } from '../../types/profile'
import type { ModularAvatarState } from '../../features/avatar2d/modularAvatarState'
import { ModularAvatarCanvas } from '../profile/ModularAvatarCanvas'
import { resolveBoutiqueShoeSrc } from '../../utils/boutiqueShoeAssets'
import {
  resolveBoutiqueGarmentShow,
} from '../../utils/boutiqueModularState'

const SHOES_ZOOM = 1.85

/**
 * Aperçu modale boutique — personnage complet de l’utilisateur avec la pièce équipée.
 * (La grille catalogue reste en mode vêtements seuls ; ici on montre « sur ton avatar ».)
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
            : 'relative h-[min(52vw,240px)] min-h-[200px] w-full pt-1 sm:h-[340px] sm:min-h-0 sm:max-h-[340px]'
        }
      >
        <ModularAvatarCanvas
          state={previewState}
          crop="full"
          layersMode="full"
          feetFocus={isShoes}
          garmentsZoom={isShoes ? SHOES_ZOOM : undefined}
          garmentFallbackSrc={shoeFallbackSrc}
          imagePriority
          fill
          className="h-full w-full"
        />
      </div>
    </div>
  )
}
