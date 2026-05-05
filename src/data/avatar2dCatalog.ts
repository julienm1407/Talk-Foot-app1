import type {
  AvatarIdentityItem,
  AvatarLoadoutSlot,
  AvatarStyleCategory,
  AvatarStyleItem,
  UserProfile,
} from '../types/profile'
import { avatarItems } from './shop'

export const identityCatalog: AvatarIdentityItem[] = [
  { id: 'base-default', name: 'Base', slot: 'base' },
  { id: 'eyes-default', name: 'Yeux', slot: 'eyes' },
  { id: 'beard-default', name: 'Barbe', slot: 'beard' },
  { id: 'hair-default', name: 'Cheveux', slot: 'hair' },
]

export const styleCatalog: AvatarStyleItem[] = avatarItems
  .filter((item) => item.slot === 'jersey' || item.slot === 'accessory')
  .map((item) => ({
    id: item.id,
    name: item.name,
    image: item.emoji,
    price: item.cost,
    category: item.slot === 'jersey' ? 'kit' : 'accessory',
    linkedAvatarItemId: item.id,
  }))

export const AVATAR_2D_DEFAULTS = {
  loadout: {
    base: 'base-default',
    eyes: 'eyes-default',
    beard: 'beard-default',
    hair: 'hair-default',
    kit: 'kit-default',
    accessory: 'accessory-default',
  },
  colors: {
    skinColor: '#e7bc91',
    eyeColor: '#5a3c2d',
    hairColor: '#2f241f',
  },
} as const

const DEFAULT_ITEM_BY_SLOT: Record<AvatarLoadoutSlot, string> = {
  base: AVATAR_2D_DEFAULTS.loadout.base,
  eyes: AVATAR_2D_DEFAULTS.loadout.eyes,
  beard: AVATAR_2D_DEFAULTS.loadout.beard,
  hair: AVATAR_2D_DEFAULTS.loadout.hair,
  kit: AVATAR_2D_DEFAULTS.loadout.kit,
  accessory: AVATAR_2D_DEFAULTS.loadout.accessory,
}

function isKnownStyleItem(id: string, category: AvatarStyleCategory): boolean {
  return styleCatalog.some((item) => item.id === id && item.category === category)
}

export function resolveAvatarLoadout(profile: UserProfile) {
  const fromProfile = profile.avatarLoadout
  const kitFromLegacy = profile.equippedItems?.jersey ?? undefined
  const accessoryFromLegacy = profile.equippedItems?.accessory ?? undefined

  const kit =
    fromProfile?.kit && isKnownStyleItem(fromProfile.kit, 'kit')
      ? fromProfile.kit
      : kitFromLegacy && isKnownStyleItem(kitFromLegacy, 'kit')
        ? kitFromLegacy
        : DEFAULT_ITEM_BY_SLOT.kit

  const accessory =
    fromProfile?.accessory && isKnownStyleItem(fromProfile.accessory, 'accessory')
      ? fromProfile.accessory
      : accessoryFromLegacy && isKnownStyleItem(accessoryFromLegacy, 'accessory')
        ? accessoryFromLegacy
        : DEFAULT_ITEM_BY_SLOT.accessory

  return {
    base: fromProfile?.base ?? DEFAULT_ITEM_BY_SLOT.base,
    eyes: fromProfile?.eyes ?? DEFAULT_ITEM_BY_SLOT.eyes,
    beard: fromProfile?.beard ?? DEFAULT_ITEM_BY_SLOT.beard,
    hair: fromProfile?.hair ?? DEFAULT_ITEM_BY_SLOT.hair,
    kit,
    accessory,
    skinColor: fromProfile?.skinColor ?? profile.characterLook?.skinTone ?? AVATAR_2D_DEFAULTS.colors.skinColor,
    eyeColor: fromProfile?.eyeColor ?? profile.characterLook?.eyeColor ?? AVATAR_2D_DEFAULTS.colors.eyeColor,
    hairColor: fromProfile?.hairColor ?? profile.characterLook?.hairColor ?? AVATAR_2D_DEFAULTS.colors.hairColor,
  }
}
