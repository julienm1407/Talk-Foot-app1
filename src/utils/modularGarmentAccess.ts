import type { AvatarAssetCategory } from '../features/avatar2d/types'
import { isBoutiqueShopItemOwned } from '../data/boutiqueEconomy'
import type { ModularAvatarState } from '../features/avatar2d/modularAvatarState'
import type { CatalogFilter } from './boutiqueCatalog'

export const DEFAULT_MODULAR_JERSEY = 'jerseys-jersey-base-blanc'
export const DEFAULT_MODULAR_SHORTS = 'shorts-short-base-blanc'
export const DEFAULT_MODULAR_SHOES = 'shoes-shoes-base'

const FREE_JERSEY_BASE = new Set([
  'jerseys-jersey-base-blanc',
  'jerseys-jersey-base-bleu',
  'jerseys-jersey-base-jaune',
  'jerseys-jersey-base-rouge',
])

const FREE_SHORTS_BASE = new Set([
  'shorts-short-base-blanc',
  'shorts-short-base-bleu',
  'shorts-short-base-jaune',
  'shorts-short-base-rouge',
])

const MODULAR_SHOE_TO_SHOP: Record<string, string> = {
  'shoes-shoes-base': 'shoes-sneaker-white',
  'shoes-shoes-bleu': 'shoes-sneaker-neon',
  'shoes-shoes-rouge': 'shoes-retro-gum',
  'shoes-shoes-jaune': 'shoes-sneaker-jaune',
  'shoes-shoes-vert': 'shoes-sneaker-vert',
}

/** Maillot / short / chaussures modulaires gratuits (couleurs de base + crampons blancs). */
export function isModularGarmentFree(modularAssetId: string): boolean {
  if (FREE_JERSEY_BASE.has(modularAssetId)) return true
  if (FREE_SHORTS_BASE.has(modularAssetId)) return true
  if (modularAssetId === DEFAULT_MODULAR_SHOES) return true
  return false
}

/** Article boutique lié à un asset modulaire (CDM ou standards). */
export function shopItemIdFromModularAsset(
  modularAssetId: string,
  category: Extract<AvatarAssetCategory, 'jerseys' | 'shorts' | 'shoes'>,
): string | null {
  if (category === 'jerseys') {
    const base = modularAssetId.match(/^jerseys-jersey-base-(.+)$/)
    if (base) return `kit-base-${base[1]}`
    const nation = modularAssetId.match(/^jerseys-jersey-([a-z]{3})$/)
    if (nation) return `cdm2026-${nation[1]}`
    return null
  }
  if (category === 'shorts') {
    const base = modularAssetId.match(/^shorts-short-base-(.+)$/)
    if (base) return `pants-base-${base[1]}`
    const nation = modularAssetId.match(/^shorts-short-([a-z]{3})$/)
    if (nation) return `cdm2026-short-${nation[1]}`
    return null
  }
  return MODULAR_SHOE_TO_SHOP[modularAssetId] ?? null
}

export function isModularGarmentSlot(category: AvatarAssetCategory): category is 'jerseys' | 'shorts' | 'shoes' {
  return category === 'jerseys' || category === 'shorts' || category === 'shoes'
}

export function isModularAssetUnlocked(
  modularAssetId: string,
  category: 'jerseys' | 'shorts' | 'shoes',
  ownedItemIds: string[],
): boolean {
  if (isModularGarmentFree(modularAssetId)) return true
  const shopId = shopItemIdFromModularAsset(modularAssetId, category)
  if (!shopId) return false
  return isBoutiqueShopItemOwned(shopId, ownedItemIds)
}

export function boutiqueTabForModularCategory(
  category: 'jerseys' | 'shorts' | 'shoes',
): CatalogFilter {
  if (category === 'jerseys') return 'jerseys'
  if (category === 'shorts') return 'shorts'
  return 'shoes'
}

export function sanitizeModularGarmentAccess(
  state: ModularAvatarState,
  ownedItemIds: string[],
): ModularAvatarState {
  const check = (
    id: string | null,
    category: 'jerseys' | 'shorts' | 'shoes',
    fallback: string,
  ): string | null => {
    if (!id) return null
    return isModularAssetUnlocked(id, category, ownedItemIds) ? id : fallback
  }

  const d = state.data
  return {
    ...state,
    data: {
      ...d,
      jersey: check(d.jersey, 'jerseys', DEFAULT_MODULAR_JERSEY),
      shorts: check(d.shorts, 'shorts', DEFAULT_MODULAR_SHORTS),
      shoes: check(d.shoes, 'shoes', DEFAULT_MODULAR_SHOES),
    },
  }
}
