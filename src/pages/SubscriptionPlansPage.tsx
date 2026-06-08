import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_TIER_ORDER } from '../data/subscriptionPlans'
import { useSubscription } from '../hooks/useSubscription'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { useAppearance } from '../contexts/AppearanceContext'
import { TF_TEXT_FG, TF_TEXT_MUTED } from '../theme/appearanceClasses'
import { cn } from '../utils/cn'
import type { SubscriptionTierId } from '../types/subscription'
import { isStripePublishableConfigured, stripeModeLabel } from '../config/stripe'
import { isPaidSubscriptionTier } from '../config/stripeCatalog'
import { startStripeCheckout } from '../lib/stripe/checkout'
import { useStripeCheckoutReturn } from '../hooks/useStripeCheckoutReturn'
import { useTalkFootChatActorId } from '../hooks/useTalkFootChatActorId'
import { StripeRefundRequestPanel } from '../components/shop/StripeRefundRequestPanel'

export function SubscriptionPlansPage() {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
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
        <p
          className={cn(
            'text-[11px] font-black uppercase tracking-[0.2em]',
            L ? 'text-violet-700' : 'text-violet-300/90',
          )}
        >
          Formules Talk Foot
        </p>
        <h1 className={cn('text-2xl font-black sm:text-3xl', TF_TEXT_FG)}>
          Supporter · Ultra · Ambassadeur
        </h1>
        <p className={cn('max-w-2xl text-sm', TF_TEXT_MUTED)}>
          Trois niveaux : Supporter (gratuit) pour rejoindre la communauté, Ultra à 4,99 €/mois pour les
          membres actifs, Ambassadeur à 14,99 €/mois pour les créateurs. Paiement sécurisé par Stripe.
          {isStripePublishableConfigured() ? (
            <> Mode {stripeModeLabel() === 'live' ? 'production' : 'test'} actif.</>
          ) : (
            <> Ajoute <code className={TF_TEXT_FG}>VITE_STRIPE_PUBLISHABLE_KEY</code> sur Vercel pour activer le paiement.</>
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
        <StripeRefundRequestPanel className="mt-4 max-w-xl" purchaseKind="subscription" />
        {payError ? (
          <p className={cn('text-sm font-semibold', L ? 'text-rose-700' : 'text-rose-200/95')}>
            {payError}
          </p>
        ) : null}
        {user && (
          <p className={cn('text-sm font-semibold', L ? 'text-emerald-800' : 'text-emerald-200/90')}>
            Ta formule actuelle :{' '}
            <span className={TF_TEXT_FG}>{SUBSCRIPTION_PLANS[tier].name}</span>
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
                  <div>
                    <p className="text-lg leading-none" aria-hidden>
                      {plan.tierEmoji}
                    </p>
                    <h2 className="mt-1 text-xl font-black uppercase tracking-wide">
                      {plan.name}
                      {plan.nameHint ? (
                        <span className="ml-1.5 text-base font-black normal-case text-white/80">
                          ({plan.nameHint})
                        </span>
                      ) : null}
                    </h2>
                  </div>
                  {isCurrent && (
                    <Badge className="border-white/30 bg-white/20 text-white">Actif</Badge>
                  )}
                </div>
                {plan.priceLabel ? (
                  <p className="mt-1 text-2xl font-black">{plan.priceLabel}</p>
                ) : null}
                <p className="mt-2 text-sm text-white/85">{plan.tagline}</p>
              </div>
              <ul className="space-y-2.5 px-5 py-5">
                {plan.features
                  .filter((f) => f.included)
                  .map((f) => (
                  <li key={f.id} className={cn('flex gap-2 text-sm font-medium', TF_TEXT_FG)}>
                    <span aria-hidden className="shrink-0">
                      {plan.featureIcon ?? '✓'}
                    </span>
                    <span>
                      {f.label}
                      {f.comingSoon ? (
                        <span
                          className={cn(
                            'ml-1 text-[10px] font-bold uppercase',
                            L ? 'text-amber-700' : 'text-amber-300/90',
                          )}
                        >
                          (bientôt)
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
              <div
                className={cn(
                  'border-t px-5 py-4',
                  L ? 'border-tf-grey-pastel/55' : 'border-white/10',
                )}
              >
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
                  <p className={cn('text-center text-xs', TF_TEXT_MUTED)}>Inclus à l’inscription</p>
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
        <h3 className="font-black text-white">Bon à savoir</h3>
        <ul className="list-inside list-disc space-y-1.5">
          <li>
            <strong className="text-white">Boutique :</strong> toutes les formules voient le même catalogue
            (maillots, shorts, chaussures, packs). Ultra et Ambassadeur reçoivent plus de jetons pour
            constituer leur collection plus vite.
          </li>
          <li>
            <strong className={TF_TEXT_FG}>Supporter :</strong> idéal pour découvrir TalkFoot — groupes,
            avatar de base, jetons live et messages du jour inclus.
          </li>
          <li>
            <strong className={TF_TEXT_FG}>Ultra :</strong> badge vérifié, plus de groupes, salons VIP et
            double récompense sur les pronostics.
          </li>
          <li>
            <strong className={TF_TEXT_FG}>Ambassadeur :</strong> statut exclusif, débats quotidiens, salons
            vocaux, articles et live privé — récompenses créateurs bientôt disponibles.
          </li>
        </ul>
        <Link
          to="/profile"
          className={cn(
            'inline-block text-sm font-semibold hover:underline',
            L ? 'text-tf-electric' : 'text-sky-300',
          )}
        >
          ← Retour au profil
        </Link>
      </Card>
    </div>
  )
}
