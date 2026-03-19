import { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import type { TokenPack } from '../../types/profile'

export function TokenPaymentModal({
  pack,
  onConfirm,
  onCancel,
}: {
  pack: TokenPack
  onConfirm: () => void
  onCancel: () => void
}) {
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [name, setName] = useState('')
  const [processing, setProcessing] = useState(false)
  const total = pack.tokens + (pack.bonus ?? 0)

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
          <h3 className="font-display text-lg font-black text-tf-dark">Paiement</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-tf-grey hover:text-tf-dark"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-tf-grey-pastel/50 bg-tf-grey-pastel/10 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-tf-dark">{pack.name}</span>
            <span className="font-display text-xl font-black text-tf-dark">
              {pack.tokens}
              {pack.bonus ? <span className="text-emerald-600"> +{pack.bonus}</span> : null} jetons
            </span>
          </div>
        </div>

        <p className="mb-4 text-xs font-medium text-tf-grey">
          Simulation de paiement — aucune donnée n'est enregistrée.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="card-name" className="mb-1 block text-xs font-bold text-tf-dark">
              Nom sur la carte
            </label>
            <input
              id="card-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jean Dupont"
              className="w-full rounded-xl border border-tf-grey-pastel/60 bg-tf-white px-3 py-2.5 text-sm font-medium text-tf-dark placeholder:text-tf-grey focus:border-tf-grey/50 focus:outline-none focus:ring-2 focus:ring-tf-grey/20"
              autoComplete="cc-name"
            />
          </div>

          <div>
            <label htmlFor="card-number" className="mb-1 block text-xs font-bold text-tf-dark">
              Numéro de carte
            </label>
            <input
              id="card-number"
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
              <label htmlFor="card-expiry" className="mb-1 block text-xs font-bold text-tf-dark">
                Expiration
              </label>
              <input
                id="card-expiry"
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
              <label htmlFor="card-cvv" className="mb-1 block text-xs font-bold text-tf-dark">
                CVV
              </label>
              <input
                id="card-cvv"
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
            <Button
              type="button"
              variant="ghost"
              className="flex-1 rounded-xl"
              onClick={onCancel}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 rounded-xl"
              disabled={!isValid || processing}
            >
              {processing ? 'Traitement…' : `Payer • +${total} jetons`}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
