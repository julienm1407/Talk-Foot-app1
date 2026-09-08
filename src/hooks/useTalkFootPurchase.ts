import { useCallback, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTalkFootChatActorId } from './useTalkFootChatActorId'
import { useSubscription } from './useSubscription'
import { useWallet } from './useWallet'
import { useOptionalCloudUserState } from '../contexts/CloudUserStateContext'
import {
  openStripeCheckoutUrl,
  purchaseTalkFootProduct,
  type TalkFootPurchaseResult,
} from '../lib/payments/purchaseRouter'
import { usesStoreBilling } from '../utils/nativePlatform'
import type { SubscriptionTierId } from '../types/subscription'

function errorMessageFr(code: string | undefined, cancelled?: boolean): string {
  if (cancelled || code === 'cancelled') return 'Achat annulé.'
  switch (code) {
    case 'not_authenticated':
      return 'Connecte-toi pour payer.'
    case 'stripe_not_configured':
      return 'Paiement Stripe non configuré sur cet environnement.'
    case 'revenuecat_not_configured':
    case 'revenuecat_not_ready':
      return 'Paiements store non configurés (clés RevenueCat manquantes au build).'
    case 'product_not_in_offering':
      return 'Produit introuvable dans l’offre store. Vérifie RevenueCat / Play Console.'
    case 'unknown_product':
    case 'unknown_pack':
      return 'Produit inconnu.'
    default:
      return 'Impossible de finaliser le paiement. Réessaie dans un instant.'
  }
}

/**
 * Hook unique abonnements + packs médailles :
 * - Web → Stripe Checkout
 * - Android / iOS → RevenueCat (Play Billing / StoreKit)
 */
export function useTalkFootPurchase() {
  const { user } = useAuth()
  const supabaseActorId = useTalkFootChatActorId()
  const cloud = useOptionalCloudUserState()
  const { addMedals } = useWallet()
  const { grantPurchasedTier } = useSubscription()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applyStoreResult = useCallback(
    async (result: Extract<TalkFootPurchaseResult, { ok: true; channel: 'store' }>) => {
      if (result.kind === 'subscription') {
        grantPurchasedTier(result.tier)
        void cloud?.flushAppSave?.()
        return
      }
      addMedals(result.medals)
      void cloud?.flushAppSave?.()
    },
    [addMedals, cloud, grantPurchasedTier],
  )

  const purchaseSubscription = useCallback(
    async (tierId: SubscriptionTierId) => {
      if (!user?.id) {
        setError('Connecte-toi pour t’abonner.')
        return { ok: false as const }
      }
      setError(null)
      setBusy(true)
      try {
        const result = await purchaseTalkFootProduct({
          kind: 'subscription',
          productId: tierId,
          userId: user.id,
          supabaseUserId: supabaseActorId,
          email: user.email,
        })
        if (!result.ok) {
          if (!result.cancelled) setError(errorMessageFr(result.error, result.cancelled))
          return { ok: false as const, cancelled: result.cancelled }
        }
        if (result.channel === 'stripe') {
          await openStripeCheckoutUrl(result.url)
          return { ok: true as const, channel: 'stripe' as const }
        }
        await applyStoreResult(result)
        if (result.kind === 'subscription') {
          return { ok: true as const, channel: 'store' as const, tier: result.tier }
        }
        return { ok: false as const }
      } finally {
        setBusy(false)
      }
    },
    [applyStoreResult, supabaseActorId, user?.email, user?.id],
  )

  const purchaseMedalPack = useCallback(
    async (packId: string) => {
      if (!user?.id) {
        setError('Connecte-toi pour acheter des médailles.')
        return { ok: false as const }
      }
      setError(null)
      setBusy(true)
      try {
        const result = await purchaseTalkFootProduct({
          kind: 'medal_pack',
          productId: packId,
          userId: user.id,
          supabaseUserId: supabaseActorId,
          email: user.email,
        })
        if (!result.ok) {
          if (!result.cancelled) setError(errorMessageFr(result.error, result.cancelled))
          return { ok: false as const, cancelled: result.cancelled }
        }
        if (result.channel === 'stripe') {
          await openStripeCheckoutUrl(result.url)
          return { ok: true as const, channel: 'stripe' as const }
        }
        await applyStoreResult(result)
        if (result.kind === 'medal_pack') {
          return {
            ok: true as const,
            channel: 'store' as const,
            medals: result.medals,
            packId: result.packId,
          }
        }
        return { ok: false as const }
      } finally {
        setBusy(false)
      }
    },
    [applyStoreResult, supabaseActorId, user?.email, user?.id],
  )

  return {
    busy,
    error,
    clearError: () => setError(null),
    usesStoreBilling: usesStoreBilling(),
    purchaseSubscription,
    purchaseMedalPack,
  }
}
