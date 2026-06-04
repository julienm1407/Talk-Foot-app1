import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { useTalkFootChatActorId } from '../../hooks/useTalkFootChatActorId'
import { fulfillStripeSession } from '../../lib/stripe/checkout'
import { useSubscription } from '../../hooks/useSubscription'
import type { SubscriptionTierId } from '../../types/subscription'
import { cn } from '../../utils/cn'

function errorMessageFr(code: string | undefined): string {
  switch (code) {
    case 'supabase_service_not_configured':
      return 'Serveur pas encore prêt — redeploy Vercel après SUPABASE_SERVICE_ROLE_KEY, puis réessaie.'
    case 'profile_not_found':
      return 'Profil introuvable — connecte-toi avec le même compte qu’au paiement.'
    case 'session_user_mismatch':
      return 'Cette session Stripe appartient à un autre compte.'
    case 'unknown_pack':
      return 'Pack inconnu — contacte le support avec la date d’achat.'
    default:
      return 'Synchronisation impossible — vérifie l’ID de session (cs_live_…) et réessaie.'
  }
}

type SyncStatus = 'idle' | 'working' | 'done' | 'error'

type Props = {
  className?: string
  /** Après crédit médailles, recharge la page pour mettre à jour le solde. */
  reloadOnMedalCredit?: boolean
}

/**
 * Synchronisation manuelle d’un achat Stripe (médailles ou abonnement).
 * Visible même sans `?checkout=success` dans l’URL.
 */
export function StripePurchaseSyncPanel({ className, reloadOnMedalCredit = false }: Props) {
  const { user } = useAuth()
  const supabaseActorId = useTalkFootChatActorId()
  const { setTier } = useSubscription()
  const [params] = useSearchParams()
  const urlSessionId = params.get('session_id')?.trim() ?? ''

  const [sessionInput, setSessionInput] = useState(urlSessionId)
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (urlSessionId) setSessionInput(urlSessionId)
  }, [urlSessionId])

  const runSync = useCallback(async () => {
    const sessionId = sessionInput.trim()
    if (!sessionId) {
      setStatus('error')
      setMessage('Colle l’ID de session Stripe (commence par cs_live_ ou cs_test_).')
      return
    }
    if (!user?.id) {
      setStatus('error')
      setMessage('Connecte-toi pour synchroniser ton achat.')
      return
    }

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
      return
    }

    setStatus('done')
    setMessage(
      result.alreadyFulfilled
        ? 'Achat déjà crédité sur ton compte.'
        : `${result.medals.toLocaleString('fr-FR')} médailles créditées.`,
    )
    if (reloadOnMedalCredit && !result.alreadyFulfilled) {
      window.setTimeout(() => window.location.reload(), 1200)
    }
  }, [sessionInput, user?.id, supabaseActorId, setTier, reloadOnMedalCredit])

  return (
    <div
      className={cn(
        'rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-left',
        className,
      )}
    >
      <p className="text-xs font-bold text-amber-100/95">
        Tu as payé sur Stripe mais tes médailles n’apparaissent pas ?
      </p>
      <p className="mt-1 text-[11px] font-medium text-amber-100/75">
        Stripe → Paiements → ta transaction → copie l’<strong>ID de session</strong> (
        <code className="text-amber-50/90">cs_live_…</code>).
      </p>
      <label className="mt-3 block">
        <span className="sr-only">ID de session Stripe</span>
        <input
          type="text"
          value={sessionInput}
          onChange={(e) => setSessionInput(e.target.value)}
          placeholder="cs_live_…"
          className="w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      {message ? (
        <p
          className={cn(
            'mt-2 text-sm font-bold',
            status === 'done' ? 'text-emerald-200' : status === 'error' ? 'text-rose-200' : 'text-amber-200',
          )}
        >
          {message}
        </p>
      ) : null}
      <Button
        type="button"
        variant="soft"
        className="mt-3 text-xs"
        disabled={status === 'working'}
        onClick={() => void runSync()}
      >
        {status === 'working' ? 'Synchronisation…' : 'Synchroniser mon achat'}
      </Button>
    </div>
  )
}
