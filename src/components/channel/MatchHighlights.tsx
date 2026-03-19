import type { Highlight } from '../../data/highlights'
import { cn } from '../../utils/cn'

const icon: Record<Highlight['type'], string> = {
  But: '⚽',
  Occasion: '🎯',
  Carton: '🟨',
  VAR: '📺',
  Arrêt: '🧤',
  Info: '📰',
}

const pill: Record<Highlight['type'], string> = {
  But: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Occasion: 'bg-blue-100 text-blue-800 border-blue-200',
  Carton: 'bg-amber-100 text-amber-800 border-amber-200',
  VAR: 'bg-slate-100 text-slate-700 border-slate-200',
  Arrêt: 'bg-violet-100 text-violet-800 border-violet-200',
  Info: 'bg-slate-100 text-slate-700 border-slate-200',
}

const shortTitle: Record<Highlight['type'], string> = {
  But: 'But',
  Occasion: 'Occasion',
  Carton: 'Carton',
  VAR: 'VAR',
  Arrêt: 'Arrêt',
  Info: 'Info',
}

export function MatchHighlights({
  items,
  activeId,
}: {
  items: Highlight[]
  activeId?: string
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200/70 bg-slate-50/50 p-5">
        <p className="text-sm font-semibold text-slate-600">
          Aucun moment enregistré pour l'instant.
        </p>
      </div>
    )
  }

  const sorted = [...items].sort((a, b) => b.minute - a.minute)

  return (
    <ul className="space-y-2" role="list">
      {sorted.map((h, idx) => {
        const title = shortTitle[h.type]
        const detail =
          h.title.trim() && h.title.trim() !== title
            ? `${h.title} — ${h.detail}`
            : h.detail
        const isActive = h.id === activeId

        return (
          <li key={h.id}>
            <div
              className={cn(
                'tf-timeline-in rounded-xl border px-4 py-3 transition-colors',
                isActive
                  ? 'border-blue-300/60 bg-blue-50/70 ring-1 ring-blue-200/50'
                  : 'border-slate-200/60 bg-white/80 hover:bg-white',
              )}
              style={{ animationDelay: `${Math.min(idx * 40, 200)}ms` }}
            >
              <div className="flex gap-3">
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base',
                    isActive ? 'bg-blue-100' : 'bg-slate-100/80',
                  )}
                >
                  {icon[h.type]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black tabular-nums text-slate-500">
                      {h.minute > 0 ? `${h.minute}'` : '—'}
                    </span>
                    <span
                      className={cn(
                        'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold',
                        pill[h.type],
                      )}
                    >
                      {h.type}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {title}
                  </p>
                  <p className="mt-0.5 text-xs font-medium leading-relaxed text-slate-600">
                    {detail}
                  </p>
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
