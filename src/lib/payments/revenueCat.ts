import { Purchases, LOG_LEVEL, type PurchasesPackage } from '@revenuecat/purchases-capacitor'
import {
  isRevenueCatConfigured,
  medalsForPackId,
  revenueCatApiKeyForPlatform,
  revenueCatProductForMedalPack,
  revenueCatProductForSubscription,
  subscriptionTierFromEntitlements,
} from '../../config/revenueCatCatalog'
import { nativePlatform, usesStoreBilling } from '../../utils/nativePlatform'
import type { SubscriptionTierId } from '../../types/subscription'

let configured = false

export function isRevenueCatReady(): boolean {
  return configured && usesStoreBilling() && isRevenueCatConfigured()
}

/** À appeler une fois au boot natif (voir `initCapacitorShell`). */
export async function configureRevenueCat(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!usesStoreBilling()) return { ok: false, error: 'not_native' }
  if (configured) return { ok: true }

  const platform = nativePlatform()
  if (platform === 'web') return { ok: false, error: 'not_native' }

  const apiKey = revenueCatApiKeyForPlatform(platform)
  if (!apiKey) {
    return { ok: false, error: 'revenuecat_key_missing' }
  }

  try {
    if (import.meta.env.DEV) {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG })
    }
    await Purchases.configure({ apiKey })
    configured = true
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message || 'configure_failed' }
  }
}

/** Lie le compte Talk Foot à RevenueCat (après login). */
export async function identifyRevenueCatUser(appUserId: string): Promise<void> {
  if (!isRevenueCatReady() || !appUserId.trim()) return
  try {
    await Purchases.logIn({ appUserID: appUserId.trim() })
  } catch {
    /* ignore — achats anonymes toujours possibles */
  }
}

export async function logoutRevenueCatUser(): Promise<void> {
  if (!isRevenueCatReady()) return
  try {
    await Purchases.logOut()
  } catch {
    /* ignore */
  }
}

async function findPackageByProductId(productId: string): Promise<PurchasesPackage | null> {
  const offerings = await Purchases.getOfferings()
  const current = offerings.current
  const pools: PurchasesPackage[] = []
  if (current?.availablePackages?.length) pools.push(...current.availablePackages)
  for (const offering of Object.values(offerings.all ?? {})) {
    if (offering?.availablePackages?.length) pools.push(...offering.availablePackages)
  }
  return pools.find((p) => p.product.identifier === productId) ?? null
}

function isUserCancelled(err: unknown): boolean {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code?: unknown }).code)
      : ''
  const msg = err instanceof Error ? err.message : String(err ?? '')
  return (
    code === '1' ||
    code === 'PURCHASE_CANCELLED' ||
    /cancel/i.test(msg) ||
    /annul/i.test(msg)
  )
}

export type StorePurchaseResult =
  | { ok: true; kind: 'subscription'; tier: SubscriptionTierId }
  | { ok: true; kind: 'medal_pack'; packId: string; medals: number }
  | { ok: false; error: string; cancelled?: boolean }

export async function purchaseSubscriptionWithStore(
  tier: Exclude<SubscriptionTierId, 'freemium'>,
): Promise<StorePurchaseResult> {
  if (!isRevenueCatReady()) {
    return { ok: false, error: 'revenuecat_not_ready' }
  }
  const productId = revenueCatProductForSubscription(tier)
  if (!productId) return { ok: false, error: 'unknown_product' }

  try {
    const pkg = await findPackageByProductId(productId)
    if (!pkg) return { ok: false, error: 'product_not_in_offering' }

    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
    const active = Object.keys(customerInfo.entitlements.active ?? {})
    const fromEntitlements = subscriptionTierFromEntitlements(active)
    return { ok: true, kind: 'subscription', tier: fromEntitlements ?? tier }
  } catch (err) {
    if (isUserCancelled(err)) return { ok: false, error: 'cancelled', cancelled: true }
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message || 'purchase_failed' }
  }
}

export async function purchaseMedalPackWithStore(packId: string): Promise<StorePurchaseResult> {
  if (!isRevenueCatReady()) {
    return { ok: false, error: 'revenuecat_not_ready' }
  }
  const productId = revenueCatProductForMedalPack(packId)
  const medals = medalsForPackId(packId)
  if (!productId || medals <= 0) return { ok: false, error: 'unknown_pack' }

  try {
    const pkg = await findPackageByProductId(productId)
    if (!pkg) return { ok: false, error: 'product_not_in_offering' }

    await Purchases.purchasePackage({ aPackage: pkg })
    return { ok: true, kind: 'medal_pack', packId, medals }
  } catch (err) {
    if (isUserCancelled(err)) return { ok: false, error: 'cancelled', cancelled: true }
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message || 'purchase_failed' }
  }
}

export async function restoreStorePurchases(): Promise<{
  ok: true
  tier: SubscriptionTierId | null
} | { ok: false; error: string }> {
  if (!isRevenueCatReady()) return { ok: false, error: 'revenuecat_not_ready' }
  try {
    const { customerInfo } = await Purchases.restorePurchases()
    const active = Object.keys(customerInfo.entitlements.active ?? {})
    return { ok: true, tier: subscriptionTierFromEntitlements(active) }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message || 'restore_failed' }
  }
}
