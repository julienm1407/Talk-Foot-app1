import type { AvatarItem } from '../types/profile'
import {
  resolveModularAvatarState,
  type ModularAvatarState,
} from '../features/avatar2d/modularAvatarState'

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
  if (item.nationIso && item.slot !== 'pants' && !item.id.includes('short')) {
    return `jerseys-jersey-${item.nationIso.toLowerCase()}`
  }
  const base = item.id.match(/^kit-base-(.+)$/)?.[1]
  if (base) return `jerseys-jersey-base-${base}`
  // Exclure club-short-* et club-pack-* (sinon « pack-rma » / « short-rma » passent pour un club)
  const club = item.id.match(/^club-(?!short-|pack-)([a-z0-9-]+)$/)?.[1]
  if (club) return `jerseys-jersey-club-${club}`
  if (item.clubId && item.slot === 'jersey' && !item.bundleIncludes?.length) {
    return `jerseys-jersey-club-${item.clubId}`
  }
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
  if (item.slot === 'jersey' && !item.bundleIncludes?.length) return modularJerseyId(item)
  if (item.bundleIncludes?.length) {
    const jerseyShopId =
      item.bundleIncludes.find((id) => !id.includes('short') && !id.includes('pack')) ??
      item.bundleIncludes[0]
    return modularJerseyId({ ...item, slot: 'jersey', id: jerseyShopId, bundleIncludes: undefined })
  }
  if (item.slot === 'jersey') return modularJerseyId(item)
  return null
}

function shopIdAsItem(id: string, slot: AvatarItem['slot']): AvatarItem {
  return { id, name: id, slot, emoji: '👕', cost: 0, rarity: 'common' }
}

/** Équipe maillot / short / chaussures à partir des ids boutique accordés (achat / pack). */
export function applyShopGrantIdsToModularAvatar(
  state: ModularAvatarState,
  grantIds: string[],
): ModularAvatarState {
  const current = resolveModularAvatarState(state)
  let jersey = current.data.jersey
  let shorts = current.data.shorts
  let shoes = current.data.shoes
  for (const raw of grantIds) {
    const id = raw.trim()
    if (!id || id.includes('-pack-') || id.endsWith('-pack') || id.startsWith('pack-')) continue
    const asJersey = modularJerseyId(shopIdAsItem(id, 'jersey'))
    if (asJersey) {
      jersey = asJersey
      continue
    }
    const asShorts = modularShortsId(shopIdAsItem(id, 'pants'))
    if (asShorts) {
      shorts = asShorts
      continue
    }
    const asShoes = modularShoesId(shopIdAsItem(id, 'shoes'))
    if (asShoes) shoes = asShoes
  }
  return {
    ...current,
    data: {
      ...current.data,
      jersey,
      shorts,
      shoes,
    },
    updatedAt: Date.now(),
  }
}
