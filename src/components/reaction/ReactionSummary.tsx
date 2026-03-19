import type { ReactionEvent, ReactionType } from '../../types/chat'
import { reactionMeta } from './reactions'

export function ReactionSummary({ reactions }: { reactions: ReactionEvent[] }) {
  const counts = reactions.reduce<Record<ReactionType, number>>(
    (acc, r) => {
      acc[r.type] = (acc[r.type] ?? 0) + 1
      return acc
    },
    { flare: 0, confetti: 0, goal: 0, rage: 0 },
  )

  const items: ReactionType[] = ['flare', 'confetti', 'goal', 'rage']
  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-bold tracking-wide text-slate-500">
        Compteur réactions
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {items.map((t) => (
          <div
            key={t}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200/60 bg-white/90 px-2 py-1 text-[11px] font-bold text-slate-700 shadow-sm"
            aria-label={`${reactionMeta[t].label}: ${counts[t]}`}
            title={`${reactionMeta[t].label}: ${counts[t]}`}
          >
            <span aria-hidden="true">{reactionMeta[t].emoji}</span>
            <span className="tabular-nums">{counts[t]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
