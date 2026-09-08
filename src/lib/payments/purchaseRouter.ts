import { startStripeCheckout } from '../stripe/checkout'
import { openExternalUrl } from '../../mobile/openExternalUrl'
import { usesStoreBilling } from '../../utils/nativePlatform'
import { isStripePublishableConfigured } from '../../config/stripe'
import { isPaidSubscriptionTier } from '../../config/stripeCatalog'
import { isRevenueCatConfigured } from '../../config/revenueCatCatalog'
import {
  isRevenueCatReady,
  purchaseMedalPackWithStore,
  purchaseSubscriptionWithStore,
} from './revenueCat'
import type { SubscriptionTierId } from '../../types/subscription'

export type TalkFootPurchaseKind = 'subscription' | 'medal_pack'

export type TalkFootPurchaseResult =
  | { ok: true; channel: 'stripe'; url: string }
  | {
      ok: true
      channel: 'store'
      kind: 'subscription'
      tier: SubscriptionTierId
    }
  | {
      ok: true
      channel: 'store'
      kind: 'medal_pack'
      packId: string
      medals: number
    }
  | { ok: false; error: string; cancelled?: boolean }

/**
 * Routeur unique : Stripe sur le web, RevenueCat (Play / App Store) en app native.
 */
export async function purchaseTalkFootProduct(opts: {
  kind: TalkFootPurchaseKind
  productId: string
  userId: string
  supabaseUserId?: string | null
  email?: string | null
}): Promise<TalkFootPurchaseResult> {
  if (!opts.userId) return { ok: false, error: 'not_authenticated' }

  if (usesStoreBilling()) {
    if (!isRevenueCatConfigured() || !isRevenueCatReady()) {
      return { ok: false, error: 'revenuecat_not_configured' }
    }
    if (opts.kind === 'subscription') {
      if (!isPaidSubscriptionTier(opts.productId as SubscriptionTierId)) {
        return { ok: false, error: 'unknown_product' }
      }
      const result = await purchaseSubscriptionWithStore(
        opts.productId as Exclude<SubscriptionTierId, 'freemium'>,
      )
      if (!result.ok) return result
      if (result.kind !== 'subscription') return { ok: false, error: 'unexpected_result' }
      return { ok: true, channel: 'store', kind: 'subscription', tier: result.tier }
    }
    const result = await purchaseMedalPackWithStore(opts.productId)
    if (!result.ok) return result
    if (result.kind !== 'medal_pack') return { ok: false, error: 'unexpected_result' }
    return {
      ok: true,
      channel: 'store',
      kind: 'medal_pack',
      packId: result.packId,
      medals: result.medals,
    }
  }

  if (!isStripePublishableConfigured()) {
    return { ok: false, error: 'stripe_not_configured' }
  }

  const stripe = await startStripeCheckout({
    kind: opts.kind,
    productId: opts.productId,
    userId: opts.userId,
    supabaseUserId: opts.supabaseUserId,
    email: opts.email,
  })
  if (!stripe.ok) return { ok: false, error: stripe.error }
  return { ok: true, channel: 'stripe', url: stripe.url }
}

export async function openStripeCheckoutUrl(url: string): Promise<void> {
  await openExternalUrl(url)
}
