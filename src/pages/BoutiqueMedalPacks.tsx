import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { medalPacks } from '../data/shop'
import { useWallet } from '../hooks/useWallet'
import { useBoutiquePurchase } from '../hooks/useBoutiquePurchase'
import { BoutiquePackGridItem } from '../components/shop/BoutiquePackGridItem'
import { MedalPaymentModal } from '../components/shop/MedalPaymentModal'
import { isStripePublishableConfigured } from '../config/stripe'
import { startStripeCheckout } from '../lib/stripe/checkout'
import { useStripeCheckoutReturn } from '../hooks/useStripeCheckoutReturn'
import { useAuth } from '../contexts/AuthContext'
import { getEffectiveMedalCost } from '../data/boutiqueDailyDeal'
import { findBoutiqueCatalogItem } from '../utils/boutiqueCatalog'
import { modularAssetIdForPurchase, profileStudioHref } from '../utils/boutiquePurchaseFlow'
import { cn } from '../utils/cn'
import { TF_FOCUS_VISIBLE } from '../theme/designSystem'
import type { MedalPack } from '../types/profile'

export function BoutiqueMedalPacksPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { wallet, addMedals } = useWallet()
  const { status: checkoutStatus, message: checkoutMessage } = useStripeCheckoutReturn()
  const [stripeLoadingPackId, setStripeLoadingPackId] = useState<string | null>(null)
  const [stripeError, setStripeError] = useState<string | null>(null)
  const { ownsItem, purchaseCosmetic } = useBoutiquePurchase()
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null)
  const [pendingAutoBuy, setPendingAutoBuy] = useState(false)
  const autoPurchaseStarted = useRef(false)

  const needMedals = Number.parseInt(searchParams.get('need') ?? '', 10)
  const pendingItemId = searchParams.get('item')
  const pendingItem = pendingItemId ? findBoutiqueCatalogItem(pendingItemId) : undefined

  const selectedPack = useMemo(
    () => medalPacks.find((p) => p.id === selectedPackId) ?? null,
    [selectedPackId],
  )

  const pendingMedalCost = pendingItem ? getEffectiveMedalCost(pendingItem) : 0

  const shortfall =
    pendingItem && Number.isFinite(pendingMedalCost)
      ? Math.max(0, pendingMedalCost - wallet.medals)
      : Number.isFinite(needMedals) && needMedals > 0
        ? Math.max(0, needMedals - wallet.medals)
        : 0

  const redirectAfterPending = useCallback(() => {
    if (!pendingItem) return
    autoPurchaseStarted.current = true
    const href = profileStudioHref(modularAssetIdForPurchase(pendingItem), pendingItem.id)
    navigate(href, { replace: true })
  }, [pendingItem, navigate])

  const tryCompletePendingPurchase = useCallback(async (): Promise<boolean> => {
    if (!pendingItem || autoPurchaseStarted.current) return false
    if (wallet.medals < getEffectiveMedalCost(pendingItem)) return false

    const returnTo = searchParams.get('return') ?? '/boutique'
    const result = await purchaseCosmetic(pendingItem, 'medals', returnTo)

    if (result.ok) {
      autoPurchaseStarted.current = true
      navigate(result.href, { replace: true })
      return true
    }
    if (result.code === 'already_owned') {
      redirectAfterPending()
      return true
    }
    return false
  }, [
    pendingItem,
    wallet.medals,
    purchaseCosmetic,
    ownsItem,
    navigate,
    redirectAfterPending,
    searchParams,
  ])

  useEffect(() => {
    if (!pendingItem || autoPurchaseStarted.current || shortfall > 0) return
    void tryCompletePendingPurchase()
  }, [pendingItem, shortfall, tryCompletePendingPurchase])

  useEffect(() => {
    if (!pendingAutoBuy || !pendingItem || shortfall > 0) return
    void tryCompletePendingPurchase().then((done) => {
      if (done) setPendingAutoBuy(false)
    })
  }, [pendingAutoBuy, pendingItem, shortfall, tryCompletePendingPurchase])

  const handlePackPaid = (pack: MedalPack) => {
    addMedals(pack.medals + (pack.bonus ?? 0))
    setSelectedPackId(null)
    if (pendingItem) setPendingAutoBuy(true)
  }

  const handleSelectPack = async (packId: string) => {
    if (!isStripePublishableConfigured()) {
      setSelectedPackId(packId)
      return
    }
    if (!user?.id) {
      navigate(`/login?next=${encodeURIComponent('/boutique/packs-medailles')}`)
      return
    }
    setStripeError(null)
    setStripeLoadingPackId(packId)
    const result = await startStripeCheckout({
      kind: 'medal_pack',
      productId: packId,
      userId: user.id,
      email: user.email,
    })
    setStripeLoadingPackId(null)
    if (!result.ok) {
      setStripeError('Paiement indisponible — réessaie ou contacte le support.')
      return
    }
    window.location.assign(result.url)
  }

  const showPendingBanner = pendingItem && shortfall > 0

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-tf-dark/10 bg-gradient-to-br from-amber-950/90 via-[#1a1208] to-[#0c1829] px-4 py-8 sm:px-8 sm:py-10">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-200/90">Recharge</p>
        <h1 className="mt-2 font-display text-3xl font-black text-white sm:text-4xl">Packs de médailles</h1>
        <p className="mt-2 max-w-xl text-sm font-medium text-amber-100/90">
          Achète des médailles en euros (Stripe) pour débloquer maillots, shorts et packs CDM.
        </p>
        {checkoutMessage ? (
          <p
            className={cn(
              'mt-3 text-sm font-bold',
              checkoutStatus === 'done' ? 'text-emerald-200' : 'text-amber-200',
            )}
          >
            {checkoutMessage}
          </p>
        ) : null}
        {stripeError ? <p className="mt-2 text-sm font-bold text-rose-200">{stripeError}</p> : null}
        <div className="mt-4 inline-flex rounded-2xl border border-white/15 bg-black/35 px-4 py-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-200/90">Solde actuel</span>
          <span className="ml-3 font-display text-2xl font-black text-white">
            {wallet.medals} <span aria-hidden>🏅</span>
          </span>
        </div>
      </div>

      {showPendingBanner ? (
        <div className="rounded-xl border border-amber-400/40 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
          <p>
            Pour acheter <strong>{pendingItem.name}</strong>, il te faut{' '}
            <strong>{pendingMedalCost} médailles</strong>.
          </p>
          <p className="mt-1">
            Il te manque environ <strong>{shortfall} médailles</strong> — choisis un pack ci-dessous.
          </p>
        </div>
      ) : null}

      {pendingItem && shortfall === 0 && !autoPurchaseStarted.current ? (
        <p className="text-center text-sm font-bold text-tf-grey">Finalisation de ton achat…</p>
      ) : null}

      <Card className="p-4 sm:p-6" elevation="soft">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {medalPacks.map((pack) => (
            <BoutiquePackGridItem
              key={pack.id}
              pack={pack}
              onSelect={handleSelectPack}
              disabled={stripeLoadingPackId === pack.id}
            />
          ))}
        </div>
      </Card>

      <p className="text-center text-sm font-medium text-tf-grey">
        <Link to="/boutique" className={cn('font-bold text-tf-dark underline-offset-2 hover:underline', TF_FOCUS_VISIBLE)}>
          Retour au catalogue
        </Link>
      </p>

      {selectedPack && !isStripePublishableConfigured() ? (
        <MedalPaymentModal
          pack={selectedPack}
          creatorCode=""
          onConfirm={() => handlePackPaid(selectedPack)}
          onCancel={() => setSelectedPackId(null)}
        />
      ) : null}
    </div>
  )
}
