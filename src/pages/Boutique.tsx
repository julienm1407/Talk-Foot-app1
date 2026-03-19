import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { TokenPaymentModal } from '../components/shop/TokenPaymentModal'
import { useWallet } from '../hooks/useWallet'
import { useProfile } from '../hooks/useProfile'
import { avatarItems, tokenPacks } from '../data/shop'
import type { AvatarItem as AvatarItemType, AvatarSlot } from '../types/profile'
import type { TokenPack } from '../types/profile'
import { cn } from '../utils/cn'

const SLOT_LABELS: Record<AvatarSlot, string> = {
  scarf: 'Écharpe',
  hat: 'Casquette / chapeau',
  jersey: 'Maillot',
  accessory: 'Accessoire',
}

const RARITY_STYLES: Record<string, string> = {
  common: 'border-tf-grey-pastel/60 bg-tf-white/90 text-tf-dark',
  rare: 'border-blue-200/80 bg-blue-50/80 text-blue-800',
  epic: 'border-violet-300/80 bg-violet-50/80 text-violet-800',
  legendary: 'border-amber-300/80 bg-amber-50/90 text-amber-900',
}

export function BoutiquePage() {
  const { wallet, addTokens, spendTokens } = useWallet()
  const { ownsItem, addOwnedItem } = useProfile()
  const [activeTab, setActiveTab] = useState<'equipment' | 'tokens'>('equipment')
  const [notice, setNotice] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)
  const [paymentPack, setPaymentPack] = useState<TokenPack | null>(null)

  const showNotice = (tone: 'ok' | 'err', text: string) => {
    setNotice({ tone, text })
    window.setTimeout(() => setNotice(null), 2500)
  }

  const handleBuyEquipment = (item: AvatarItemType) => {
    const result = spendTokens(item.cost)
    if (!result.ok) {
      showNotice('err', 'Pas assez de jetons.')
      return
    }
    addOwnedItem(item.id)
    showNotice('ok', `${item.name} acheté ! Équipe-le dans ton profil.`)
  }

  const handleClaimTokenPack = (packId: string) => {
    const pack = tokenPacks.find((p) => p.id === packId)
    if (!pack) return
    const total = pack.tokens + (pack.bonus ?? 0)
    if (pack.free) {
      addTokens(total)
      showNotice('ok', `+${total} jetons ajoutés !`)
      return
    }
    setPaymentPack(pack)
  }

  const handlePaymentConfirm = () => {
    if (!paymentPack) return
    const total = paymentPack.tokens + (paymentPack.bonus ?? 0)
    addTokens(total)
    setPaymentPack(null)
    showNotice('ok', `Paiement accepté • +${total} jetons ajoutés !`)
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2 pb-2">
        <div className="text-[11px] font-black tracking-[0.18em] text-tf-grey">BOUTIQUE</div>
        <h1 className="font-display text-2xl font-black tracking-tight text-tf-dark sm:text-3xl">
          Équipement & jetons
        </h1>
        <p className="text-sm font-medium text-tf-grey">
          Personnalise ton avatar et booste tes jetons pour les pronos et réactions
        </p>
      </header>

      {/* Solde */}
      <Card className="flex items-center justify-between gap-4 p-5 sm:p-6" elevation="soft">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden>🪙</span>
          <div>
            <div className="text-xs font-bold text-tf-grey">Solde actuel</div>
            <div className="font-display text-2xl font-black text-tf-dark">
              {wallet.tokens} jetons
            </div>
          </div>
        </div>
        <Link to="/profile">
          <Button variant="soft" className="rounded-2xl">
            Mon profil
          </Button>
        </Link>
      </Card>

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

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 pt-1 sm:gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('equipment')}
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm font-black transition',
            activeTab === 'equipment'
              ? 'bg-tf-dark text-tf-white'
              : 'bg-tf-grey-pastel/30 text-tf-dark hover:bg-tf-grey-pastel/50',
          )}
        >
          Équipement supporter
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tokens')}
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm font-black transition',
            activeTab === 'tokens'
              ? 'bg-tf-dark text-tf-white'
              : 'bg-tf-grey-pastel/30 text-tf-dark hover:bg-tf-grey-pastel/50',
          )}
        >
          Offres jetons
        </button>
      </div>

      {activeTab === 'equipment' && (
        <Card className="p-5 sm:p-6" elevation="soft">
          <h3 className="font-display text-lg font-black text-tf-dark">
            Personnalise ton avatar
          </h3>
          <p className="mt-2 text-sm font-medium text-tf-grey">
            Écharpes, casquettes, maillots — affiche ton style de supporter dans le chat
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {avatarItems.map((item) => {
              const owned = ownsItem(item.id)
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-tf-grey-pastel/50 bg-tf-white/90 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-3xl" aria-hidden>{item.emoji}</span>
                    <Badge className={cn('text-[10px] font-black', RARITY_STYLES[item.rarity])}>
                      {item.rarity}
                    </Badge>
                  </div>
                  <div className="mt-2 font-bold text-tf-dark">{item.name}</div>
                  <div className="mt-0.5 text-xs font-medium text-tf-grey">
                    {SLOT_LABELS[item.slot]}
                  </div>
                  {item.description && (
                    <div className="mt-1 text-xs text-tf-grey">{item.description}</div>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-tf-dark">{item.cost} 🪙</span>
                    <Button
                      variant={owned ? 'ghost' : 'primary'}
                      className="rounded-xl px-3 py-1.5 text-xs"
                      disabled={owned}
                      onClick={() => !owned && handleBuyEquipment(item)}
                    >
                      {owned ? 'Possédé' : 'Acheter'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {activeTab === 'tokens' && (
        <Card className="p-5 sm:p-6" elevation="soft">
          <h3 className="font-display text-lg font-black text-tf-dark">
            Recharge tes jetons
          </h3>
          <p className="mt-2 text-sm font-medium text-tf-grey">
            Offres spéciales et bonus — utilise les jetons pour les pronos et réactions live
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tokenPacks.map((pack) => (
              <div
                key={pack.id}
                className={cn(
                  'relative rounded-2xl border p-4 transition',
                  pack.popular
                    ? 'border-tf-grey-pastel/50 bg-tf-white shadow-lg ring-2 ring-amber-400/40'
                    : 'border-tf-grey-pastel/50 bg-tf-white/90',
                )}
              >
                {pack.popular && (
                  <div className="absolute -top-2 left-4 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-amber-900">
                    Populaire
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-2xl" aria-hidden>🪙</span>
                  <div>
                    <div className="font-black text-tf-dark">{pack.name}</div>
                    <div className="text-xs font-medium text-tf-grey">{pack.priceDisplay}</div>
                  </div>
                </div>
                <div className="mt-2 font-display text-2xl font-black text-tf-dark">
                  {pack.tokens}
                  {pack.bonus ? (
                    <span className="ml-1 text-base font-bold text-emerald-600">
                      +{pack.bonus} bonus
                    </span>
                  ) : null}{' '}
                  jetons
                </div>
                {pack.description && (
                  <div className="mt-1 text-xs text-tf-grey">{pack.description}</div>
                )}
                <Button
                  variant="primary"
                  className="mt-3 w-full rounded-xl"
                  onClick={() => handleClaimTokenPack(pack.id)}
                >
                  {pack.free ? 'Récupérer' : 'Acheter'}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {paymentPack && (
        <TokenPaymentModal
          pack={paymentPack}
          onConfirm={handlePaymentConfirm}
          onCancel={() => setPaymentPack(null)}
        />
      )}

      <Card className="border-tf-grey-pastel/50 bg-tf-grey-pastel/10 p-4">
        <p className="text-center text-sm font-medium text-tf-grey">
          Équipement : paye avec les jetons (gagnés en live). Recharge jetons : paiement carte simulé pour les offres payantes.
        </p>
      </Card>
    </div>
  )
}
