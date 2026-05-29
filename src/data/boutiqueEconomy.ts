/** Économie boutique Talk Foot — V1 (référence unique pour packs et cosmétiques). */

/** Taux de conversion affiché et utilisé pour les prix en jetons. */
export const TOKENS_PER_MEDAL = 300

export const CDM_JERSEY_MEDALS = 60
export const CDM_SHORT_MEDALS = 25
export const CDM_BUNDLE_MEDALS = 80
export const STANDARD_SHOES_MEDALS = 10

export function cosmeticTokenPrice(medalCost: number): number {
  return Math.max(1, medalCost * TOKENS_PER_MEDAL)
}

/** Possédé si tous les articles inclus d’un pack le sont. */
export function isCosmeticOwned(
  item: { id: string; bundleIncludes?: string[] },
  ownsItem: (id: string) => boolean,
): boolean {
  if (item.bundleIncludes?.length) {
    return item.bundleIncludes.every((id) => ownsItem(id))
  }
  return ownsItem(item.id)
}
