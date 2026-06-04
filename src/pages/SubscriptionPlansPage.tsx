import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_TIER_ORDER } from '../data/subscriptionPlans'
import { useSubscription } from '../hooks/useSubscription'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { cn } from '../utils/cn'
import type { SubscriptionTierId } from '../types/subscription'
import { isStripePublishableConfigured, stripeModeLabel } from '../config/stripe'
import { isPaidSubscriptionTier } from '../config/stripeCatalog'
import { startStripeCheckout } from '../lib/stripe/checkout'
import { useStripeCheckoutReturn } from '../hooks/useStripeCheckoutReturn'
import { useTalkFootChatActorId } from '../hooks/useTalkFootChatActorId'
import { StripePurchaseSyncPanel } from '../components/shop/StripePurchaseSyncPanel'

export function SubscriptionPlansPage() {
  const { user } = useAuth()
  const supabaseActorId = useTalkFootChatActorId()
  const { tier, setTier } = useSubscription()
  const { status: checkoutStatus, message: checkoutMessage, canRetry, retryFulfill } =
    useStripeCheckoutReturn()
  const [payingTier, setPayingTier] = useState<SubscriptionTierId | null>(null)
  const [payError, setPayError] = useState<string | null>(null)

  async function handleSubscribe(tierId: SubscriptionTierId) {
    if (!isPaidSubscriptionTier(tierId)) return
    if (!user?.id) {
      setPayError('Connecte-toi pour t’abonner.')
      return
    }
    setPayError(null)
    setPayingTier(tierId)
    const result = await startStripeCheckout({
      kind: 'subscription',
      productId: tierId,
      userId: user.id,
      supabaseUserId: supabaseActorId,
      email: user.email,
    })
    setPayingTier(null)
    if (!result.ok) {
      setPayError(
        result.error === 'stripe_not_configured'
          ? 'Paiement Stripe non configuré sur cet environnement.'
          : 'Impossible d’ouvrir le paiement. Réessaie dans un instant.',
      )
      return
    }
    window.location.assign(result.url)
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-10">
      <header className="space-y-2 text-center sm:text-left">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-300/90">
          Formules Talk Foot
        </p>
        <h1 className="text-2xl font-black text-white sm:text-3xl">Freemium · Ultras · Ambassadeur</h1>
        <p className="max-w-2xl text-sm text-white/70">
          Trois niveaux d’accès : gratuit pour découvrir, 4,99 €/mois (Ultras) pour les supporters actifs,
          14,99 €/mois pour les créateurs (stream, voix, articles). Paiement sécurisé par Stripe.
          {isStripePublishableConfigured() ? (
            <> Mode {stripeModeLabel() === 'live' ? 'production' : 'test'} actif.</>
          ) : (
            <> Ajoute <code className="text-white/90">VITE_STRIPE_PUBLISHABLE_KEY</code> sur Vercel pour activer le paiement.</>
          )}
        </p>
        {checkoutMessage ? (
          <div className="space-y-2">
            <p
              className={cn(
                'text-sm font-semibold',
                checkoutStatus === 'done' ? 'text-emerald-200/95' : 'text-amber-200/90',
              )}
            >
              {checkoutMessage}
            </p>
            {canRetry ? (
              <Button type="button" variant="soft" className="text-xs" onClick={retryFulfill}>
                Synchroniser mon achat
              </Button>
            ) : null}
          </div>
        ) : null}
        <StripePurchaseSyncPanel className="mt-4 max-w-xl" />
        {payError ? <p className="text-sm font-semibold text-rose-200/95">{payError}</p> : null}
        {user && (
          <p className="text-sm font-semibold text-emerald-200/90">
            Ta formule actuelle : <span className="text-white">{SUBSCRIPTION_PLANS[tier].name}</span>
          </p>
        )}
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        {SUBSCRIPTION_TIER_ORDER.map((id) => {
          const plan = SUBSCRIPTION_PLANS[id]
          const isCurrent = tier === id
          return (
            <Card
              key={id}
              className={cn(
                'relative overflow-hidden border-2 p-0',
                isCurrent ? 'border-emerald-400/60 ring-2 ring-emerald-400/25' : 'border-white/12',
              )}
            >
              <div
                className={cn(
                  'bg-gradient-to-br px-5 py-6 text-white',
                  plan.accentClass,
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-xl font-black">{plan.name}</h2>
                  {isCurrent && (
                    <Badge className="border-white/30 bg-white/20 text-white">Actif</Badge>
                  )}
                </div>
                <p className="mt-1 text-2xl font-black">{plan.priceLabel}</p>
                <p className="mt-2 text-sm text-white/85">{plan.tagline}</p>
              </div>
              <ul className="space-y-2.5 px-5 py-5">
                {plan.features.map((f) => (
                  <li
                    key={f.id}
                    className={cn(
                      'flex gap-2 text-sm',
                      f.included ? 'text-white/90' : 'text-white/40 line-through decoration-white/30',
                    )}
                  >
                    <span aria-hidden className="shrink-0">
                      {f.included ? '✓' : '×'}
                    </span>
                    <span>
                      {f.label}
                      {f.comingSoon && f.included && (
                        <span className="ml-1 text-[10px] font-bold uppercase text-amber-300/90">
                          (bientôt)
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-white/10 px-5 py-4">
                {setTier && id !== tier ? (
                  <Button
                    type="button"
                    variant="soft"
                    className="w-full text-xs"
                    onClick={() => setTier(id as SubscriptionTierId)}
                  >
                    Tester {plan.name} (admin)
                  </Button>
                ) : id === 'freemium' ? (
                  <p className="text-center text-xs text-white/50">Inclus à l’inscription</p>
                ) : isStripePublishableConfigured() ? (
                  <Button
                    type="button"
                    className="w-full"
                    disabled={payingTier === id}
                    onClick={() => void handleSubscribe(id)}
                  >
                    {payingTier === id ? 'Redirection Stripe…' : `S’abonner — ${plan.priceLabel}`}
                  </Button>
                ) : user ? (
                  <Button type="button" className="w-full" disabled>
                    Stripe non configuré
                  </Button>
                ) : (
                  <Link
                    to="/login?next=/formules"
                    className="block w-full rounded-xl bg-gradient-to-b from-sky-500 to-blue-600 py-2.5 text-center text-xs font-black text-white"
                  >
                    Se connecter pour s’abonner
                  </Link>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="space-y-3 border-white/10 bg-white/[0.04] p-5 text-sm text-white/75">
        <h3 className="font-black text-white">Rappels produit</h3>
        <ul className="list-inside list-disc space-y-1.5">
          <li>
            <strong className="text-white">Boutique :</strong> les 3 formules voient et peuvent acheter tous
            les articles (maillots, shorts, chaussures, packs). Supporter+ et Ambassadeur reçoivent plus de
            jetons (mensuels, paris ×2) pour constituer leur collection plus vite — pas d’articles réservés aux
            payants.
          </li>
          <li>
            Freemium : pas de débats ; cooldown tchat 15 s ; 100 messages/jour ; rival club → accès
            tribune rivale sur demande / kick modos.
          </li>
          <li>Supporter+ : pas de stream ni salon privé ; emotes groupe non personnalisables.</li>
          <li>
            Ambassadeur : stream tribune, micro vocal, salon privé par lien, rédaction d’articles.
            Rémunération créateur — à venir.
          </li>
        </ul>
        <Link to="/profile" className="inline-block text-sm font-semibold text-sky-300 hover:underline">
          ← Retour au profil
        </Link>
      </Card>
    </div>
  )
}
