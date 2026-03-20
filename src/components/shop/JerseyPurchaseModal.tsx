import { useState } from 'react'
import type { AvatarItem, AvatarSlot, JerseyCustomization, JerseySize, JerseySleeve } from '../../types/profile'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { JerseyPreviewThumb } from './JerseyPreviewThumb'
import { cn } from '../../utils/cn'

type Props = {
  item: AvatarItem
  walletTokens: number
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
  walletTokens,
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

  const handleBuy = () => {
    const num = Math.min(99, Math.max(1, parseInt(number.replace(/\D/g, '') || '1', 10)))
    const name = displayName.trim().slice(0, 10).toUpperCase() || 'SUPPORTER'
    if (item.cost > walletTokens) {
      onError('Pas assez de jetons.')
      return
    }
    const paid = spendTokens(item.cost)
    if (!paid.ok) {
      onError('Paiement jetons impossible.')
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
            <JerseyPreviewThumb item={item} />
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
          <div className="flex items-center justify-between rounded-xl bg-amber-50/80 px-3 py-2 text-sm font-bold text-amber-950">
            <span>Prix</span>
            <span>{item.cost} 🪙</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-tf-grey-pastel/50 px-5 py-4">
          <Button type="button" variant="ghost" className="rounded-2xl" onClick={onClose}>
            Annuler
          </Button>
          <Button type="button" variant="primary" className="flex-1 rounded-2xl" onClick={handleBuy}>
            Payer & équiper
          </Button>
        </div>
      </div>
    </div>
  )
}
