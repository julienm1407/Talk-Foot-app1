import type { Highlight } from '../../data/highlights'
import { Card } from '../ui/Card'

const icon: Record<Highlight['type'], string> = {
  But: '⚽',
  Occasion: '🎯',
  Carton: '🟨',
  VAR: '📺',
  Arrêt: '🧤',
  Info: '📰',
}

const pill: Record<Highlight['type'], string> = {
  But: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Occasion: 'bg-blue-50 text-blue-700 ring-blue-200',
  Carton: 'bg-amber-50 text-amber-700 ring-amber-200',
  VAR: 'bg-slate-50 text-slate-700 ring-slate-200',
  Arrêt: 'bg-violet-50 text-violet-700 ring-violet-200',
  Info: 'bg-slate-50 text-slate-700 ring-slate-200',
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
      <Card elevation="none" className="border-dashed bg-white/60 p-5">
        <div className="text-sm font-black text-slate-900">Moments forts</div>
        <div className="mt-1 text-sm font-semibold text-slate-600">
          Rien à signaler pour l’instant (mock).
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm font-black text-slate-900">Moments forts</div>
          <div className="mt-0.5 text-xs font-semibold text-slate-600">
            Résumé façon OneFootball (simulation).
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {items
          .slice()
          .sort((a, b) => b.minute - a.minute)
          .map((h) => {
            const title = shortTitle[h.type]
            const detail =
              h.title.trim() && h.title.trim() !== title
                ? `${h.title} — ${h.detail}`
                : h.detail
            return (
            <Card
              key={h.id}
              elevation="none"
              className={
                h.id === activeId
                  ? 'bg-white/85 px-5 py-4 ring-2 ring-blue-600/20'
                  : 'bg-white/75 px-5 py-4'
              }
            >
              <div className="grid grid-cols-[40px_1fr] items-start gap-3">
                <div className="grid size-10 place-items-center rounded-3xl bg-gradient-to-br from-blue-700 to-sky-400 text-base font-black text-white shadow-sm">
                  <span aria-hidden="true">{icon[h.type]}</span>
                </div>
                <div className="min-w-0 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black tabular-nums text-slate-500">
                      {h.minute > 0 ? `${h.minute}'` : '—'}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${pill[h.type]}`}
                    >
                      {h.type}
                    </span>
                  </div>
                  <div className="mt-1 text-[15px] font-black tracking-tight text-slate-900">
                    {title}
                  </div>
                  <div className="mt-1 w-full text-[13px] font-semibold leading-relaxed text-slate-600/90">
                    {detail}
                  </div>
                </div>
              </div>
            </Card>
          )})}
      </div>
    </div>
  )
}

