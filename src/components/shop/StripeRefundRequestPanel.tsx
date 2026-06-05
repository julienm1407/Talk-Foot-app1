import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LEGAL_CONTACT_EMAIL } from '../../constants/siteLegal'
import { submitRefundRequest } from '../../lib/stripe/refundRequest'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

type Props = {
  className?: string
  /** Contexte affiché dans la demande (pack médailles, abonnement, etc.). */
  purchaseKind?: 'medal_pack' | 'subscription'
}

export function StripeRefundRequestPanel({ className, purchaseKind = 'medal_pack' }: Props) {
  const { user } = useAuth()
  const [paymentRef, setPaymentRef] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)

  async function handleSubmit() {
    const trimmedReason = reason.trim()
    if (trimmedReason.length < 8) {
      setFeedback({
        tone: 'err',
        text: 'Décris ton problème en quelques mots (8 caractères minimum).',
      })
      return
    }

    setSubmitting(true)
    setFeedback(null)

    const result = await submitRefundRequest({
      purchaseKind,
      reason: trimmedReason,
      paymentRef: paymentRef.trim() || undefined,
      userEmail: user?.email ?? undefined,
      userId: user?.id ?? undefined,
    })

    setSubmitting(false)

    if (!result.ok) {
      const message =
        result.error === 'service_not_configured'
          ? 'Service indisponible pour le moment — écris-nous directement par e-mail.'
          : result.error === 'reason_too_short'
            ? 'Le motif est trop court.'
            : result.error === 'save_failed'
              ? 'Enregistrement impossible — la base n’est peut‑être pas à jour. Écris à support@talkfoot.app en attendant.'
              : 'Envoi impossible — réessaie ou contacte le support par e-mail.'
      setFeedback({ tone: 'err', text: message })
      return
    }

    setPaymentRef('')
    setReason('')
    setFeedback({
      tone: 'ok',
      text: result.emailSent
        ? 'Demande envoyée à notre équipe. Réponse sous 5 à 10 jours ouvrés.'
        : 'Demande enregistrée. Notre équipe la traitera sous 5 à 10 jours ouvrés.',
    })
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-left',
        className,
      )}
    >
      <p className="text-xs font-bold text-amber-100/95">Demande de remboursement</p>
      <p className="mt-1 text-[11px] font-medium leading-relaxed text-amber-100/75">
        Problème de paiement ou achat non reçu ? Envoie une demande à notre support. Après remboursement
        validé sur Stripe, les médailles liées à l’achat sont retirées automatiquement de ton compte
        (sous 5 à 10 jours ouvrés).{' '}
        <Link to="/terms" className={cn('font-bold text-amber-50 underline-offset-2 hover:underline', TF_FOCUS_VISIBLE)}>
          Conditions
        </Link>
        .
      </p>
      <label className="mt-3 block">
        <span className="text-[10px] font-black uppercase tracking-wider text-amber-200/80">
          Référence paiement Stripe (optionnel)
        </span>
        <input
          type="text"
          value={paymentRef}
          onChange={(e) => setPaymentRef(e.target.value)}
          placeholder="cs_live_…, pi_… ou pm_…"
          className="mt-1 w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
          autoComplete="off"
          spellCheck={false}
          disabled={submitting}
        />
      </label>
      <label className="mt-2 block">
        <span className="text-[10px] font-black uppercase tracking-wider text-amber-200/80">Motif</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex. médailles non créditées après paiement 1,99 €"
          rows={2}
          className="mt-1 w-full resize-y rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
          disabled={submitting}
        />
      </label>
      {feedback ? (
        <p
          className={cn(
            'mt-3 rounded-xl px-3 py-2 text-xs font-semibold',
            feedback.tone === 'ok'
              ? 'border border-emerald-400/35 bg-emerald-950/50 text-emerald-100'
              : 'border border-rose-400/35 bg-rose-950/40 text-rose-100',
          )}
        >
          {feedback.text}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={submitting}
        className={cn(
          'mt-3 inline-flex min-h-9 items-center justify-center rounded-xl border border-amber-300/40 bg-amber-950/60 px-4 py-2 text-xs font-black text-amber-50 transition hover:bg-amber-900/70 disabled:cursor-wait disabled:opacity-70',
          TF_FOCUS_VISIBLE,
        )}
      >
        {submitting ? 'Envoi en cours…' : 'Envoyer la demande de remboursement'}
      </button>
      <p className="mt-2 text-[10px] font-medium text-amber-100/60">
        Ou écris à{' '}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="font-bold text-amber-100/90 underline-offset-2 hover:underline">
          {LEGAL_CONTACT_EMAIL}
        </a>
      </p>
    </div>
  )
}
