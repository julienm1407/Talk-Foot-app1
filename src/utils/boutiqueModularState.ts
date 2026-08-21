import type { AvatarItem } from '../types/profile'
import { resolveKitPreviewPair } from '../components/profile/Avatar2DKitPreview'
import {
  createDefaultModularAvatarState,
  resolveModularAvatarState,
  type ModularAvatarState,
} from '../features/avatar2d/modularAvatarState'
import type { UserProfile } from '../types/profile'
import {
  modularJerseyId,
  modularShoesId,
  modularShortsId,
  resolveBoutiqueGarmentShow,
  shopItemToModularAssetId,
  type BoutiqueGarmentShow,
} from './boutiqueModularIds'

export type { BoutiqueGarmentShow }
export {
  modularJerseyId,
  modularShoesId,
  modularShortsId,
  resolveBoutiqueGarmentShow,
  shopItemToModularAssetId,
}

/** État modulaire boutique (sans corps / visage). */
export function boutiqueItemToModularState(item: AvatarItem): ModularAvatarState {
  const base = createDefaultModularAvatarState()
  const show = resolveBoutiqueGarmentShow(item)

  if (show === 'shoes') {
    const shoesId = modularShoesId(item)
    return {
      data: {
        skinTone: base.data.skinTone,
        body: null,
        hair: null,
        eyes: null,
        eyebrows: null,
        nose: null,
        mouth: null,
        beard: null,
        jersey: null,
        shorts: null,
        socks: null,
        shoes: shoesId,
        accessory: null,
      },
      slotColors: base.slotColors,
    }
  }

  const { kit, pants } = resolveKitPreviewPair(item)

  return {
    data: {
      skinTone: base.data.skinTone,
      body: null,
      hair: null,
      eyes: null,
      eyebrows: null,
      nose: null,
      mouth: null,
      beard: null,
      jersey: show === 'both' || show === 'jersey' ? modularJerseyId(kit) : null,
      shorts: show === 'both' || show === 'shorts' ? modularShortsId(pants) : null,
      socks: null,
      shoes: null,
      accessory: null,
    },
    slotColors: base.slotColors,
  }
}

/** Aperçu post-achat : ton personnage avec la pièce achetée équipée. */
export function mergePurchasedItemOntoProfile(
  profile: UserProfile,
  item: AvatarItem,
): ModularAvatarState {
  const user = resolveModularAvatarState(profile.modularAvatar ?? createDefaultModularAvatarState())
  const bought = boutiqueItemToModularState(item)
  return {
    ...user,
    data: {
      ...user.data,
      jersey: bought.data.jersey ?? user.data.jersey,
      shorts: bought.data.shorts ?? user.data.shorts,
      shoes: bought.data.shoes ?? user.data.shoes,
    },
  }
}
