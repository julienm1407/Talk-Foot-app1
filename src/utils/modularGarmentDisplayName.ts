import type { AvatarAsset, AvatarAssetCategory } from '../features/avatar2d/types'
import { ALL_CLUBS_BY_ID } from '../data/allClubsCatalog'
import { NATIONS } from '../data/nations'
import { isModularAssetUnlocked, isModularGarmentFree } from './modularGarmentAccess'

const NATION_NAME_BY_SLUG = new Map(
  NATIONS.map((n) => [n.iso.toLowerCase(), n.nameFr]),
)

const BASE_COLOR_FR: Record<string, string> = {
  blanc: 'blanc',
  bleu: 'bleu',
  jaune: 'jaune',
  rouge: 'rouge',
}

function nationNameFromSlug(slug: string): string {
  return NATION_NAME_BY_SLUG.get(slug.toLowerCase()) ?? slug.toUpperCase()
}

function clubNameFromId(clubId: string): string {
  return ALL_CLUBS_BY_ID[clubId]?.shortName ?? clubId
}

/** Libellé studio : « Maillot France », « Maillot blanc », etc. */
export function modularJerseyDisplayName(assetId: string): string | null {
  const base = assetId.match(/^jerseys-jersey-base-(.+)$/)
  if (base) {
    const color = BASE_COLOR_FR[base[1]] ?? base[1]
    return `Maillot ${color}`
  }
  const club = assetId.match(/^jerseys-jersey-club-([a-z0-9-]+)$/i)
  if (club) return `Maillot ${clubNameFromId(club[1].toLowerCase())}`
  const nation = assetId.match(/^jerseys-jersey-([a-z]{3})$/i)
  if (nation) return `Maillot ${nationNameFromSlug(nation[1])}`
  return null
}

/** Libellé studio : « Short France », « Short bleu », etc. */
export function modularShortsDisplayName(assetId: string): string | null {
  const base = assetId.match(/^shorts-short-base-(.+)$/)
  if (base) {
    const color = BASE_COLOR_FR[base[1]] ?? base[1]
    return `Short ${color}`
  }
  const club = assetId.match(/^shorts-short-club-([a-z0-9-]+)$/i)
  if (club) return `Short ${clubNameFromId(club[1].toLowerCase())}`
  const nation = assetId.match(/^shorts-short-([a-z]{3})$/i)
  if (nation) return `Short ${nationNameFromSlug(nation[1])}`
  return null
}

export function modularGarmentDisplayName(
  assetId: string,
  category: AvatarAssetCategory,
): string | null {
  if (category === 'jerseys') return modularJerseyDisplayName(assetId)
  if (category === 'shorts') return modularShortsDisplayName(assetId)
  return null
}

function sortLabel(asset: AvatarAsset, category: AvatarAssetCategory): string {
  return modularGarmentDisplayName(asset.id, category) ?? asset.name
}

function compareGarmentLabels(
  a: AvatarAsset,
  b: AvatarAsset,
  category: AvatarAssetCategory,
): number {
  if (category === 'shoes') {
    return (a.name ?? a.id).localeCompare(b.name ?? b.id, 'fr', { sensitivity: 'base' })
  }
  return sortLabel(a, category).localeCompare(sortLabel(b, category), 'fr', {
    sensitivity: 'base',
  })
}

function garmentSortTier(
  assetId: string,
  category: 'jerseys' | 'shorts' | 'shoes',
  ownedItemIds: string[],
  priorityAssetId?: string | null,
): number {
  if (isModularGarmentFree(assetId)) return 0
  if (priorityAssetId && assetId === priorityAssetId) return 1
  if (isModularAssetUnlocked(assetId, category, ownedItemIds)) return 2
  return 3
}

/** Gratuits → dernier achat → autres possédés → verrouillés, puis A→Z. */
export function sortModularGarmentAssetsForStudio(
  assets: AvatarAsset[],
  category: 'jerseys' | 'shorts' | 'shoes',
  ownedItemIds: string[],
  priorityAssetId?: string | null,
): AvatarAsset[] {
  return [...assets].sort((a, b) => {
    const tierA = garmentSortTier(a.id, category, ownedItemIds, priorityAssetId)
    const tierB = garmentSortTier(b.id, category, ownedItemIds, priorityAssetId)
    if (tierA !== tierB) return tierA - tierB
    return compareGarmentLabels(a, b, category)
  })
}

/** Tri catalogue statique (gratuits puis A→Z). */
export function sortModularGarmentAssets(
  assets: AvatarAsset[],
  category: 'jerseys' | 'shorts' | 'shoes',
): AvatarAsset[] {
  return sortModularGarmentAssetsForStudio(assets, category, [], null)
}
