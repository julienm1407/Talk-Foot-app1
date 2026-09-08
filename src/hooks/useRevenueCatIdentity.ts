import { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { identifyRevenueCatUser, logoutRevenueCatUser } from '../lib/payments/revenueCat'
import { usesStoreBilling } from '../utils/nativePlatform'

/** Lie / délie l’utilisateur Talk Foot à RevenueCat sur natif. */
export function useRevenueCatIdentity() {
  const { user, isReady } = useAuth()
  const lastId = useRef<string | null>(null)

  useEffect(() => {
    if (!usesStoreBilling() || !isReady) return
    const id = user?.id ?? null
    if (id === lastId.current) return
    lastId.current = id
    if (id) void identifyRevenueCatUser(id)
    else void logoutRevenueCatUser()
  }, [isReady, user?.id])
}
