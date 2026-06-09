import { useCallback, useMemo } from 'react'
import { useSubscription } from './useSubscription'
import { bumpChatUsage, chatSendAllowed } from '../utils/subscriptionEntitlements'
import { useXpGrant } from './useXpGrant'

export function useChatSendGuard() {
  const { tier, subscription, patchUsage } = useSubscription()
  const { grantChatMessage } = useXpGrant()
  const usage = subscription.usage ?? {}

  const check = useCallback(() => chatSendAllowed(tier, usage), [tier, usage])

  const guardReason = useMemo(() => {
    const r = check()
    return r.ok ? null : r.reason ?? null
  }, [check])

  const recordSend = useCallback(() => {
    patchUsage((u) => bumpChatUsage(u ?? {}))
    grantChatMessage()
  }, [patchUsage, grantChatMessage])

  const trySend = useCallback(
    (send: () => void): boolean => {
      const r = check()
      if (!r.ok) return false
      recordSend()
      send()
      return true
    },
    [check, recordSend],
  )

  return { check, guardReason, recordSend, trySend }
}
