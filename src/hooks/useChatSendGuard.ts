import { useCallback, useMemo } from 'react'
import { useSubscription } from './useSubscription'
import { bumpChatUsage, chatSendAllowed } from '../utils/subscriptionEntitlements'

export function useChatSendGuard() {
  const { tier, subscription, patchUsage } = useSubscription()
  const usage = subscription.usage ?? {}

  const check = useCallback(() => chatSendAllowed(tier, usage), [tier, usage])

  const guardReason = useMemo(() => {
    const r = check()
    return r.ok ? null : r.reason ?? null
  }, [check])

  const recordSend = useCallback(() => {
    patchUsage((u) => bumpChatUsage(u ?? {}))
  }, [patchUsage])

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
