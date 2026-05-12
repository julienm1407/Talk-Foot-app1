import { mergeCharacterLook } from '../../../../data/characterPresets'
import { avatarItems } from '../../../../data/shop'
import { teamColors } from '../../../../data/teams'
import type { UserProfile, AvatarCharacterLook, JerseyPattern, AvatarItem } from '../../../../types/profile'

export type Torso3D = {
  primary: string
  secondary: string
  stripeLight: string
  pattern: JerseyPattern
}

export type PopAvatarConfig = {
  look: AvatarCharacterLook
  torso: Torso3D
  glasses: AvatarCharacterLook['glasses']
  hasScarf: boolean
  hasAccessory: boolean
  hasShopJersey: boolean
  /** Modèle 3D de couvre-chef (look prioritaire, sinon chapeau boutique) */
  headwear3d: AvatarCharacterLook['headwear']
}

function resolveTorso3D(
  look: AvatarCharacterLook,
  jerseyOverride: { primary: string; secondary: string; pattern: JerseyPattern; stripeLight?: string } | null,
  supporter: [string, string] | null,
): Torso3D {
  if (jerseyOverride) {
    return {
      primary: jerseyOverride.primary,
      secondary: jerseyOverride.secondary,
      pattern: jerseyOverride.pattern,
      stripeLight: jerseyOverride.stripeLight ?? '#f8fafc',
    }
  }
  if (look.supporterTint && supporter) {
    return {
      primary: supporter[0],
      secondary: supporter[1],
      pattern: look.outfitPattern,
      stripeLight: '#f8fafc',
    }
  }
  return {
    primary: look.outfitPrimary,
    secondary: look.outfitSecondary,
    pattern: look.outfitPattern,
    stripeLight: '#f8fafc',
  }
}

/**
 * Tout le nécessaire pour brancher l’apparence SVG → géométrie 3D POP.
 */
export function resolvePopAvatarConfig(
  profile: UserProfile,
  favoriteClubId: string | null | undefined,
): PopAvatarConfig {
  const look = mergeCharacterLook(profile.characterLook)
  const eq = profile.equippedItems ?? {}
  const hatItem = eq.hat ? avatarItems.find((i: AvatarItem) => i.id === eq.hat) : null
  const jerseyItem = eq.jersey ? avatarItems.find((i: AvatarItem) => i.id === eq.jersey) : null
  const jerseyOverride = jerseyItem?.jerseyVisual
    ? {
        primary: jerseyItem.jerseyVisual.primary,
        secondary: jerseyItem.jerseyVisual.secondary,
        pattern: jerseyItem.jerseyVisual.pattern,
        stripeLight: jerseyItem.jerseyVisual.stripeLight,
      }
    : null

  const supporter: [string, string] | null =
    look.supporterTint && favoriteClubId && teamColors[favoriteClubId]
      ? (teamColors[favoriteClubId] as [string, string])
      : null

  const torso = resolveTorso3D(look, jerseyOverride, supporter)
  const headwear3d: AvatarCharacterLook['headwear'] =
    look.headwear !== 'none' ? look.headwear : hatItem ? 'cap' : 'none'

  return {
    look,
    torso,
    headwear3d,
    glasses: look.glasses,
    hasScarf: Boolean(eq.scarf),
    hasAccessory: Boolean(eq.accessory && eq.accessory !== 'accessory-default'),
    hasShopJersey: Boolean(jerseyItem?.jerseyVisual),
  }
}
