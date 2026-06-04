import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fulfillStripeSession } from '../lib/stripe/checkout'
import { useSubscription } from './useSubscription'
import type { SubscriptionTierId } from '../types/subscription'

/**
 * Après retour Stripe (`?checkout=success&session_id=…`), crédite formule ou médailles.
 * Nécessite `SUPABASE_SERVICE_ROLE_KEY` côté Vercel pour persister le cloud.
 */
export function useStripeCheckoutReturn() {
  const [params, setParams] = useSearchParams()
  const { user } = useAuth()
  const { setTier } = useSubscription()
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    if (params.get('checkout') !== 'success') return
    const sessionId = params.get('session_id')?.trim()
    if (!sessionId || !user?.id) return

    ran.current = true
    setStatus('working')

    void fulfillStripeSession({ sessionId, userId: user.id })
      .then((result) => {
        if (!result.ok) {
          setStatus('error')
          setMessage(
            result.error === 'supabase_service_not_configured'
              ? 'Paiement reçu — crédit en attente (configuration serveur).'
              : 'Paiement reçu — synchronisation en cours. Recharge la page dans un instant.',
          )
          return
        }

        if (result.kind === 'subscription') {
          setTier?.(result.tier as SubscriptionTierId)
          setStatus('done')
          setMessage('Abonnement activé. Merci !')
        } else {
          setStatus('done')
          setMessage(`${result.medals.toLocaleString('fr-FR')} médailles créditées.`)
          window.setTimeout(() => window.location.reload(), 1200)
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Paiement reçu — recharge la page pour voir ton solde.')
      })
      .finally(() => {
        const next = new URLSearchParams(params)
        next.delete('checkout')
        next.delete('session_id')
        setParams(next, { replace: true })
      })
  }, [params, setParams, user?.id, setTier])

  return { status, message }
}
