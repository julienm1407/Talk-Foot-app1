/** Économie boutique Talk Foot — possession packs et conversion jetons. */

import { cdm2026BundleItems } from './cdm2026Bundles'
import { TOKENS_PER_MEDAL } from './boutiqueMedalCosts'

export {
  TOKENS_PER_MEDAL,
  CDM_JERSEY_MEDALS,
  CDM_SHORT_MEDALS,
  CDM_BUNDLE_MEDALS,
  STANDARD_SHOES_MEDALS,
} from './boutiqueMedalCosts'

const PACK_ITEMS = cdm2026BundleItems.filter((i) => (i.bundleIncludes?.length ?? 0) > 0)

function isFreeShopItem(shopItemId: string): boolean {
  return (
    shopItemId.startsWith('kit-base-') ||
    shopItemId.startsWith('pants-base-') ||
    shopItemId === 'shoes-sneaker-white' ||
    shopItemId === 'shoes-studs'
  )
}

function grantedViaPack(shopItemId: string, hasId: (id: string) => boolean): boolean {
  for (const pack of PACK_ITEMS) {
    if (!pack.bundleIncludes?.includes(shopItemId)) continue
    if (hasId(pack.id)) return true
    if (pack.bundleIncludes.every((id) => hasId(id))) return true
  }
  return false
}

/** Article boutique possédé (direct, gratuit, pack acheté ou pièces du pack déjà débloquées). */
export function isBoutiqueShopItemOwned(shopItemId: string, ownedItemIds: string[]): boolean {
  if (ownedItemIds.includes(shopItemId)) return true
  if (isFreeShopItem(shopItemId)) return true
  return grantedViaPack(shopItemId, (id) => ownedItemIds.includes(id))
}

/** Possédé si le pack ou toutes ses pièces le sont (y compris via id pack seul). */
export function isCosmeticOwned(
  item: { id: string; bundleIncludes?: string[] },
  ownsItem: (id: string) => boolean,
): boolean {
  if (item.bundleIncludes?.length) {
    if (ownsItem(item.id) || grantedViaPack(item.id, ownsItem)) return true
    return item.bundleIncludes.every(
      (id) => ownsItem(id) || grantedViaPack(id, ownsItem),
    )
  }
  return ownsItem(item.id) || grantedViaPack(item.id, ownsItem)
}

export function cosmeticTokenPrice(medalCost: number): number {
  return Math.max(1, medalCost * TOKENS_PER_MEDAL)
}

/** Complète les pièces manquantes quand l’id pack est enregistré (anciens achats). */
export function repairPackOwnedItemIds(ownedItemIds: string[]): string[] {
  const next = [...ownedItemIds]
  let changed = false
  for (const pack of PACK_ITEMS) {
    if (!next.includes(pack.id)) continue
    for (const inc of pack.bundleIncludes ?? []) {
      if (!next.includes(inc)) {
        next.push(inc)
        changed = true
      }
    }
  }
  return changed ? next : ownedItemIds
}
