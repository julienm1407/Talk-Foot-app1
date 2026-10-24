import { Purchases, LOG_LEVEL, type PurchasesPackage } from '@revenuecat/purchases-capacitor'
import {
  medalsForPackId,
  revenueCatApiKeyForPlatform,
  revenueCatProductForMedalPack,
  revenueCatProductForSubscription,
  subscriptionTierFromEntitlements,
} from '../../config/revenueCatCatalog'
import { nativePlatform, usesStoreBilling } from '../../utils/nativePlatform'
import type { SubscriptionTierId } from '../../types/subscription'

let configured = false
let configurePromise: Promise<{ ok: true } | { ok: false; error: string }> | null = null

export function isRevenueCatReady(): boolean {
  return configured && usesStoreBilling()
}

async function resolveApiKey(platform: 'ios' | 'android'): Promise<string | null> {
  return revenueCatApiKeyForPlatform(platform)
}

/** À appeler une fois au boot natif (voir `initCapacitorShell`). */
export function configureRevenueCat(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!configurePromise) configurePromise = configureRevenueCatOnce()
  return configurePromise
}

async function configureRevenueCatOnce(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!usesStoreBilling()) return { ok: false, error: 'not_native' }
  if (configured) return { ok: true }

  const platform = nativePlatform()
  if (platform === 'web') return { ok: false, error: 'not_native' }

  const apiKey = await resolveApiKey(platform)
  if (!apiKey) {
    return { ok: false, error: 'revenuecat_key_missing' }
  }
  if (platform === 'android' && apiKey.startsWith('test_')) {
    return { ok: false, error: 'android_teststore_key' }
  }

  try {
    if (import.meta.env.DEV) {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG })
    }
    await Purchases.configure({ apiKey })
    configured = true
    return { ok: true }
  } catch (err) {
    configurePromise = null
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message || 'configure_failed' }
  }
}

async function ensureReady(): Promise<{ ok: true } | { ok: false; error: string }> {
  const cfg = await configureRevenueCat()
  if (!cfg.ok) return cfg
  if (!isRevenueCatReady()) return { ok: false, error: 'revenuecat_not_ready' }
  return { ok: true }
}

/** Lie le compte Talk Foot à RevenueCat (après login). */
export async function identifyRevenueCatUser(appUserId: string): Promise<void> {
  const cfg = await ensureReady()
  if (!cfg.ok || !appUserId.trim()) return
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
  const currentCount = offerings.current?.availablePackages?.length ?? 0
  const allCount = Object.values(offerings.all ?? {}).reduce(
    (n, o) => n + (o?.availablePackages?.length ?? 0),
    0,
  )
  if (currentCount === 0 && allCount === 0) {
    const empty = new Error('play_offering_empty')
    empty.name = 'play_offering_empty'
    throw empty
  }
  const current = offerings.current
  const pools: PurchasesPackage[] = []
  if (current?.availablePackages?.length) pools.push(...current.availablePackages)
  for (const offering of Object.values(offerings.all ?? {})) {
    if (offering?.availablePackages?.length) pools.push(...offering.availablePackages)
  }
  return (
    pools.find((p) => {
      const id = p.product.identifier
      return id === productId || id.startsWith(`${productId}:`)
    }) ?? null
  )
}

async function purchaseByProductId(productId: string): Promise<void> {
  const pkg = await findPackageByProductId(productId)
  if (pkg) {
    await Purchases.purchasePackage({ aPackage: pkg })
    return
  }
  const getProducts = (
    Purchases as unknown as {
      getProducts?: (opts: { productIdentifiers: string[] }) => Promise<{ products?: { identifier: string }[] }>
    }
  ).getProducts
  const purchaseStoreProduct = (
    Purchases as unknown as {
      purchaseStoreProduct?: (opts: { product: unknown }) => Promise<unknown>
    }
  ).purchaseStoreProduct
  if (getProducts && purchaseStoreProduct) {
    const { products } = await getProducts({
      productIdentifiers: [productId, `${productId}:monthly`],
    })
    const product =
      products?.find((p) => p.identifier === productId || p.identifier.startsWith(`${productId}:`)) ??
      products?.[0]
    if (product) {
      await purchaseStoreProduct({ product })
      return
    }
  }
  const err = new Error('product_not_in_offering')
  err.name = 'product_not_in_offering'
  throw err
}

function storeErrorMessage(err: unknown): string {
  if (err instanceof Error && (err.name === 'product_not_in_offering' || err.name === 'play_offering_empty')) {
    return err.name
  }
  if (typeof err === 'string' && err.trim()) return err.trim()
  if (err && typeof err === 'object') {
    const o = err as {
      message?: string
      code?: string | number
      underlyingErrorMessage?: string
      readableErrorCode?: string
    }
    const parts = [o.message, o.underlyingErrorMessage, o.readableErrorCode]
      .map((p) => (typeof p === 'string' ? p.trim() : ''))
      .filter(Boolean)
    if (o.code !== undefined && o.code !== '') parts.push(`code ${String(o.code)}`)
    if (parts.length) return parts.join(' — ')
  }
  return err instanceof Error ? err.message : 'purchase_failed'
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
  const ready = await ensureReady()
  if (!ready.ok) return { ok: false, error: ready.error }
  const productId = revenueCatProductForSubscription(tier)
  if (!productId) return { ok: false, error: 'unknown_product' }

  try {
    await purchaseByProductId(productId)
    const { customerInfo } = await Purchases.getCustomerInfo()
    const active = Object.keys(customerInfo.entitlements.active ?? {})
    const fromEntitlements = subscriptionTierFromEntitlements(active)
    return { ok: true, kind: 'subscription', tier: fromEntitlements ?? tier }
  } catch (err) {
    if (isUserCancelled(err)) return { ok: false, error: 'cancelled', cancelled: true }
    return { ok: false, error: storeErrorMessage(err) }
  }
}

export async function purchaseMedalPackWithStore(packId: string): Promise<StorePurchaseResult> {
  const ready = await ensureReady()
  if (!ready.ok) return { ok: false, error: ready.error }
  const productId = revenueCatProductForMedalPack(packId)
  const medals = medalsForPackId(packId)
  if (!productId || medals <= 0) return { ok: false, error: 'unknown_pack' }

  try {
    await purchaseByProductId(productId)
    return { ok: true, kind: 'medal_pack', packId, medals }
  } catch (err) {
    if (isUserCancelled(err)) return { ok: false, error: 'cancelled', cancelled: true }
    return { ok: false, error: storeErrorMessage(err) }
  }
}

export async function restoreStorePurchases(): Promise<
  { ok: true; tier: SubscriptionTierId | null } | { ok: false; error: string }
> {
  const ready = await ensureReady()
  if (!ready.ok) return { ok: false, error: ready.error }
  try {
    const { customerInfo } = await Purchases.restorePurchases()
    const active = Object.keys(customerInfo.entitlements.active ?? {})
    return { ok: true, tier: subscriptionTierFromEntitlements(active) }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message || 'restore_failed' }
  }
}
