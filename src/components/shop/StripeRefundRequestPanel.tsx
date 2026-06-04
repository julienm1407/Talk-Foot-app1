import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LEGAL_CONTACT_EMAIL, legalContactMailto } from '../../constants/siteLegal'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

type Props = {
  className?: string
  /** Contexte affiché dans l’e-mail (pack médailles, abonnement, etc.). */
  purchaseKind?: 'medal_pack' | 'subscription'
}

export function StripeRefundRequestPanel({ className, purchaseKind = 'medal_pack' }: Props) {
  const { user } = useAuth()
  const [paymentRef, setPaymentRef] = useState('')
  const [reason, setReason] = useState('')

  const productLabel =
    purchaseKind === 'subscription' ? 'Abonnement Talk Foot (Stripe)' : 'Pack de médailles (Stripe)'

  const mailtoHref = useMemo(() => {
    const lines = [
      'Bonjour,',
      '',
      'Je demande un remboursement pour l’achat suivant sur Talk Foot :',
      '',
      `Type : ${productLabel}`,
      user?.email ? `E-mail du compte : ${user.email}` : 'E-mail du compte : (connecte-toi avant d’envoyer)',
      user?.id ? `ID compte : ${user.id}` : '',
      paymentRef.trim()
        ? `Référence Stripe : ${paymentRef.trim()}`
        : 'Référence Stripe : (colle cs_live_…, pi_… ou la date + montant du paiement)',
      '',
      'Motif de la demande :',
      reason.trim() || '(décris la situation)',
      '',
      'Merci.',
    ]
    return legalContactMailto('Demande de remboursement — Talk Foot', lines.join('\n'))
  }, [productLabel, user?.email, user?.id, paymentRef, reason])

  return (
    <div
      className={cn(
        'rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-left',
        className,
      )}
    >
      <p className="text-xs font-bold text-amber-100/95">Demande de remboursement</p>
      <p className="mt-1 text-[11px] font-medium leading-relaxed text-amber-100/75">
        Problème de paiement ou achat non reçu ? Envoie une demande à notre support. Les remboursements
        Stripe sont traités sous 5 à 10 jours ouvrés après validation.{' '}
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
        />
      </label>
      <a
        href={mailtoHref}
        className={cn(
          'mt-3 inline-flex min-h-9 items-center justify-center rounded-xl border border-amber-300/40 bg-amber-950/60 px-4 py-2 text-xs font-black text-amber-50 transition hover:bg-amber-900/70',
          TF_FOCUS_VISIBLE,
        )}
      >
        Envoyer la demande de remboursement
      </a>
      <p className="mt-2 text-[10px] font-medium text-amber-100/60">
        Ou écris à{' '}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="font-bold text-amber-100/90 underline-offset-2 hover:underline">
          {LEGAL_CONTACT_EMAIL}
        </a>
      </p>
    </div>
  )
}
