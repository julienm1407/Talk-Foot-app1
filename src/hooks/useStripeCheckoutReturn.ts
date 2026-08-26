import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useOptionalCloudUserState } from '../contexts/CloudUserStateContext'
import { fulfillStripeSession } from '../lib/stripe/checkout'
import { useTalkFootChatActorId } from './useTalkFootChatActorId'
import { useSubscription } from './useSubscription'
import { useWallet } from './useWallet'
import type { SubscriptionTierId } from '../types/subscription'

const CREDITED_SESSIONS_LS_KEY = 'tf-stripe-credited-sessions-v1'

function readCreditedSessions(): Set<string> {
  try {
    const raw = localStorage.getItem(CREDITED_SESSIONS_LS_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((x): x is string => typeof x === 'string' && x.length > 0))
  } catch {
    return new Set()
  }
}

function markSessionCredited(sessionId: string) {
  const set = readCreditedSessions()
  set.add(sessionId)
  localStorage.setItem(CREDITED_SESSIONS_LS_KEY, JSON.stringify([...set].slice(-80)))
}

function errorMessageFr(code: string | undefined): string {
  switch (code) {
    case 'supabase_service_not_configured':
      return 'Paiement reçu — crédit en attente côté serveur. Utilise la demande de remboursement ou contacte le support.'
    case 'profile_not_found':
      return 'Paiement reçu — profil introuvable. Connecte-toi avec le même compte ou contacte le support.'
    case 'session_user_mismatch':
      return 'Session de paiement non liée à ce compte. Ouvre la page avec le compte utilisé au paiement.'
    case 'unknown_pack':
      return 'Pack inconnu côté serveur — contacte le support avec la date d’achat.'
    case 'not_paid':
      return 'Paiement pas encore confirmé par Stripe — réessaie dans une minute.'
    default:
      return code
        ? `Paiement reçu — sync en cours (${code}). Réessaie le crédit.`
        : 'Paiement reçu — recharge la page dans 1 minute ou contacte le support.'
  }
}

/**
 * Après retour Stripe (`?checkout=success&session_id=…`), crédite formule ou médailles.
 * Si le cloud refuse l’écriture, applique un crédit client sécurisé (session payée vérifiée).
 */
export function useStripeCheckoutReturn() {
  const [params, setParams] = useSearchParams()
  const { user } = useAuth()
  const supabaseActorId = useTalkFootChatActorId()
  const cloud = useOptionalCloudUserState()
  const { addMedals } = useWallet()
  const { setTier } = useSubscription()
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const autoRan = useRef(false)

  const sessionId = params.get('session_id')?.trim() ?? ''
  const checkoutSuccess = params.get('checkout') === 'success'

  const clearCheckoutParams = useCallback(() => {
    const next = new URLSearchParams(params)
    next.delete('checkout')
    next.delete('session_id')
    setParams(next, { replace: true })
  }, [params, setParams])

  const runFulfill = useCallback(async () => {
    if (!sessionId || !user?.id) return
    setStatus('working')
    setMessage(null)

    const result = await fulfillStripeSession({
      sessionId,
      userId: user.id,
      supabaseUserId: supabaseActorId ?? undefined,
    })

    if (!result.ok) {
      setStatus('error')
      setMessage(errorMessageFr(result.error))
      return
    }

    if (result.kind === 'subscription') {
      setTier?.(result.tier as SubscriptionTierId)
      setStatus('done')
      setMessage(
        result.alreadyFulfilled
          ? 'Abonnement déjà actif sur ton compte.'
          : 'Abonnement activé. Merci !',
      )
      clearCheckoutParams()
      void cloud?.flushAppSave?.()
      return
    }

    // Médailles
    const alreadyLocal = readCreditedSessions().has(sessionId)
    if (result.appliedVia === 'client' && !result.alreadyFulfilled && !alreadyLocal) {
      addMedals(result.medals)
      markSessionCredited(sessionId)
      setStatus('done')
      setMessage(`${result.medals.toLocaleString('fr-FR')} médailles créditées.`)
      clearCheckoutParams()
      window.setTimeout(() => window.location.reload(), 1200)
      return
    }

    if (result.appliedVia === 'client' && alreadyLocal) {
      setStatus('done')
      setMessage('Achat déjà crédité sur ton compte.')
      clearCheckoutParams()
      return
    }

    if (!alreadyLocal && !result.alreadyFulfilled && result.appliedVia === 'server') {
      markSessionCredited(sessionId)
    }

    setStatus('done')
    setMessage(
      result.alreadyFulfilled || alreadyLocal
        ? 'Achat déjà crédité sur ton compte.'
        : `${result.medals.toLocaleString('fr-FR')} médailles créditées.`,
    )
    clearCheckoutParams()
    window.setTimeout(() => window.location.reload(), 1200)
  }, [sessionId, user?.id, supabaseActorId, setTier, clearCheckoutParams, cloud, addMedals])

  useEffect(() => {
    if (autoRan.current) return
    if (!checkoutSuccess || !sessionId || !user?.id) return
    autoRan.current = true
    void runFulfill().catch((err) => {
      setStatus('error')
      setMessage(
        `Paiement reçu — réessaie (${err instanceof Error ? err.message : 'erreur'}).`,
      )
    })
  }, [checkoutSuccess, sessionId, user?.id, runFulfill])

  const retryFulfill = useCallback(() => {
    void runFulfill().catch((err) => {
      setStatus('error')
      setMessage(
        `Synchronisation impossible (${err instanceof Error ? err.message : 'erreur'}).`,
      )
    })
  }, [runFulfill])

  return {
    status,
    message,
    sessionId: checkoutSuccess ? sessionId : '',
    canRetry:
      checkoutSuccess &&
      Boolean(sessionId) &&
      (status === 'error' || status === 'idle'),
    retryFulfill,
  }
}
