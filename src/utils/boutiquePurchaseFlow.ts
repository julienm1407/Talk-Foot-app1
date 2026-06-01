import type { AvatarItem } from '../types/profile'
import type { CatalogFilter } from './boutiqueCatalog'
import { isCosmeticOwned } from '../data/boutiqueEconomy'
import { shopItemToModularAssetId } from './boutiqueModularState'

export const RECENT_STUDIO_ASSET_KEY = 'talkfoot.recentStudioAsset'

export function catalogTabForShopItem(item: AvatarItem): CatalogFilter {
  if (item.slot === 'pants') return 'shorts'
  if (item.slot === 'shoes') return 'shoes'
  if (item.bundleIncludes?.length) return 'packs'
  return 'jerseys'
}

export function rememberRecentStudioAsset(modularAssetId: string) {
  try {
    sessionStorage.setItem(RECENT_STUDIO_ASSET_KEY, modularAssetId)
  } catch {
    /* quota / private mode */
  }
}

export function consumeRecentStudioAsset(): string | null {
  try {
    const id = sessionStorage.getItem(RECENT_STUDIO_ASSET_KEY)
    if (id) sessionStorage.removeItem(RECENT_STUDIO_ASSET_KEY)
    return id
  } catch {
    return null
  }
}

export function peekRecentStudioAsset(): string | null {
  try {
    return sessionStorage.getItem(RECENT_STUDIO_ASSET_KEY)
  } catch {
    return null
  }
}

export function modularAssetIdForPurchase(item: AvatarItem): string | null {
  return shopItemToModularAssetId(item)
}

export function studioSlotForModularAssetId(modularAssetId: string): 'jersey' | 'shorts' | 'shoes' | null {
  if (modularAssetId.startsWith('jerseys-')) return 'jersey'
  if (modularAssetId.startsWith('shorts-')) return 'shorts'
  if (modularAssetId.startsWith('shoes-')) return 'shoes'
  return null
}

export function grantIdsForShopItem(item: AvatarItem): string[] {
  return item.bundleIncludes?.length ? item.bundleIncludes : [item.id]
}

/** Après paiement : enregistre la possession et renvoie l’URL du studio profil. */
export function finishCosmeticPurchase(
  item: AvatarItem,
  addOwnedItem: (id: string) => void,
): string {
  grantIdsForShopItem(item).forEach((id) => addOwnedItem(id))
  const modularAssetId = modularAssetIdForPurchase(item)
  if (modularAssetId) rememberRecentStudioAsset(modularAssetId)
  return profileStudioHref(modularAssetId, item.id)
}

export function profileStudioHref(modularAssetId: string | null, purchasedItemId?: string): string {
  const params = new URLSearchParams()
  if (modularAssetId) {
    params.set('asset', modularAssetId)
    const slot = studioSlotForModularAssetId(modularAssetId)
    if (slot) params.set('slot', slot)
  }
  if (purchasedItemId) params.set('purchased', purchasedItemId)
  const q = params.toString()
  return q ? `/profile?${q}#avatar-modulaire` : '/profile#avatar-modulaire'
}

export type MedalPurchaseAttempt =
  | { status: 'ok' }
  | { status: 'insufficient' }
  | { status: 'already_owned' }
  | { status: 'partial_pack' }

export function validateMedalCosmeticPurchase(
  item: AvatarItem,
  ownsItem: (id: string) => boolean,
): MedalPurchaseAttempt {
  if (isCosmeticOwned(item, ownsItem)) return { status: 'already_owned' }
  const grantIds = grantIdsForShopItem(item)
  const alreadyOwned = grantIds.filter((id) => ownsItem(id))
  if (alreadyOwned.length > 0) return { status: 'partial_pack' }
  return { status: 'ok' }
}
