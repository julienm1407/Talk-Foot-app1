import type { Highlight } from '../../data/highlights'
import { formatGoalScorerLabel } from '../../utils/liveFootballOdds'
import { cn } from '../../utils/cn'

const icon: Record<Highlight['type'], string> = {
  But: '⚽',
  Occasion: '🎯',
  Carton: '🟨',
  VAR: '📺',
  Arrêt: '🧤',
  Info: '📰',
}

const pillLight: Record<Highlight['type'], string> = {
  But: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Occasion: 'bg-blue-100 text-blue-800 border-blue-200',
  Carton: 'bg-amber-100 text-amber-800 border-amber-200',
  VAR: 'bg-slate-100 text-slate-700 border-slate-200',
  Arrêt: 'bg-violet-100 text-violet-800 border-violet-200',
  Info: 'bg-slate-100 text-slate-700 border-slate-200',
}

const pillChannel: Record<Highlight['type'], string> = {
  But: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
  Occasion: 'border-sky-400/35 bg-sky-500/15 text-sky-100',
  Carton: 'border-amber-400/40 bg-amber-500/15 text-amber-100',
  VAR: 'border-violet-400/35 bg-violet-500/15 text-violet-100',
  Arrêt: 'border-fuchsia-400/35 bg-fuchsia-500/15 text-fuchsia-100',
  Info: 'border-[#4a6f94]/55 bg-[#0e2a45] text-sky-100',
}

const shortTitle: Record<Highlight['type'], string> = {
  But: 'But',
  Occasion: 'Occasion',
  Carton: 'Carton',
  VAR: 'VAR',
  Arrêt: 'Arrêt',
  Info: 'Info',
}

function highlightDetailText(h: Highlight): string {
  if (h.type === 'But' && h.scorerName) {
    const scorerLine = formatGoalScorerLabel(h.scorerName, h.assistName)
    const raw = String(h.detail ?? '').trim()
    if (raw && !raw.toLowerCase().includes(scorerLine.toLowerCase())) {
      return raw
    }
    return scorerLine
  }
  const title = shortTitle[h.type]
  if (h.title.trim() && h.title.trim() !== title) {
    return `${h.title} — ${h.detail}`
  }
  return h.detail
}

export function MatchHighlights({
  items,
  activeId,
  variant = 'light',
}: {
  items: Highlight[]
  activeId?: string
  variant?: 'light' | 'channel'
}) {
  const channel = variant === 'channel'
  const pill = channel ? pillChannel : pillLight

  if (items.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl border border-dashed p-5',
          channel ? 'border-[#3a6690]/50 bg-[#0a1f35]/60' : 'border-slate-200/70 bg-slate-50/50',
        )}
      >
        <p className={cn('text-sm font-semibold', channel ? 'text-sky-200/80' : 'text-slate-600')}>
          Aucune action enregistrée pour l&apos;instant.
        </p>
      </div>
    )
  }

  const sorted = [...items].sort((a, b) => {
    if (b.minute !== a.minute) return b.minute - a.minute
    const ord = (b.order ?? 0) - (a.order ?? 0)
    if (ord !== 0) return ord
    return b.id.localeCompare(a.id)
  })

  return (
    <ul className="space-y-2" role="list">
      {sorted.map((h, idx) => {
        const title = shortTitle[h.type]
        const detail = highlightDetailText(h)
        const isActive = h.id === activeId

        return (
          <li key={h.id}>
            <div
              className={cn(
                'tf-timeline-in rounded-xl border px-3 py-2.5 transition-colors sm:px-4 sm:py-3',
                channel
                  ? isActive
                    ? 'border-cyan-400/50 bg-cyan-500/10 ring-1 ring-cyan-400/30'
                    : 'border-[#3a6690]/45 bg-[#0a1f35]/80 hover:bg-[#0f2841]'
                  : isActive
                    ? 'border-blue-300/60 bg-blue-50/70 ring-1 ring-blue-200/50'
                    : 'border-slate-200/60 bg-white/80 hover:bg-white',
              )}
              style={{ animationDelay: `${Math.min(idx * 40, 200)}ms` }}
            >
              <div className="flex gap-3">
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base',
                    channel
                      ? isActive
                        ? 'bg-cyan-500/20'
                        : 'bg-[#0e2a45]'
                      : isActive
                        ? 'bg-blue-100'
                        : 'bg-slate-100/80',
                  )}
                >
                  {icon[h.type]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'text-xs font-black tabular-nums',
                        channel ? 'text-sky-300/90' : 'text-slate-500',
                      )}
                    >
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
                  <p
                    className={cn(
                      'mt-1 text-sm font-black',
                      channel ? 'text-sky-50' : 'text-slate-900',
                    )}
                  >
                    {title}
                  </p>
                  <p
                    className={cn(
                      'mt-0.5 text-xs font-medium leading-relaxed',
                      channel ? 'text-sky-100/90' : 'text-slate-600',
                    )}
                  >
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
