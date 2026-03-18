import { Card } from './Card'

export function AdSlot({
  title = 'Publicité',
  brand = 'Talk Foot',
  body = 'Emplacement publicitaire (mock).',
  tone = 'blue',
}: {
  title?: string
  brand?: string
  body?: string
  tone?: 'blue' | 'navy' | 'sky'
}) {
  const gradient =
    tone === 'navy'
      ? 'from-[#0b1b3a]/12 via-white/70 to-white/80'
      : tone === 'sky'
        ? 'from-sky-400/18 via-white/70 to-white/80'
        : 'from-blue-600/14 via-white/70 to-white/80'

  return (
    <Card elevation="none" className="overflow-hidden">
      <div className={`bg-gradient-to-br ${gradient} px-5 py-4`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-black tracking-wide text-slate-600">
              {title.toUpperCase()}
            </div>
            <div className="mt-1 text-sm font-black text-slate-900">{brand}</div>
          </div>
          <div className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            Ad
          </div>
        </div>
        <div className="mt-2 text-xs font-semibold text-slate-600">{body}</div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 text-xs font-black text-slate-900 ring-1 ring-slate-200">
          Découvrir
          <span className="text-slate-400">→</span>
        </div>
      </div>
    </Card>
  )
}

