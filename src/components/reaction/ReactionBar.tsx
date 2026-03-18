import type { ReactionType } from '../../types/chat'
import { cn } from '../../utils/cn'
import { reactionMeta } from './reactions'

export function ReactionBar({
  onReact,
}: {
  onReact: (type: ReactionType) => void
}) {
  const items: ReactionType[] = ['flare', 'confetti', 'goal', 'rage']

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((type) => {
        const meta = reactionMeta[type]
        return (
          <button
            key={type}
            type="button"
            onClick={() => onReact(type)}
            className={cn(
              'group inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900',
              'shadow-sm outline-none transition',
              'hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-600/20',
              'active:scale-[0.98]',
            )}
            aria-label={`Réagir avec ${meta.label}`}
            title={`${meta.emoji} ${meta.label} • ${meta.hint}`}
          >
            <span className="text-base leading-none" aria-hidden="true">
              {meta.emoji}
            </span>
            <span className="hidden sm:inline">{meta.label}</span>
          </button>
        )
      })}
    </div>
  )
}

