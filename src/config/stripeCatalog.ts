import type { SubscriptionTierId } from '../types/subscription'

/** IDs Stripe Price (dashboard Talk Foot — live). */
export const STRIPE_PRICE = {
  subscription: {
    /** Talk Foot « Ultras » — 4,99 €/mois → formule `supporter_plus` */
    supporter_plus: 'price_1TebiTRZHpojSftNXPLKhRTB',
    /** Talk Foot « Ambassadeur » — 14,99 €/mois */
    ambassador: 'price_1TebkfRZHpojSftNt4I6Gwc4',
  },
  medalPack: {
    'medal-pack-199': 'price_1TebquRZHpojSftNTdL5qx8D',
    'medal-pack-499': 'price_1TebrLRZHpojSftNSARtG7E4',
    'medal-pack-999': 'price_1TebrvRZHpojSftNsfnCcoq8',
    'medal-pack-1999': 'price_1TebsoRZHpojSftNwvNudZNR',
    'medal-pack-4999': 'price_1TebtgRZHpojSftNZ8m48egh',
    'medal-pack-9999': 'price_1TebuTRZHpojSftNJrctto4J',
  },
} as const

export type StripeSubscriptionKey = keyof typeof STRIPE_PRICE.subscription
export type StripeMedalPackKey = keyof typeof STRIPE_PRICE.medalPack

export const STRIPE_SUBSCRIPTION_TIER: Record<StripeSubscriptionKey, SubscriptionTierId> = {
  supporter_plus: 'supporter_plus',
  ambassador: 'ambassador',
}

export function stripePriceForSubscription(tier: Exclude<SubscriptionTierId, 'freemium'>): string {
  return STRIPE_PRICE.subscription[tier]
}

export function stripePriceForMedalPack(packId: string): string | null {
  return STRIPE_PRICE.medalPack[packId as StripeMedalPackKey] ?? null
}

export function isPaidSubscriptionTier(tier: SubscriptionTierId): tier is StripeSubscriptionKey {
  return tier === 'supporter_plus' || tier === 'ambassador'
}
