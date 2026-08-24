import { useCallback } from 'react'
import type { AvatarItem } from '../types/profile'
import { useOptionalCloudUserState } from '../contexts/CloudUserStateContext'
import { mergeOwnedItemsIntoProfile, useProfile } from './useProfile'
import { useWallet } from './useWallet'
import { normalizeWallet } from '../utils/walletNormalize'
import { writeOwnedItemsBackup } from '../utils/ownedItemsBackup'
import { useAuth } from '../contexts/AuthContext'
import {
  purchaseCosmeticItem,
  type CommitCosmeticPurchaseInput,
  type CommitCosmeticPurchaseResult,
  type PurchaseCosmeticResult,
} from '../utils/boutiquePurchaseFlow'

export type { CommitCosmeticPurchaseInput, CommitCosmeticPurchaseResult }

/**
 * Parcours d’achat boutique : débit médailles/jetons + inventaire en une seule
 * écriture cloud, puis sauvegarde immédiate (évite perte d’articles après F5).
 */
export function useBoutiquePurchase() {
  const cloud = useOptionalCloudUserState()
  const { user } = useAuth()
  const { wallet, spendMedals, spendTokens } = useWallet()
  const { ownsItem, addOwnedItems } = useProfile()

  const commitCosmeticPurchase = useCallback(
    (input: CommitCosmeticPurchaseInput): CommitCosmeticPurchaseResult => {
      if (cloud) {
        let result: CommitCosmeticPurchaseResult = { ok: false }
        let nextOwned: string[] = []
        cloud.patchApp((prev) => {
          const w = normalizeWallet(prev.wallet)
          if (input.currency === 'medals') {
            if (w.medals < input.medalCost) {
              result = { ok: false, insufficientMedals: true }
              return prev
            }
            result = { ok: true }
            const profile = mergeOwnedItemsIntoProfile(prev.profile, input.grantIds)
            nextOwned = profile.ownedItemIds
            return {
              ...prev,
              wallet: { ...w, medals: w.medals - input.medalCost },
              profile,
            }
          } else if (w.tokens < input.tokenCost) {
            result = { ok: false, insufficientTokens: true }
            return prev
          }
          result = { ok: true }
          const profile = mergeOwnedItemsIntoProfile(prev.profile, input.grantIds)
          nextOwned = profile.ownedItemIds
          return {
            ...prev,
            wallet: { ...w, tokens: w.tokens - input.tokenCost },
            profile,
          }
        })
        if (result.ok && user?.id && nextOwned.length) {
          writeOwnedItemsBackup(user.id, nextOwned)
        }
        return result
      }

      if (input.currency === 'medals') {
        const paid = spendMedals(input.medalCost)
        if (!paid.ok) {
          return { ok: false, insufficientMedals: paid.insufficient }
        }
      } else {
        const paid = spendTokens(input.tokenCost)
        if (!paid.ok) return { ok: false, insufficientTokens: true }
      }
      addOwnedItems(input.grantIds)
      return { ok: true }
    },
    [cloud, spendMedals, spendTokens, addOwnedItems, user?.id],
  )

  const purchaseCosmetic = useCallback(
    async (
      item: AvatarItem,
      currency: 'medals' | 'tokens',
      returnTo?: string,
    ): Promise<PurchaseCosmeticResult> => {
      if (cloud && !cloud.syncReady) {
        return { ok: false, code: 'payment_failed' }
      }
      const result = purchaseCosmeticItem(
        item,
        currency,
        {
          commitCosmeticPurchase,
          spendMedals,
          spendTokens,
          grantOwnedItems: addOwnedItems,
        },
        ownsItem,
        returnTo,
      )
      if (!result.ok) return result
      if (cloud) {
        cloud.cancelScheduledSave()
        void cloud.flushAppSave()
      }
      return result
    },
    [cloud, ownsItem, commitCosmeticPurchase, spendMedals, spendTokens, addOwnedItems],
  )

  return {
    wallet,
    ownsItem,
    purchaseCosmetic,
    commitCosmeticPurchase,
    spendMedals,
    spendTokens,
    addOwnedItems,
  }
}
