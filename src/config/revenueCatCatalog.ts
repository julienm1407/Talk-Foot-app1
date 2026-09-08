import type { SubscriptionTierId } from '../types/subscription'
import { medalPacks } from '../data/shop'

/**
 * Identifiants produits RevenueCat / Play Console / App Store Connect.
 * Doivent être créés à l’identique dans le dashboard RevenueCat.
 *
 * Entitlements RC recommandés :
 * - `ultra`        → formule Talk Foot Ultra (`supporter_plus`)
 * - `ambassador`   → formule Ambassadeur
 * (les packs médailles = produits non-consommables / consommables one-shot)
 */
export const REVENUECAT_PRODUCT = {
  subscription: {
    supporter_plus: 'talkfoot_ultra_monthly',
    ambassador: 'talkfoot_ambassador_monthly',
  },
  medalPack: {
    'medal-pack-199': 'talkfoot_medals_20',
    'medal-pack-499': 'talkfoot_medals_60',
    'medal-pack-999': 'talkfoot_medals_130',
    'medal-pack-1999': 'talkfoot_medals_280',
    'medal-pack-4999': 'talkfoot_medals_750',
    'medal-pack-9999': 'talkfoot_medals_1700',
  },
} as const

export const REVENUECAT_ENTITLEMENT = {
  supporter_plus: 'ultra',
  ambassador: 'ambassador',
} as const

export type RevenueCatSubscriptionKey = keyof typeof REVENUECAT_PRODUCT.subscription
export type RevenueCatMedalPackKey = keyof typeof REVENUECAT_PRODUCT.medalPack

export function revenueCatProductForSubscription(
  tier: Exclude<SubscriptionTierId, 'freemium'>,
): string | null {
  if (tier !== 'supporter_plus' && tier !== 'ambassador') return null
  return REVENUECAT_PRODUCT.subscription[tier]
}

export function revenueCatProductForMedalPack(packId: string): string | null {
  return REVENUECAT_PRODUCT.medalPack[packId as RevenueCatMedalPackKey] ?? null
}

export function medalsForPackId(packId: string): number {
  return medalPacks.find((p) => p.id === packId)?.medals ?? 0
}

export function subscriptionTierFromEntitlements(
  activeEntitlementIds: string[],
): SubscriptionTierId | null {
  const set = new Set(activeEntitlementIds.map((e) => e.toLowerCase()))
  if (set.has(REVENUECAT_ENTITLEMENT.ambassador)) return 'ambassador'
  if (set.has(REVENUECAT_ENTITLEMENT.supporter_plus) || set.has('ultra')) return 'supporter_plus'
  return null
}

export function isRevenueCatConfigured(): boolean {
  const android = import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY?.trim()
  const ios = import.meta.env.VITE_REVENUECAT_IOS_API_KEY?.trim()
  const shared = import.meta.env.VITE_REVENUECAT_API_KEY?.trim()
  return Boolean(android || ios || shared)
}

export function revenueCatApiKeyForPlatform(platform: 'ios' | 'android'): string | null {
  if (platform === 'ios') {
    return (
      import.meta.env.VITE_REVENUECAT_IOS_API_KEY?.trim() ||
      import.meta.env.VITE_REVENUECAT_API_KEY?.trim() ||
      null
    )
  }
  return (
    import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY?.trim() ||
    import.meta.env.VITE_REVENUECAT_API_KEY?.trim() ||
    null
  )
}
