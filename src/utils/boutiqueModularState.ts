import type { AvatarItem } from '../types/profile'
import { resolveKitPreviewPair } from '../components/profile/Avatar2DKitPreview'
import {
  createDefaultModularAvatarState,
  resolveModularAvatarState,
  type ModularAvatarState,
} from '../features/avatar2d/modularAvatarState'
import type { UserProfile } from '../types/profile'

export type BoutiqueGarmentShow = 'both' | 'jersey' | 'shorts' | 'shoes'

export function resolveBoutiqueGarmentShow(item: AvatarItem): BoutiqueGarmentShow {
  if (item.slot === 'shoes') return 'shoes'
  if (item.bundleIncludes?.length) return 'both'
  if (item.slot === 'pants') return 'shorts'
  if (item.slot === 'jersey') return 'jersey'
  return 'both'
}

/** IDs assets modulaires (`assets/jerseys/jersey_fra.png` → `jerseys-jersey-fra`). */
export function modularJerseyId(item: AvatarItem): string | null {
  if (item.nationIso) return `jerseys-jersey-${item.nationIso.toLowerCase()}`
  const base = item.id.match(/^kit-base-(.+)$/)?.[1]
  if (base) return `jerseys-jersey-base-${base}`
  const club = item.id.match(/^club-([a-z0-9-]+)$/)?.[1]
  if (club) return `jerseys-jersey-club-${club}`
  const cdm = item.id.match(/^cdm2026-(?!short-|pack-)([a-z]+)$/)?.[1]
  if (cdm) return `jerseys-jersey-${cdm}`
  return null
}

export function modularShortsId(item: AvatarItem): string | null {
  if (item.id === 'pants-kit') return null
  if (item.nationIso) return `shorts-short-${item.nationIso.toLowerCase()}`
  const base = item.id.match(/^pants-base-(.+)$/)?.[1]
  if (base) return `shorts-short-base-${base}`
  const club = item.id.match(/^club-short-([a-z0-9-]+)$/)?.[1]
  if (club) return `shorts-short-club-${club}`
  const cdm = item.id.match(/^cdm2026-short-([a-z]+)$/)?.[1]
  if (cdm) return `shorts-short-${cdm}`
  return null
}

export function modularShoesId(item: AvatarItem): string | null {
  const fromUrl = item.shoesVisual?.imageUrl?.match(/\/shoes\/shoes_([a-z]+)\.png/i)?.[1]
  if (fromUrl) return `shoes-shoes-${fromUrl === 'base' ? 'base' : fromUrl}`
  const legacy: Record<string, string> = {
    'shoes-sneaker-white': 'shoes-shoes-base',
    'shoes-sneaker-neon': 'shoes-shoes-bleu',
    'shoes-retro-gum': 'shoes-shoes-rouge',
    'shoes-sneaker-jaune': 'shoes-shoes-jaune',
    'shoes-sneaker-vert': 'shoes-shoes-vert',
  }
  return legacy[item.id] ?? null
}

/** Asset modulaire principal lié à un achat boutique (maillot, short ou chaussures). */
export function shopItemToModularAssetId(item: AvatarItem): string | null {
  if (item.slot === 'shoes') return modularShoesId(item)
  if (item.slot === 'pants') return modularShortsId(item)
  if (item.slot === 'jersey') return modularJerseyId(item)
  if (item.bundleIncludes?.length) {
    const jerseyShopId =
      item.bundleIncludes.find((id) => !id.includes('short') && !id.includes('pack')) ??
      item.bundleIncludes[0]
    return modularJerseyId({ ...item, slot: 'jersey', id: jerseyShopId })
  }
  return null
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
