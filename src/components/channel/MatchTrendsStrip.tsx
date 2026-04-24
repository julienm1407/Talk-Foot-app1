import type { Match } from '../../types/match'
import type { FixtureTrendDisplayRow } from '../../api/sportMonks'
import { cn } from '../../utils/cn'

export function MatchTrendsStrip({
  match,
  rows,
  loading,
  className,
}: {
  match: Match
  rows: FixtureTrendDisplayRow[]
  loading?: boolean
  className?: string
}) {
  if (!rows.length && !loading) return null

  const display = rows.slice(0, 8)

  return (
    <div
      className={cn(
        'rounded-xl border border-violet-200/70 bg-violet-50/90 px-3 py-2 shadow-sm',
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-700/90">
          Tendances (SportMonks)
        </span>
        {loading ? (
          <span className="text-[10px] font-semibold text-violet-500">Mise à jour…</span>
        ) : null}
      </div>
      {!display.length && loading ? (
        <div className="space-y-2 py-1" aria-hidden>
          {[1, 2].map((i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-violet-200/80" />
          ))}
        </div>
      ) : (
        <div className="max-h-[min(200px,38vh)] overflow-y-auto overscroll-contain pr-0.5">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-violet-200/80 text-[10px] font-black uppercase tracking-wide text-violet-700/85">
                <th className="py-1 pr-2 font-black">Indicateur</th>
                <th className="w-11 py-1 text-center font-black text-violet-900">{match.home.shortName}</th>
                <th className="w-11 py-1 text-center font-black text-violet-900">{match.away.shortName}</th>
              </tr>
            </thead>
            <tbody>
              {display.map((r) => (
                <tr key={r.key} className="border-b border-violet-100/90 last:border-0">
                  <td className="max-w-[9rem] py-1.5 pr-2 font-semibold text-violet-950/90">
                    <span className="line-clamp-2">{r.label}</span>
                  </td>
                  <td className="py-1.5 text-center font-black tabular-nums text-violet-950">{r.home}</td>
                  <td className="py-1.5 text-center font-black tabular-nums text-violet-950">{r.away}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
