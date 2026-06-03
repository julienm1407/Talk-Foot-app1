import type { AvatarItem } from '../types/profile'
import type { CatalogFilter } from './boutiqueCatalog'
import { cosmeticTokenPrice, isBoutiqueShopItemOwned, isCosmeticOwned } from '../data/boutiqueEconomy'
import { cdm2026BundleItems } from '../data/cdm2026Bundles'
import { boutiqueItemToModularState, shopItemToModularAssetId } from './boutiqueModularState'

export const RECENT_STUDIO_ASSET_KEY = 'talkfoot.recentStudioAsset'
export const RECENT_STUDIO_PACK_KEY = 'talkfoot.recentStudioPackEquip'

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

/** Après achat d’un pack : équipe maillot + short au retour studio. */
export function rememberRecentStudioPack(item: AvatarItem) {
  if (!item.bundleIncludes?.length) return
  try {
    const modular = boutiqueItemToModularState(item)
    sessionStorage.setItem(
      RECENT_STUDIO_PACK_KEY,
      JSON.stringify({
        jersey: modular.data.jersey,
        shorts: modular.data.shorts,
      }),
    )
  } catch {
    /* quota / private mode */
  }
}

export function consumeRecentStudioPack(): { jersey: string | null; shorts: string | null } | null {
  try {
    const raw = sessionStorage.getItem(RECENT_STUDIO_PACK_KEY)
    if (!raw) return null
    sessionStorage.removeItem(RECENT_STUDIO_PACK_KEY)
    const parsed = JSON.parse(raw) as { jersey?: string | null; shorts?: string | null }
    return {
      jersey: parsed.jersey ?? null,
      shorts: parsed.shorts ?? null,
    }
  } catch {
    return null
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
  if (item.bundleIncludes?.length) {
    return Array.from(new Set([item.id, ...item.bundleIncludes]))
  }
  return [item.id]
}

export type CommitCosmeticPurchaseInput = {
  currency: 'medals' | 'tokens'
  medalCost: number
  tokenCost: number
  grantIds: string[]
}

export type CommitCosmeticPurchaseResult = {
  ok: boolean
  insufficientMedals?: boolean
  insufficientTokens?: boolean
}

export type CommitCosmeticPurchaseFn = (
  input: CommitCosmeticPurchaseInput,
) => CommitCosmeticPurchaseResult

export type CosmeticPayFns = {
  spendMedals: (amount: number) => { ok: boolean; insufficient?: boolean }
  spendTokens: (amount: number) => { ok: boolean }
  grantOwnedItems: (ids: string[]) => void
  /** Débit + inventaire atomiques (cloud) — prioritaire si fourni. */
  commitCosmeticPurchase?: CommitCosmeticPurchaseFn
}

export type PurchaseCosmeticResult =
  | { ok: true; href: string }
  | {
      ok: false
      code: 'already_owned' | 'partial_pack' | 'insufficient_medals' | 'insufficient_tokens' | 'payment_failed'
    }

/** Valide, débite médailles ou jetons, puis accorde l’article. */
export function purchaseCosmeticItem(
  item: AvatarItem,
  currency: 'medals' | 'tokens',
  pays: CosmeticPayFns,
  ownsItem: (id: string) => boolean,
  returnTo?: string,
): PurchaseCosmeticResult {
  const validation = validateMedalCosmeticPurchase(item, ownsItem)
  if (validation.status === 'already_owned') return { ok: false, code: 'already_owned' }
  if (validation.status === 'partial_pack') return { ok: false, code: 'partial_pack' }

  const grantIds = grantIdsForShopItem(item)
  const tokenCost = cosmeticTokenPrice(item.cost)

  if (pays.commitCosmeticPurchase) {
    const committed = pays.commitCosmeticPurchase({
      currency,
      medalCost: item.cost,
      tokenCost,
      grantIds,
    })
    if (!committed.ok) {
      if (committed.insufficientMedals) return { ok: false, code: 'insufficient_medals' }
      if (committed.insufficientTokens) return { ok: false, code: 'insufficient_tokens' }
      return { ok: false, code: 'payment_failed' }
    }
    return { ok: true, href: finishCosmeticPurchase(item, () => {}, currency, returnTo) }
  }

  if (currency === 'medals') {
    const paid = pays.spendMedals(item.cost)
    if (!paid.ok) {
      return { ok: false, code: paid.insufficient ? 'insufficient_medals' : 'payment_failed' }
    }
  } else {
    const paid = pays.spendTokens(tokenCost)
    if (!paid.ok) return { ok: false, code: 'insufficient_tokens' }
  }

  return { ok: true, href: finishCosmeticPurchase(item, pays.grantOwnedItems, currency, returnTo) }
}

/** Page de félicitations après achat (avant le studio profil). */
export function boutiquePurchaseSuccessHref(
  item: AvatarItem,
  currency: 'medals' | 'tokens',
  options?: { returnTo?: string },
): string {
  const params = new URLSearchParams({ item: item.id, currency })
  if (options?.returnTo) params.set('return', options.returnTo)
  return `/boutique/achat-reussi?${params.toString()}`
}

/** Après paiement : enregistre la possession et renvoie l’URL de confirmation. */
export function finishCosmeticPurchase(
  item: AvatarItem,
  grantOwnedItems: (ids: string[]) => void,
  currency: 'medals' | 'tokens',
  returnTo?: string,
): string {
  grantOwnedItems(grantIdsForShopItem(item))
  if (item.bundleIncludes?.length) {
    rememberRecentStudioPack(item)
  } else {
    const modularAssetId = modularAssetIdForPurchase(item)
    if (modularAssetId) rememberRecentStudioAsset(modularAssetId)
  }
  return boutiquePurchaseSuccessHref(item, currency, { returnTo })
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
  const owned: string[] = []
  const probeIds = [
    item.id,
    ...grantIds,
    ...cdm2026BundleItems.flatMap((p) => [p.id, ...(p.bundleIncludes ?? [])]),
  ]
  for (const id of probeIds) {
    if (ownsItem(id) && !owned.includes(id)) owned.push(id)
  }
  if (item.bundleIncludes?.length) {
    const alreadyOwned = grantIds.filter((id) => isBoutiqueShopItemOwned(id, owned))
    if (alreadyOwned.length > 0) return { status: 'partial_pack' }
  }
  return { status: 'ok' }
}
