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
import { nativePlatform, usesStoreBilling } from '../utils/nativePlatform'
import type { SubscriptionTierId } from '../types/subscription'

function errorMessageFr(code: string | undefined, cancelled?: boolean): string {
  if (cancelled || code === 'cancelled') return 'Achat annulé.'
  const ios = nativePlatform() === 'ios'
  const store = ios ? 'App Store' : 'Google Play'
  switch (code) {
    case 'not_authenticated':
      return 'Connecte-toi pour payer.'
    case 'stripe_not_configured':
      return 'Paiement Stripe non configuré sur cet environnement.'
    case 'revenuecat_not_configured':
    case 'revenuecat_not_ready':
    case 'revenuecat_key_missing':
      return ios
        ? 'Les achats App Store passent par RevenueCat. Ajoute la clé publique iOS appl_… (RevenueCat → API keys → Apple) sur Vercel : VITE_REVENUECAT_IOS_API_KEY, puis Redeploy.'
        : 'La fiche Google Play s’ouvre seulement avec RevenueCat. Ajoute la clé publique Android goog_… (RevenueCat → API keys) sur Vercel : VITE_REVENUECAT_ANDROID_API_KEY, puis Redeploy.'
    case 'android_teststore_key':
      return 'Clé Test Store (test_…) détectée. Sur Vercel il faut la clé Google Play goog_…'
    case 'play_offering_empty':
    case 'product_not_in_offering':
      return ios
        ? 'Produit App Store introuvable. Dans RevenueCat : produits Apple (pas Test Store) dans l’offering Current.'
        : 'Produit Play introuvable. Dans RevenueCat : produits Google Play (pas Test Store) dans l’offering Current, et JSON service account validé (plus de « could not check »).'
    case 'unknown_product':
    case 'unknown_pack':
      return 'Produit inconnu.'
    default: {
      const raw = (code ?? '').trim()
      if (/offering|product_not|couldn'?t find|not found|no products/i.test(raw)) {
        return ios
          ? 'Produit App Store introuvable. Dans RevenueCat, importe les IDs talkfoot_medals_… / talkfoot_ultra_monthly dans l’offering Current (store Apple).'
          : 'Produit Play introuvable. Dans RevenueCat, importe talkfoot_medals_20 (etc.) et mets-les dans l’offering Current.'
      }
      if (/\b23\b|configuration/i.test(raw)) {
        return ios
          ? 'Config App Store / RevenueCat : produits Apple dans l’offering Current, clé appl_… sur Vercel, app installée via TestFlight.'
          : 'Config Play / RevenueCat (code 23) : les produits doivent être Play Store dans l’offering Current, le JSON revenuecat-play validé, et l’app installée depuis le test interne Play (pas un APK USB).'
      }
      if (raw && raw !== 'purchase_failed') {
        return `Paiement ${store} : ${raw}`
      }
      return 'Impossible de finaliser le paiement. Réessaie dans un instant.'
    }
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
