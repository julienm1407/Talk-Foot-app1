import { useState } from 'react'
import type { AvatarItem, AvatarSlot, JerseyCustomization, JerseySize, JerseySleeve } from '../../types/profile'
import { cosmeticTokenPrice } from '../../data/shop'
import { Button } from '../ui/Button'
import { TokenGlyph } from '../ui/TokenGlyph'
import { Input } from '../ui/Input'
import { JerseyPreviewThumb } from './JerseyPreviewThumb'
import { cn } from '../../utils/cn'
import { containsBannedWord, MODERATION_REFUSED_MESSAGE_FR } from '../../utils/bannedWords'

type Props = {
  item: AvatarItem
  /** Ex. offre du jour : prix médailles différent du `item.cost` catalogue */
  medalPrice?: number
  walletMedals: number
  walletTokens: number
  spendMedals: (amount: number) => { ok: boolean }
  spendTokens: (amount: number) => { ok: boolean }
  addOwnedItem: (id: string) => void
  setJerseyCustomization: (jerseyId: string, data: JerseyCustomization) => void
  equipItem: (itemId: string, slot: AvatarSlot) => void
  onClose: () => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

const SIZES: JerseySize[] = ['S', 'M', 'L', 'XL']
const SLEEVES: { id: JerseySleeve; label: string }[] = [
  { id: 'short', label: 'Manches courtes' },
  { id: 'long', label: 'Manches longues' },
]

export function JerseyPurchaseModal({
  item,
  medalPrice,
  walletMedals,
  walletTokens,
  spendMedals,
  spendTokens,
  addOwnedItem,
  setJerseyCustomization,
  equipItem,
  onClose,
  onSuccess,
  onError,
}: Props) {
  const [displayName, setDisplayName] = useState('')
  const [number, setNumber] = useState('10')
  const [size, setSize] = useState<JerseySize>('M')
  const [sleeve, setSleeve] = useState<JerseySleeve>('short')

  const priceMedals = medalPrice ?? item.cost
  const priceTokens = cosmeticTokenPrice(priceMedals)

  const finalizePurchase = () => {
    const num = Math.min(99, Math.max(1, parseInt(number.replace(/\D/g, '') || '1', 10)))
    const name = displayName.trim().slice(0, 10).toUpperCase() || 'SUPPORTER'
    if (containsBannedWord(name)) {
      onError(MODERATION_REFUSED_MESSAGE_FR)
      return
    }
    const data: JerseyCustomization = {
      displayName: name,
      number: String(num),
      size,
      sleeve,
    }
    addOwnedItem(item.id)
    setJerseyCustomization(item.id, data)
    equipItem(item.id, 'jersey')
    onSuccess(`${item.name} acheté — porté sur ton avatar avec flocage ${num}.`)
    onClose()
  }

  const handlePayMedals = () => {
    if (priceMedals > walletMedals) {
      onError('Pas assez de médailles — achète un pack (€) dans la boutique.')
      return
    }
    const paid = spendMedals(priceMedals)
    if (!paid.ok) {
      onError('Paiement médailles impossible.')
      return
    }
    finalizePurchase()
  }

  const handlePayTokens = () => {
    if (priceTokens > walletTokens) {
      onError('Pas assez de jetons — paris gagnés ou bonus quotidien. Les jetons ne s’achètent pas en €.')
      return
    }
    const paid = spendTokens(priceTokens)
    if (!paid.ok) {
      onError('Paiement en jetons impossible.')
      return
    }
    finalizePurchase()
  }

  return (
    <div
      className="fixed inset-0 z-[220] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="jersey-buy-title"
    >
      <div className="max-h-[min(90dvh,640px)] w-full max-w-md overflow-y-auto rounded-[28px] border border-tf-grey-pastel/60 bg-white shadow-2xl">
        <div className="border-b border-tf-grey-pastel/50 px-5 py-4">
          <div className="text-[10px] font-black tracking-widest text-tf-grey">MAILLOT INSPIRÉ</div>
          <h2
            id="jersey-buy-title"
            className="mt-1 font-display text-xl font-black text-tf-dark"
            title="Personnaliser le flocage et équiper ce maillot sur l’avatar"
          >
            Personnaliser
          </h2>
          <p className="mt-1 text-xs font-medium text-tf-grey">
            Design générique sans logo officiel. Taille et manches sont indicatives (aperçu digital).
          </p>
        </div>

        <div className="flex justify-center border-b border-tf-grey-pastel/30 bg-tf-grey-pastel/10 py-4">
          <div className="rounded-2xl border border-white bg-white p-3 shadow-md">
            <JerseyPreviewThumb item={item} className="h-44 w-full max-w-[12rem]" />
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="text-[10px] font-black uppercase text-tf-grey">Prénom / surnom (dos)</label>
            <Input
              className="mt-1 rounded-xl"
              placeholder="Ex. LÉO"
              maxLength={10}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-tf-grey">Numéro (1–99)</label>
            <Input
              className="mt-1 rounded-xl"
              inputMode="numeric"
              value={number}
              onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 2))}
            />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-tf-grey">Taille</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={cn(
                    'rounded-xl px-4 py-2 text-sm font-black transition',
                    size === s ? 'bg-tf-dark text-white' : 'bg-tf-grey-pastel/25 text-tf-dark hover:bg-tf-grey-pastel/40',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-tf-grey">Style</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {SLEEVES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSleeve(s.id)}
                  className={cn(
                    'rounded-xl px-4 py-2 text-sm font-bold transition',
                    sleeve === s.id ? 'bg-tf-dark text-white' : 'bg-tf-grey-pastel/25 text-tf-dark hover:bg-tf-grey-pastel/40',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1 rounded-xl bg-amber-50/80 px-3 py-2.5 text-sm font-bold text-amber-950">
            <div className="flex items-center justify-between tabular-nums">
              <span>Médailles</span>
              <span>
                {priceMedals} <span aria-hidden>🏅</span>
              </span>
            </div>
            <p className="text-center text-[10px] font-black uppercase tracking-wider text-amber-800/80">ou</p>
            <div className="flex items-center justify-between text-emerald-900 tabular-nums">
              <span>Jetons</span>
              <span className="inline-flex items-center gap-1">
                {priceTokens.toLocaleString('fr-FR')}
                <TokenGlyph className="size-[1em]" />
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-tf-grey-pastel/50 px-5 py-4 sm:flex-row sm:flex-wrap">
          <Button type="button" variant="ghost" className="rounded-2xl sm:order-first" onClick={onClose}>
            Annuler
          </Button>
          <Button type="button" variant="primary" className="flex-1 rounded-2xl sm:min-w-[140px]" onClick={handlePayMedals}>
            Payer {priceMedals} 🏅 & équiper
          </Button>
          <Button
            type="button"
            variant="success"
            className="flex-1 rounded-2xl font-semibold sm:min-w-[140px]"
            onClick={handlePayTokens}
          >
            <span className="inline-flex items-center justify-center gap-1">
              Payer {priceTokens}
              <TokenGlyph variant="onDark" className="size-[1em]" />
              <span>& équiper</span>
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}
