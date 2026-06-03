import { defaultUserProfile } from '../data/userAppStateDefaults'
import { mergeCharacterLook } from '../data/characterPresets'
import { seedToLegoPalette } from './seedLegoPalette'
import type { User } from '../types/chat'
import type { UserProfile } from '../types/profile'

/**
 * Profil minimal pour afficher le même buste 3D POP qu’en profil, pour un autre user du chat.
 * Couleurs de base dérivées du seed si pas de `characterLook` synchronisé.
 */
export function buildChatPeerProfile(user: User | undefined): UserProfile {
  const seed = seedToLegoPalette(user?.avatarSeed ?? 'fan', user?.accent ?? 'violet')
  const look = mergeCharacterLook({
    ...seed,
    ...user?.characterLook,
    supporterTint: user?.characterLook?.supporterTint ?? Boolean(user?.fanClubId),
  })
  return {
    ...defaultUserProfile,
    characterLook: look,
    ...(user?.modularAvatar ? { modularAvatar: user.modularAvatar } : {}),
    equippedItems: {
      scarf: null,
      hat: null,
      jersey: null,
      accessory: null,
      pants: 'pants-kit',
      shoes: 'shoes-studs',
    },
    ownedItemIds: [],
  }
}
