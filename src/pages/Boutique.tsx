import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { TokenGlyph } from '../components/ui/TokenGlyph'
import { MedalPaymentModal } from '../components/shop/MedalPaymentModal'
import { JerseyPurchaseModal } from '../components/shop/JerseyPurchaseModal'
import { JerseyPreviewThumb } from '../components/shop/JerseyPreviewThumb'
import { useWallet } from '../hooks/useWallet'
import { useProfile } from '../hooks/useProfile'
import {
  medalPacks,
  pickDailyOfferItem,
  dailyOfferDiscountedCost,
  cosmeticTokenPrice,
} from '../data/shop'
import type { AvatarItem as AvatarItemType, MedalPack } from '../types/profile'
import { cn } from '../utils/cn'
import { getAppSectionTheme } from '../theme/appSectionThemes'
import { TF_FOCUS_VISIBLE } from '../theme/designSystem'
import {
  buildCatalogRows,
  sortCatalogRows,
  type CatalogFilter,
  type CatalogSort,
} from '../utils/boutiqueCatalog'
import { BoutiqueCosmeticGridItem } from '../components/shop/BoutiqueCosmeticGridItem'
import { BoutiquePackGridItem } from '../components/shop/BoutiquePackGridItem'

export function BoutiquePage() {
  const { wallet, addMedals, spendMedals, spendTokens, claimDailyTokenBonus } = useWallet()
  const { ownsItem, addOwnedItem, setJerseyCustomization, equipItem } = useProfile()
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>('all')
  const [catalogSort, setCatalogSort] = useState<CatalogSort>('featured')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [notice, setNotice] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)
  const [paymentPack, setPaymentPack] = useState<MedalPack | null>(null)
  const [jerseyModalItem, setJerseyModalItem] = useState<AvatarItemType | null>(null)
  const [jerseyModalMedalPrice, setJerseyModalMedalPrice] = useState<number | undefined>(undefined)
  const [creatorCode, setCreatorCode] = useState('')

  const dailyItem = useMemo(() => pickDailyOfferItem(), [])
  const dailyPrice = dailyOfferDiscountedCost(dailyItem)
  const shop = getAppSectionTheme('boutique')

  const catalogRows = useMemo(
    () => buildCatalogRows(catalogFilter, catalogSearch),
    [catalogFilter, catalogSearch],
  )
  const sortedCatalogRows = useMemo(
    () => sortCatalogRows(catalogRows, catalogSort),
    [catalogRows, catalogSort],
  )

  const showNotice = (tone: 'ok' | 'err', text: string) => {
    setNotice({ tone, text })
    window.setTimeout(() => setNotice(null), 2800)
  }

  const handleBuyCosmetic = (item: AvatarItemType, currency: 'medals' | 'tokens', medalCost?: number) => {
    const medalPrice = medalCost ?? item.cost
    if (currency === 'medals') {
      const result = spendMedals(medalPrice)
      if (!result.ok) {
        showNotice('err', 'Pas assez de médailles. Achète un pack ou choisis un autre article.')
        return
      }
    } else {
      const tokenCost = cosmeticTokenPrice(medalPrice)
      const result = spendTokens(tokenCost)
      if (!result.ok) {
        showNotice('err', 'Pas assez de jetons — paris gagnés ou bonus quotidien. Les jetons ne s’achètent pas en €.')
        return
      }
    }
    addOwnedItem(item.id)
    showNotice('ok', `${item.name} débloqué ! Équipe-le dans ton profil.`)
  }

  const handleOpenMedalPack = (packId: string) => {
    const pack = medalPacks.find((p) => p.id === packId)
    if (!pack) return
    setPaymentPack(pack)
  }

  const handlePaymentConfirm = () => {
    if (!paymentPack) return
    const total = paymentPack.medals + (paymentPack.bonus ?? 0)
    addMedals(total)
    setPaymentPack(null)
    showNotice('ok', `Paiement accepté • +${total} médailles ajoutées à ton compte.`)
  }

  const closeJerseyModal = () => {
    setJerseyModalItem(null)
    setJerseyModalMedalPrice(undefined)
  }

  const openJerseyShop = (item: AvatarItemType, medalPrice?: number) => {
    setJerseyModalItem(item)
    setJerseyModalMedalPrice(medalPrice)
  }

  return (
    <div className="space-y-8">
      <div
        className={cn(
          'relative overflow-hidden rounded-3xl border border-tf-dark/10 shadow-[0_24px_80px_rgba(1,30,51,0.12)]',
          'bg-gradient-to-br from-[#061a2e] via-[#0c2744] to-[#152a4a]',
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(56,189,248,0.35), transparent), radial-gradient(ellipse 60% 40% at 100% 80%, rgba(244,63,94,0.2), transparent)',
          }}
          aria-hidden
        />
        <div className="relative px-4 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <header className={cn('min-w-0 max-w-3xl flex-1 space-y-3', shop.page.eyebrowClass)}>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-200/90">Boutique Talk Foot</p>
              <h1 className="font-display text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                Stade digital
              </h1>
              <p className="max-w-xl text-sm font-medium text-sky-100/90">
                <strong className="text-white">🏅</strong> boutique ·{' '}
                <span className="inline-flex items-center gap-1 align-middle">
                  <TokenGlyph variant="onDark" className="size-[1.1em]" />
                  <strong className="text-white">jetons</strong>
                </span>{' '}
                au fil du jeu.
              </p>
            </header>
            <div className="w-full max-w-[15rem] shrink-0 self-end sm:self-start sm:pt-0.5">
              <label
                htmlFor="boutique-creator-code"
                className="block text-[10px] font-black uppercase tracking-wider text-sky-200/90"
              >
                Code créateur <span className="font-bold normal-case text-white/70">(optionnel)</span>
              </label>
              <Input
                id="boutique-creator-code"
                className="mt-1.5 rounded-xl"
                placeholder="Ex. TALKFOOT"
                value={creatorCode}
                onChange={(e) =>
                  setCreatorCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 16))
                }
                autoComplete="off"
              />
            </div>
          </div>

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
              to="/profile"
              className={cn(
                TF_FOCUS_VISIBLE,
                'inline-flex min-h-tf-touch items-center justify-center rounded-2xl border border-white/50 bg-white px-5 py-3 text-sm font-semibold font-display text-tf-dark shadow-md transition hover:bg-sky-50 active:scale-[0.99]',
              )}
            >
              Mon profil
            </Link>
            <Link
              to="/match"
              className={cn(
                TF_FOCUS_VISIBLE,
                'inline-flex min-h-tf-touch items-center justify-center rounded-2xl border-2 border-white/25 bg-tf-cta px-5 py-3 text-sm font-semibold font-display text-white shadow-[0_3px_10px_rgba(255,59,59,0.22)] transition hover:border-white/35 hover:bg-tf-cta-hover hover:shadow-[0_4px_14px_rgba(255,59,59,0.26)] active:scale-[0.99]',
              )}
            >
              Parier & gagner des jetons
            </Link>
          </div>
        </div>
      </div>

      <p className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 rounded-xl border border-rose-200/70 bg-rose-50/90 px-3 py-2 text-center text-[11px] font-bold leading-snug text-rose-950 sm:text-xs">
        Les jetons ne s’achètent pas en € — seulement les packs <strong>médailles</strong>.
      </p>

      {notice && (
        <div
          className={cn(
            'rounded-xl px-4 py-3 text-sm font-bold',
            notice.tone === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800',
          )}
        >
          {notice.text}
        </div>
      )}

      <div className="space-y-5">
        <section aria-label="À la une — accessoires et cosmétiques" className="space-y-4">
          <header className="px-0.5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="font-display text-xl font-black tracking-tight text-tf-dark sm:text-2xl">
                À la une
              </h2>
              <span className="rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-sm">
                Cosmétiques & accessoires
              </span>
            </div>
          </header>

          <article
            className={cn(
              'overflow-hidden rounded-2xl border-2 border-rose-500/45 bg-gradient-to-br from-rose-50 via-white to-amber-50/90',
              'shadow-[0_16px_48px_rgba(225,29,72,0.12)] ring-1 ring-rose-200/50',
            )}
          >
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:gap-5 sm:p-5">
              <div className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-rose-200/60 bg-gradient-to-b from-slate-100 to-slate-200/50 sm:w-[min(44%,200px)] sm:min-h-[11rem]">
                <span className="absolute left-2 top-2 rounded-lg bg-rose-600 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                  Offre flash · −12&nbsp;%
                </span>
                <div className="flex w-full items-center justify-center py-6 sm:min-h-[12rem] sm:py-4">
                  <JerseyPreviewThumb item={dailyItem} size="showcase" />
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-700/90">Cosmétique du jour</p>
                <h3 className="mt-1 font-display text-2xl font-black leading-tight tracking-tight text-tf-dark sm:text-3xl">
                  {dailyItem.name}
                </h3>
                {dailyItem.description ? (
                  <p className="mt-2 text-sm font-medium leading-snug text-tf-dark/75">{dailyItem.description}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-lg font-bold text-tf-grey line-through tabular-nums">{dailyItem.cost} 🏅</span>
                  <span className="font-display text-3xl font-black tabular-nums text-rose-700 sm:text-4xl">
                    {dailyPrice} 🏅
                  </span>
                  <span className="text-xs font-bold text-rose-800/80">prix promo du jour</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {dailyItem.jerseyVisual ? (
                    <Button
                      type="button"
                      variant="primary"
                      className="min-h-12 rounded-xl px-6 text-sm font-black"
                      disabled={ownsItem(dailyItem.id)}
                      onClick={() => {
                        if (ownsItem(dailyItem.id)) return
                        openJerseyShop(dailyItem, dailyPrice)
                      }}
                    >
                      {ownsItem(dailyItem.id) ? 'Déjà dans ta collection' : 'Prendre l’offre flash'}
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="primary"
                        className="min-h-12 rounded-xl px-5 text-sm font-black"
                        disabled={ownsItem(dailyItem.id)}
                        onClick={() => {
                          if (ownsItem(dailyItem.id)) return
                          handleBuyCosmetic(dailyItem, 'medals', dailyPrice)
                        }}
                      >
                        {ownsItem(dailyItem.id) ? 'Possédé' : `Payer ${dailyPrice} 🏅`}
                      </Button>
                      <Button
                        type="button"
                        variant="success"
                        className="min-h-12 rounded-xl px-4 text-sm font-black"
                        disabled={ownsItem(dailyItem.id)}
                        onClick={() => {
                          if (ownsItem(dailyItem.id)) return
                          handleBuyCosmetic(dailyItem, 'tokens', dailyPrice)
                        }}
                      >
                        <span className="inline-flex items-center gap-2">
                          <TokenGlyph variant="onDark" className="size-5 opacity-95" />
                          <span className="tabular-nums">
                            {cosmeticTokenPrice(dailyPrice)} jetons
                          </span>
                        </span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border-2 border-emerald-400/50 bg-gradient-to-br from-emerald-50 via-white to-teal-50/80 p-4 shadow-md sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-5">
            <div className="flex items-center gap-4">
              <div
                className="grid size-14 shrink-0 place-items-center rounded-2xl border border-emerald-300/60 bg-white shadow-inner sm:size-16"
                aria-hidden
              >
                <TokenGlyph className="size-10 sm:size-11" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-800">Côté jeu</p>
                <h3 className="mt-0.5 font-display text-lg font-black text-emerald-950 sm:text-xl">
                  Bonus jetons quotidien
                </h3>
                <p className="mt-1 text-sm font-medium text-emerald-900/80">
                  Gratuit, une fois par jour — pour parier ou payer certains cosmétiques en jetons.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col items-stretch gap-2 sm:mt-0 sm:items-end">
              <p className="text-center font-display text-2xl font-black tabular-nums text-emerald-900 sm:text-right sm:text-3xl">
                +35
              </p>
              <Button
                type="button"
                variant="success"
                className="min-h-11 w-full rounded-xl px-6 text-sm font-black sm:w-auto"
                onClick={() => {
                  const r = claimDailyTokenBonus()
                  if (!r.ok && r.reason === 'already_claimed') showNotice('err', 'Déjà récupéré aujourd’hui.')
                  else if (r.ok) showNotice('ok', `+${r.amount} jetons !`)
                  else showNotice('err', 'Impossible pour le moment.')
                }}
              >
                Récupérer
              </Button>
            </div>
          </article>

          <div className="flex justify-center pt-1">
            <a
              href="#boutique-catalog"
              className="inline-flex items-center gap-2 rounded-full border-2 border-tf-dark/12 bg-white px-5 py-2.5 text-sm font-black text-tf-dark shadow-sm transition hover:border-tf-dark/25 hover:bg-slate-50"
            >
              Parcourir tout le catalogue
              <span aria-hidden>↓</span>
            </a>
          </div>
        </section>
      </div>

      <div id="boutique-catalog" className="scroll-mt-28 space-y-4">
        <Card className="overflow-hidden p-0 sm:p-0" elevation="soft">
          <div className="border-b border-tf-grey-pastel/50 bg-gradient-to-r from-slate-50/95 via-white to-sky-50/50 px-4 py-4 sm:px-6 sm:py-5">
            <h2 className="font-display text-xl font-black tracking-tight text-tf-dark sm:text-2xl">Catalogue</h2>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-snug text-tf-grey">
              Une seule vitrine : cherche, filtre par rayon, trie comme en grande surface.{' '}
              <strong className="text-tf-dark">Accessoires & maillots</strong> (🏅 ou jetons) et{' '}
              <strong className="text-tf-dark">packs médailles en €</strong> au même endroit.
            </p>
          </div>

          <div className="sticky top-0 z-[1] border-b border-tf-grey-pastel/60 bg-[color-mix(in_srgb,var(--tf-card-bg-light)_94%,transparent)] px-3 py-3 backdrop-blur-md sm:px-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-end xl:gap-4">
              <div className="min-w-0 flex-1 xl:max-w-xs">
                <label htmlFor="boutique-catalog-search" className="sr-only">
                  Rechercher un article
                </label>
                <Input
                  id="boutique-catalog-search"
                  className="rounded-xl border-tf-grey-pastel/70"
                  placeholder="Rechercher (nom, style…)"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['all', 'Tout le catalogue'],
                    ['accessories', 'Accessoires'],
                    ['kits', 'Maillots'],
                    ['medals_eur', 'Packs médailles (€)'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCatalogFilter(id)}
                    className={cn(
                      'rounded-full border px-3 py-2 text-xs font-black transition sm:text-sm',
                      catalogFilter === id
                        ? 'border-tf-dark bg-tf-dark text-white shadow-sm'
                        : 'border-slate-300/70 bg-white text-tf-dark shadow-sm hover:border-tf-dark/25',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex w-full flex-col gap-1 sm:w-auto sm:min-w-[13rem]">
                <label
                  htmlFor="boutique-catalog-sort"
                  className="text-[10px] font-black uppercase tracking-wider text-tf-grey"
                >
                  Trier par
                </label>
                <select
                  id="boutique-catalog-sort"
                  value={catalogSort}
                  onChange={(e) => setCatalogSort(e.target.value as CatalogSort)}
                  className="w-full rounded-xl border border-slate-300/80 bg-white px-3 py-2.5 text-sm font-bold text-tf-dark shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-tf-dark/25"
                >
                  <option value="featured">Recommandé</option>
                  <option value="price_medals_asc">Prix (🏅) croissant</option>
                  <option value="price_medals_desc">Prix (🏅) décroissant</option>
                  <option value="rarity_desc">Rareté (cosmétiques)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-6">
            {sortedCatalogRows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm font-bold text-tf-grey">
                Aucun article pour ces critères — essaie un autre filtre ou une autre recherche.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {sortedCatalogRows.map((row) =>
                  row.kind === 'cosmetic' ? (
                    <BoutiqueCosmeticGridItem
                      key={row.item.id}
                      item={row.item}
                      ownsItem={ownsItem}
                      openJerseyShop={openJerseyShop}
                      handleBuyCosmetic={handleBuyCosmetic}
                    />
                  ) : (
                    <BoutiquePackGridItem key={row.pack.id} pack={row.pack} onSelect={handleOpenMedalPack} />
                  ),
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {paymentPack && (
        <MedalPaymentModal
          pack={paymentPack}
          creatorCode={creatorCode}
          onConfirm={handlePaymentConfirm}
          onCancel={() => setPaymentPack(null)}
        />
      )}

      {jerseyModalItem && (
        <JerseyPurchaseModal
          item={jerseyModalItem}
          medalPrice={jerseyModalMedalPrice}
          walletMedals={wallet.medals}
          walletTokens={wallet.tokens}
          spendMedals={spendMedals}
          spendTokens={spendTokens}
          addOwnedItem={addOwnedItem}
          setJerseyCustomization={setJerseyCustomization}
          equipItem={equipItem}
          onClose={closeJerseyModal}
          onSuccess={(msg) => showNotice('ok', msg)}
          onError={(msg) => showNotice('err', msg)}
        />
      )}

      <p className="flex flex-wrap items-center justify-center gap-x-1 text-center text-[11px] font-medium text-tf-grey sm:text-xs">
        <TokenGlyph className="size-3" /> Jetons au jeu · 🏅 packs en €
      </p>
    </div>
  )
}
