import type { ReactionType } from '../../types/chat'
import { reactionMeta } from './reactions'

export type FloatingReaction = {
  id: string
  type: ReactionType
  createdAt: number
  xPct: number
  bottomPx: number
}

export function FloatingReactions({
  items,
}: {
  items: FloatingReaction[]
}) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-16 top-0 overflow-hidden"
      aria-hidden="true"
    >
      {items.map((r) => (
        <div
          key={r.id}
          className="tf-float-reaction absolute text-3xl"
          style={
            {
              left: `${r.xPct}%`,
              bottom: `${r.bottomPx}px`,
              transform: 'translateX(-50%)',
            } as React.CSSProperties
          }
        >
          {reactionMeta[r.type].emoji}
        </div>
      ))}
    </div>
  )
}

