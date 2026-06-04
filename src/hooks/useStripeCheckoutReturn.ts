import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useOptionalCloudUserState } from '../contexts/CloudUserStateContext'
import { fulfillStripeSession } from '../lib/stripe/checkout'
import { useTalkFootChatActorId } from './useTalkFootChatActorId'
import { useSubscription } from './useSubscription'
import type { SubscriptionTierId } from '../types/subscription'

function errorMessageFr(code: string | undefined): string {
  switch (code) {
    case 'supabase_service_not_configured':
      return 'Paiement reçu. Ajoute SUPABASE_SERVICE_ROLE_KEY sur Vercel (voir support), puis clique « Synchroniser mon achat ».'
    case 'profile_not_found':
      return 'Paiement reçu — profil introuvable. Connecte-toi avec le même compte, puis « Synchroniser mon achat ».'
    case 'session_user_mismatch':
      return 'Session de paiement non liée à ce compte. Ouvre la page avec le compte utilisé au paiement.'
    case 'unknown_pack':
      return 'Pack inconnu côté serveur — contacte le support avec la date d’achat.'
    default:
      return 'Paiement reçu — clique « Synchroniser mon achat » ou recharge dans 1 minute.'
  }
}

/**
 * Après retour Stripe (`?checkout=success&session_id=…`), crédite formule ou médailles.
 * Nécessite `SUPABASE_SERVICE_ROLE_KEY` côté Vercel pour persister le cloud.
 */
export function useStripeCheckoutReturn() {
  const [params, setParams] = useSearchParams()
  const { user } = useAuth()
  const supabaseActorId = useTalkFootChatActorId()
  const cloud = useOptionalCloudUserState()
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

    setStatus('done')
    setMessage(
      result.alreadyFulfilled
        ? 'Achat déjà crédité sur ton compte.'
        : `${result.medals.toLocaleString('fr-FR')} médailles créditées.`,
    )
    clearCheckoutParams()
    window.setTimeout(() => window.location.reload(), 1200)
  }, [sessionId, user?.id, supabaseActorId, setTier, clearCheckoutParams, cloud])

  useEffect(() => {
    if (autoRan.current) return
    if (!checkoutSuccess || !sessionId || !user?.id) return
    autoRan.current = true
    void runFulfill().catch(() => {
      setStatus('error')
      setMessage('Paiement reçu — utilise « Synchroniser mon achat » ci-dessous.')
    })
  }, [checkoutSuccess, sessionId, user?.id, runFulfill])

  const retryFulfill = useCallback(() => {
    void runFulfill().catch(() => {
      setStatus('error')
      setMessage('Synchronisation impossible — vérifie SUPABASE_SERVICE_ROLE_KEY sur Vercel.')
    })
  }, [runFulfill])

  return {
    status,
    message,
    sessionId: checkoutSuccess ? sessionId : '',
    canRetry: checkoutSuccess && Boolean(sessionId) && status === 'error',
    retryFulfill,
  }
}
