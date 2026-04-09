import { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import type { MedalPack } from '../../types/profile'

export function MedalPaymentModal({
  pack,
  creatorCode,
  onConfirm,
  onCancel,
}: {
  pack: MedalPack
  creatorCode: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [name, setName] = useState('')
  const [processing, setProcessing] = useState(false)
  const totalMedals = pack.medals + (pack.bonus ?? 0)
  const trimmedCode = creatorCode.trim().toUpperCase()

  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return digits
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    setProcessing(true)
    setTimeout(() => {
      onConfirm()
      setProcessing(false)
    }, 800)
  }

  const isValid =
    cardNumber.replace(/\s/g, '').length >= 12 &&
    expiry.length === 5 &&
    cvv.length >= 3 &&
    name.trim().length >= 2

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" aria-modal="true" role="dialog">
      <Card className="w-full max-w-md p-5 sm:p-6" elevation="soft">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-black text-tf-dark">Paiement sécurisé</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-tf-grey hover:text-tf-dark"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="mb-3 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-orange-50/50 p-3">
          <div className="text-[10px] font-black uppercase tracking-wider text-amber-900/80">Médailles premium</div>
          <div className="mt-1 flex items-start justify-between gap-2">
            <div>
              <div className="font-display text-base font-black text-tf-dark">{pack.name}</div>
              <div className="text-xs font-semibold text-tf-dark/75">{pack.tagline}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-tf-grey">Prix</div>
              <div className="font-display text-lg font-black text-tf-dark">{pack.priceEur}</div>
            </div>
          </div>
          <div className="mt-2 border-t border-amber-200/60 pt-2 font-display text-xl font-black text-amber-950">
            {pack.medals}
            {pack.bonus ? <span className="text-base font-bold text-emerald-700"> +{pack.bonus}</span> : null}{' '}
            médailles
          </div>
          {pack.flavor ? <p className="mt-1 text-[11px] font-medium text-amber-950/85">{pack.flavor}</p> : null}
        </div>

        <div className="mb-3 rounded-lg border border-violet-200/70 bg-violet-50/60 px-3 py-2 text-[11px] font-semibold text-violet-950">
          {trimmedCode ? (
            <>
              <span className="font-black">Code créateur</span> · {trimmedCode}
            </>
          ) : (
            <>Aucun code créateur (optionnel sur la boutique).</>
          )}
        </div>

        <p className="mb-4 text-xs font-medium text-tf-grey">Paiement simulé — aucune carte enregistrée.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="medal-card-name" className="mb-1 block text-xs font-bold text-tf-dark">
              Nom sur la carte
            </label>
            <input
              id="medal-card-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jean Dupont"
              className="w-full rounded-xl border border-tf-grey-pastel/60 bg-tf-white px-3 py-2.5 text-sm font-medium text-tf-dark placeholder:text-tf-grey focus:border-tf-grey/50 focus:outline-none focus:ring-2 focus:ring-tf-grey/20"
              autoComplete="cc-name"
            />
          </div>

          <div>
            <label htmlFor="medal-card-number" className="mb-1 block text-xs font-bold text-tf-dark">
              Numéro de carte
            </label>
            <input
              id="medal-card-number"
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="4242 4242 4242 4242"
              className="w-full rounded-xl border border-tf-grey-pastel/60 bg-tf-white px-3 py-2.5 text-sm font-medium text-tf-dark placeholder:text-tf-grey focus:border-tf-grey/50 focus:outline-none focus:ring-2 focus:ring-tf-grey/20"
              autoComplete="cc-number"
              maxLength={19}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="medal-card-expiry" className="mb-1 block text-xs font-bold text-tf-dark">
                Expiration
              </label>
              <input
                id="medal-card-expiry"
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/AA"
                className="w-full rounded-xl border border-tf-grey-pastel/60 bg-tf-white px-3 py-2.5 text-sm font-medium text-tf-dark placeholder:text-tf-grey focus:border-tf-grey/50 focus:outline-none focus:ring-2 focus:ring-tf-grey/20"
                autoComplete="cc-exp"
                maxLength={5}
              />
            </div>
            <div>
              <label htmlFor="medal-card-cvv" className="mb-1 block text-xs font-bold text-tf-dark">
                CVV
              </label>
              <input
                id="medal-card-cvv"
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                className="w-full rounded-xl border border-tf-grey-pastel/60 bg-tf-white px-3 py-2.5 text-sm font-medium text-tf-dark placeholder:text-tf-grey focus:border-tf-grey/50 focus:outline-none focus:ring-2 focus:ring-tf-grey/20"
                autoComplete="cc-csc"
                maxLength={4}
              />
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Button type="button" variant="ghost" className="flex-1 rounded-xl" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" className="flex-1 rounded-xl" disabled={!isValid || processing}>
              {processing ? 'Traitement…' : `Payer • +${totalMedals} médailles`}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
