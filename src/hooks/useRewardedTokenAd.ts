import { useCallback, useState } from 'react'
import { REWARDED_AD_TOKEN_AMOUNT } from '../config/admob'
import { nativeAdsAvailable, showRewardedAd } from '../lib/ads/admobNative'
import { consumeRewardedAdSlot, rewardedAdsRemainingToday } from '../utils/rewardedAdQuota'
import { canUseWalletRewards } from '../utils/walletAuth'
import { useAuth } from '../contexts/AuthContext'
import { useWallet } from './useWallet'

export function useRewardedTokenAd() {
  const { user } = useAuth()
  const { addTokens } = useWallet()
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const remaining = rewardedAdsRemainingToday()
  const available = canUseWalletRewards(user) && remaining > 0

  const watch = useCallback(async () => {
    if (busy) return
    if (!canUseWalletRewards(user)) {
      setHint('Connecte-toi pour gagner des jetons.')
      return
    }
    if (rewardedAdsRemainingToday() <= 0) {
      setHint('Quota du jour atteint. Reviens demain.')
      return
    }
    if (!nativeAdsAvailable()) {
      setHint('Les pubs récompensées sont dans l’app Android (Play Store).')
      return
    }
    setBusy(true)
    setHint(null)
    try {
      const result = await showRewardedAd()
      if (!result.ok) {
        setHint(
          result.reason === 'skipped'
            ? 'Pub non terminée — aucun jeton crédité.'
            : 'Pub indisponible pour le moment.',
        )
        return
      }
      if (!consumeRewardedAdSlot()) {
        setHint('Quota du jour atteint.')
        return
      }
      addTokens(REWARDED_AD_TOKEN_AMOUNT)
      setHint(`+${REWARDED_AD_TOKEN_AMOUNT} jetons`)
    } finally {
      setBusy(false)
      window.setTimeout(() => setHint(null), 3200)
    }
  }, [addTokens, busy, user])

  return {
    watch,
    busy,
    hint,
    available,
    remaining,
    amount: REWARDED_AD_TOKEN_AMOUNT,
    native: nativeAdsAvailable(),
  }
}
