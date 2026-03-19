import type { ReactionType } from '../../types/chat'
import { cn } from '../../utils/cn'
import { reactionMeta } from './reactions'

export function ReactionBar({
  onReact,
  tokens = 0,
}: {
  onReact: (type: ReactionType) => void
  tokens?: number
}) {
  const items: ReactionType[] = ['flare', 'confetti', 'goal', 'rage']

  return (
    <div className="space-y-1.5">
      <span className="block text-[10px] font-bold tracking-wide text-tf-grey">
        Réagir
      </span>
      <div className="grid grid-cols-4 gap-1.5">
        {items.map((type) => {
          const meta = reactionMeta[type]
          const cost = meta.cost
          const canAfford = tokens >= cost
          return (
            <button
              key={type}
              type="button"
              onClick={() => canAfford && onReact(type)}
              disabled={!canAfford}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 rounded-lg border px-2 py-1.5 text-xs font-bold shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-tf-grey/30 active:scale-[0.98]',
                canAfford
                  ? 'border-tf-grey-pastel/50 bg-tf-white text-tf-dark hover:border-tf-grey/40 hover:bg-tf-grey-pastel/20'
                  : 'cursor-not-allowed border-tf-grey-pastel/40 bg-tf-grey-pastel/20 text-tf-grey',
              )}
              aria-label={`${meta.label} — ${canAfford ? cost : 'pas assez de crédits'} crédits`}
              title={`${meta.emoji} ${meta.label} — ${cost} crédits`}
            >
              <span className="text-base leading-none" aria-hidden="true">
                {meta.emoji}
              </span>
              <span className="text-[10px] font-bold tabular-nums text-tf-grey">
                {cost} 💰
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
