import { EMOTE_CATALOG } from '../../data/emotes'
import { cn } from '../../utils/cn'

export function EmotePicker({
  unlockedIds,
  tokens,
  onSelect,
  onUnlock,
  onClose,
  className,
}: {
  unlockedIds: string[]
  tokens: number
  onSelect: (emoteId: string) => void
  onUnlock: (emoteId: string, cost: number) => boolean
  onClose: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'absolute bottom-full left-0 right-0 mb-2 max-h-[220px] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-xl backdrop-blur',
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-black tracking-wide text-slate-700">
          Emotes • {tokens} crédits
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-800"
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {EMOTE_CATALOG.map((e) => {
          const unlocked = unlockedIds.includes(e.id)
          const canAfford = tokens >= e.cost
          return (
            <button
              key={e.id}
              type="button"
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-3 transition focus:outline-none focus:ring-2 focus:ring-tf-grey/40',
                unlocked
                  ? 'border-emerald-200/70 bg-emerald-50/50 hover:bg-emerald-50 hover:ring-2 hover:ring-emerald-300/50'
                  : 'border-slate-200/60 bg-slate-50/50 hover:bg-slate-100',
                !unlocked && !canAfford && 'opacity-60',
              )}
              onClick={() => {
                if (unlocked) {
                  onSelect(e.id)
                  onClose()
                } else if (canAfford) {
                  if (onUnlock(e.id, e.cost)) {
                    onSelect(e.id)
                    onClose()
                  }
                }
              }}
              aria-label={unlocked ? e.label : `${e.label} — débloquer ${e.cost} crédits`}
              title={unlocked ? e.label : `Débloquer pour ${e.cost} crédits`}
            >
              <span className="text-2xl">{e.emoji}</span>
              {!unlocked && (
                <span className="text-[10px] font-bold text-slate-500">
                  {e.cost} 💰
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
