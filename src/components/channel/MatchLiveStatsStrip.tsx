import type { Match } from '../../types/match'
import type { LiveFixtureStatRow } from '../../api/sportMonks'
import { cn } from '../../utils/cn'

function fmtStat(n: number) {
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(1).replace('.', ',')
}

export function MatchLiveStatsStrip({
  match,
  rows,
  loading,
  className,
}: {
  match: Match
  rows: LiveFixtureStatRow[]
  loading?: boolean
  className?: string
}) {
  if (!rows.length && !loading) return null

  const display = rows.slice(0, 10)

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/70 bg-white/90 px-3 py-2 shadow-sm',
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
          Stats match
        </span>
        {loading ? (
          <span className="text-[10px] font-semibold text-slate-400">Mise à jour…</span>
        ) : null}
      </div>
      {!display.length && loading ? (
        <div className="space-y-2 py-1" aria-hidden>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-slate-200/80" />
          ))}
        </div>
      ) : (
        <div className="max-h-[min(220px,40vh)] overflow-y-auto overscroll-contain pr-0.5">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wide text-slate-500">
                <th className="py-1 pr-2 font-black">Indicateur</th>
                <th className="w-10 py-1 text-center font-black text-slate-700">{match.home.shortName}</th>
                <th className="w-10 py-1 text-center font-black text-slate-700">{match.away.shortName}</th>
              </tr>
            </thead>
            <tbody>
              {display.map((r) => (
                <tr key={r.key} className="border-b border-slate-100/90 last:border-0">
                  <td className="max-w-[9rem] py-1.5 pr-2 font-semibold capitalize text-slate-700">
                    <span className="line-clamp-2">{r.label}</span>
                  </td>
                  <td className="py-1.5 text-center font-black tabular-nums text-slate-900">
                    {fmtStat(r.home)}
                  </td>
                  <td className="py-1.5 text-center font-black tabular-nums text-slate-900">
                    {fmtStat(r.away)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
