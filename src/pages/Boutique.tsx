import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { TokenGlyph } from '../components/ui/TokenGlyph'
import { useBoutiquePurchase } from '../hooks/useBoutiquePurchase'
import { useSubscription } from '../hooks/useSubscription'
import {
  CDM_BUNDLE_MEDALS,
  CDM_JERSEY_MEDALS,
  CDM_SHORT_MEDALS,
  TOKENS_PER_MEDAL,
  isCosmeticOwned,
} from '../data/boutiqueEconomy'
import type { AvatarItem as AvatarItemType } from '../types/profile'
import { cn } from '../utils/cn'
import { getAppSectionTheme } from '../theme/appSectionThemes'
import { TF_FOCUS_VISIBLE } from '../theme/designSystem'
import { getBoutiqueDailyDeal } from '../data/boutiqueDailyDeal'
import { buildCatalogRows, sortCatalogRows, type CatalogFilter, type CatalogSort } from '../utils/boutiqueCatalog'
import { BoutiqueCosmeticGridItem } from '../components/shop/BoutiqueCosmeticGridItem'
import { BoutiqueDailyDealBanner } from '../components/shop/BoutiqueDailyDealBanner'
import { catalogTabForShopItem, boutiqueMedalPacksHref } from '../utils/boutiquePurchaseFlow'

/** Canvas studio lourd : chargé seulement à l’ouverture d’un article. */
const BoutiqueItemPurchaseModal = lazy(() =>
  import('../components/shop/BoutiqueItemPurchaseModal').then((m) => ({
    default: m.BoutiqueItemPurchaseModal,
  })),
)

const FILTER_TABS: { id: CatalogFilter; label: string }[] = [
  { id: 'packs', label: 'Packs' },
  { id: 'jerseys', label: 'Maillots' },
  { id: 'shorts', label: 'Shorts' },
  { id: 'shoes', label: 'Chaussures' },
]

const CATALOG_FILTERS = new Set<CatalogFilter>(['packs', 'jerseys', 'shorts', 'shoes'])

function parseCatalogTab(raw: string | null): CatalogFilter | null {
  if (!raw || !CATALOG_FILTERS.has(raw as CatalogFilter)) return null
  return raw as CatalogFilter
}

export function BoutiquePage() {
  const navigate = useNavigate()
  const { plan, monthlyTokens, betTokenMultiplier } = useSubscription()
  const { wallet, ownsItem, purchaseCosmetic } = useBoutiquePurchase()
  const [searchParams] = useSearchParams()
  const tabFromUrl = parseCatalogTab(searchParams.get('tab'))
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>(() => tabFromUrl ?? 'packs')

  useEffect(() => {
    const next = parseCatalogTab(searchParams.get('tab'))
    if (next) setCatalogFilter(next)
  }, [searchParams])
  const [catalogSort, setCatalogSort] = useState<CatalogSort>('name_asc')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [notice, setNotice] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)
  const [purchaseFlow, setPurchaseFlow] = useState<{
    item: AvatarItemType
    step: 'preview' | 'confirm'
    currency?: 'medals' | 'tokens'
  } | null>(null)
  const [confirmingPurchase, setConfirmingPurchase] = useState(false)

  const shop = getAppSectionTheme('boutique')
  const dailyDeal = useMemo(() => getBoutiqueDailyDeal(), [])

  useEffect(() => {
    if (searchParams.get('deal') !== 'jour' || !dailyDeal) return
    const tab = catalogTabForShopItem(dailyDeal.item)
    setCatalogFilter(tab)
  }, [searchParams, dailyDeal])

  const catalogRows = useMemo(
    () => buildCatalogRows(catalogFilter, catalogSearch),
    [catalogFilter, catalogSearch],
  )
  const sortedCatalogRows = useMemo(() => {
    const sorted = sortCatalogRows(catalogRows, catalogSort)
    if (!dailyDeal || catalogSearch.trim()) return sorted
    const idx = sorted.findIndex((r) => r.item.id === dailyDeal.itemId)
    if (idx <= 0) return sorted
    const copy = [...sorted]
    const [row] = copy.splice(idx, 1)
    copy.unshift(row)
    return copy
  }, [catalogRows, catalogSort, dailyDeal, catalogSearch])

  const showNotice = (tone: 'ok' | 'err', text: string) => {
    setNotice({ tone, text })
    window.setTimeout(() => setNotice(null), 2800)
  }

  const redirectToMedalPacks = (item: AvatarItemType) => {
    navigate(boutiqueMedalPacksHref(item, `/boutique?tab=${catalogTabForShopItem(item)}`))
  }

  const openItemPreview = (item: AvatarItemType) => {
    setConfirmingPurchase(false)
    setPurchaseFlow({ item, step: 'preview' })
  }

  const closePurchaseFlow = () => {
    setPurchaseFlow(null)
    setConfirmingPurchase(false)
  }

  const handleConfirmPurchase = async () => {
    if (!purchaseFlow || purchaseFlow.step !== 'confirm' || !purchaseFlow.currency || confirmingPurchase) {
      return
    }
    const { item, currency } = purchaseFlow
    setConfirmingPurchase(true)
    const result = await purchaseCosmetic(
      item,
      currency,
      `/boutique?tab=${catalogTabForShopItem(item)}`,
    )
    setConfirmingPurchase(false)
    if (result.ok) {
      setPurchaseFlow(null)
      navigate(result.href)
      return
    }
    setPurchaseFlow(null)
    if (result.code === 'partial_pack') {
      showNotice(
        'err',
        'Tu possèdes déjà une partie de ce pack — achète les pièces manquantes dans Maillots ou Shorts.',
      )
      return
    }
    if (result.code === 'insufficient_medals') {
      redirectToMedalPacks(item)
      return
    }
    if (result.code === 'insufficient_tokens') {
      redirectToMedalPacks(item)
      return
    }
    if (result.code === 'payment_failed') {
      showNotice('err', 'Paiement impossible — réessaie dans un instant.')
      return
    }
    if (result.code === 'save_failed') {
      showNotice('err', 'Sauvegarde impossible — vérifie ta connexion et réessaie.')
    }
  }

  const filterHint =
    catalogFilter === 'jerseys'
      ? `${CDM_JERSEY_MEDALS} médailles par maillot`
      : catalogFilter === 'shorts'
        ? `${CDM_SHORT_MEDALS} médailles par short`
        : catalogFilter === 'packs'
          ? `${CDM_BUNDLE_MEDALS} médailles par pack maillot + short`
          : 'Chaussures standards'

  const purchaseModal = purchaseFlow ? (
    <Suspense fallback={null}>
      <BoutiqueItemPurchaseModal
        item={purchaseFlow.item}
        step={purchaseFlow.step}
        currency={purchaseFlow.currency}
        walletMedals={wallet.medals}
        walletTokens={wallet.tokens}
        confirming={confirmingPurchase}
        onClose={closePurchaseFlow}
        onChooseCurrency={(currency) => {
          setPurchaseFlow((prev) => (prev ? { ...prev, step: 'confirm', currency } : null))
        }}
        onBack={() =>
          setPurchaseFlow((prev) => (prev ? { ...prev, step: 'preview', currency: undefined } : null))
        }
        onConfirm={() => void handleConfirmPurchase()}
        onNeedMedals={() => {
          const item = purchaseFlow.item
          setPurchaseFlow(null)
          redirectToMedalPacks(item)
        }}
      />
    </Suspense>
  ) : null

  return (
    <div className="space-y-6">
      {purchaseModal}
      <div
        className={cn(
          'relative overflow-hidden rounded-3xl border border-tf-dark/10 shadow-[0_24px_80px_rgba(1,30,51,0.12)]',
          'bg-gradient-to-br from-[#061a2e] via-[#0c2744] to-[#152a4a]',
        )}
      >
        <div className="relative px-4 py-8 sm:px-8 sm:py-10">
          <header className={cn('space-y-3', shop.page.eyebrowClass)}>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-200/90">Boutique Talk Foot</p>
            <h1 className="font-display text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
              Maillots, shorts, packs & chaussures
            </h1>
            <p className="max-w-xl text-sm font-medium text-sky-100/90">
              Visuel produit · achat en <strong className="text-white">médailles 🏅</strong> ou{' '}
              <strong className="text-white">jetons</strong> (1 🏅 = {TOKENS_PER_MEDAL.toLocaleString('fr-FR')}{' '}
              jetons). Catalogue identique pour toutes les formules — ta formule{' '}
              <strong className="text-white">{plan.name}</strong>
              {monthlyTokens > 0
                ? ` : +${monthlyTokens.toLocaleString('fr-FR')} jetons / mois`
                : ''}
              {betTokenMultiplier > 1 ? ` · jetons paris ×${betTokenMultiplier}` : ''}.
            </p>
          </header>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
            <div className="rounded-2xl border border-white/15 bg-black/30 px-4 py-3 backdrop-blur-md">
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-200/90">Médailles</div>
              <div className="mt-1 font-display text-2xl font-black text-white">
                {wallet.medals} <span className="text-lg">🏅</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/30 px-4 py-3 backdrop-blur-md">
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-200/90">Jetons</div>
              <div className="mt-1 flex items-center gap-1.5 font-display text-2xl font-black text-white">
                {wallet.tokens}
                <TokenGlyph variant="onDark" className="size-7" />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/boutique/medailles"
              className={cn(
                TF_FOCUS_VISIBLE,
                'inline-flex min-h-tf-touch items-center justify-center rounded-2xl border border-amber-300/50 bg-amber-500/25 px-5 py-3 text-sm font-black text-amber-50 shadow-md transition hover:bg-amber-500/35',
              )}
            >
              Acheter des médailles
            </Link>
            <Link
              to="/profile#avatar-modulaire"
              className={cn(
                TF_FOCUS_VISIBLE,
                'inline-flex min-h-tf-touch items-center justify-center rounded-2xl border border-white/50 bg-white px-5 py-3 text-sm font-semibold font-display text-tf-dark shadow-md transition hover:bg-sky-50',
              )}
            >
              Studio personnage
            </Link>
          </div>
        </div>
      </div>

      {notice ? (
        <div
          className={cn(
            'rounded-xl px-4 py-3 text-sm font-bold',
            notice.tone === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800',
          )}
        >
          {notice.text}
        </div>
      ) : null}

      {dailyDeal ? <BoutiqueDailyDealBanner deal={dailyDeal} /> : null}

      <Card className="overflow-hidden p-0 sm:p-0" elevation="soft">
        <div className="border-b border-tf-grey-pastel/50 bg-gradient-to-r from-slate-50/95 via-white to-sky-50/50 px-4 py-4 sm:px-6 sm:py-5">
          <h2 className="font-display text-xl font-black tracking-tight text-tf-dark sm:text-2xl">Catalogue</h2>
          <p className="mt-1 text-sm font-medium text-tf-grey">{filterHint}</p>
        </div>

        <div className="sticky top-0 z-[1] border-b border-tf-grey-pastel/60 bg-[color-mix(in_srgb,var(--tf-card-bg-light)_94%,transparent)] px-3 py-3 backdrop-blur-md sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-0 flex-1 sm:max-w-xs">
              <label htmlFor="boutique-catalog-search" className="sr-only">
                Rechercher
              </label>
              <Input
                id="boutique-catalog-search"
                className="rounded-xl border-tf-grey-pastel/70"
                placeholder="Rechercher un pays ou un modèle…"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTER_TABS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCatalogFilter(id)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-xs font-black transition sm:text-sm',
                    catalogFilter === id
                      ? 'border-tf-dark bg-tf-dark text-white shadow-sm'
                      : 'border-slate-300/70 bg-white text-tf-dark hover:border-tf-dark/25',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              id="boutique-catalog-sort"
              value={catalogSort}
              onChange={(e) => setCatalogSort(e.target.value as CatalogSort)}
              className="rounded-xl border border-slate-300/80 bg-white px-3 py-2.5 text-sm font-bold text-tf-dark shadow-sm"
              aria-label="Trier par"
            >
              <option value="name_asc">Nom (A → Z)</option>
              <option value="price_medals_asc">Prix croissant</option>
              <option value="price_medals_desc">Prix décroissant</option>
            </select>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {sortedCatalogRows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm font-bold text-tf-grey">
              Aucun article pour cette recherche.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 min-[420px]:gap-5 xl:[grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
              {sortedCatalogRows.map((row) => (
                <BoutiqueCosmeticGridItem
                  key={row.item.id}
                  item={row.item}
                  owned={isCosmeticOwned(row.item, ownsItem)}
                  onOpenItem={openItemPreview}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
