import type { ReactionEvent, ReactionType } from '../../types/chat'
import { reactionMeta } from './reactions'

export function ReactionSummary({
  reactions,
}: {
  reactions: ReactionEvent[]
}) {
  const counts = reactions.reduce<Record<ReactionType, number>>(
    (acc, r) => {
      acc[r.type] = (acc[r.type] ?? 0) + 1
      return acc
    },
    { flare: 0, confetti: 0, goal: 0, rage: 0 },
  )

  const items: ReactionType[] = ['flare', 'confetti', 'goal', 'rage']

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((t) => (
        <div
          key={t}
          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/70"
          aria-label={`${reactionMeta[t].label} count`}
        >
          <span aria-hidden="true">{reactionMeta[t].emoji}</span>
          <span className="tabular-nums">{counts[t]}</span>
        </div>
      ))}
    </div>
  )
}

