import { Button } from '../ui/Button'
import type { MedalPack } from '../../types/profile'
import { cn } from '../../utils/cn'

export function BoutiquePackGridItem({
  pack,
  onSelect,
  disabled = false,
}: {
  pack: MedalPack
  onSelect: (packId: string) => void
  disabled?: boolean
}) {
  return (
    <div
      className={cn(
        'flex min-h-[280px] flex-col rounded-2xl border p-4 transition',
        pack.popular
          ? 'border-amber-400/50 bg-gradient-to-b from-amber-50/90 to-white shadow-lg ring-2 ring-amber-400/35'
          : 'border-tf-grey-pastel/50 bg-tf-white/95 shadow-sm',
      )}
    >
      {pack.popular ? (
        <div className="mb-1 w-fit rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-amber-950">
          Best-seller
        </div>
      ) : (
        <div className="text-[10px] font-black uppercase tracking-wider text-tf-grey">Recharge €</div>
      )}
      <div className="text-[10px] font-black uppercase tracking-wider text-tf-grey">{pack.tagline}</div>
      <div className="mt-1 font-display text-lg font-black text-tf-dark">{pack.name}</div>
      <div className="mt-2 font-display text-2xl font-black text-amber-900">
        {pack.medals}
        {pack.bonus ? <span className="text-base font-bold text-emerald-600"> +{pack.bonus}</span> : null}{' '}
        <span className="text-base font-bold text-tf-dark">🏅</span>
      </div>
      <div className="mt-1 text-sm font-black text-tf-dark">{pack.priceEur}</div>
      {pack.flavor ? <p className="mt-2 flex-1 text-xs font-medium leading-snug text-tf-grey">{pack.flavor}</p> : null}
      <Button
        variant="primary"
        className="mt-4 w-full rounded-xl text-sm font-black"
        disabled={disabled}
        onClick={() => onSelect(pack.id)}
      >
        Acheter le pack
      </Button>
    </div>
  )
}
