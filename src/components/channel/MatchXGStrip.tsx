import type { Match } from '../../types/match'
import type { SmMatchXGTotals } from '../../api/sportMonks'
import { cn } from '../../utils/cn'

function fmtXg(n: number) {
  return n.toFixed(1).replace('.', ',')
}

export function MatchXGStrip({
  match,
  xg,
  loading,
  className,
}: {
  match: Match
  xg: SmMatchXGTotals | null
  loading?: boolean
  className?: string
}) {
  if (!xg && !loading) return null

  const total = xg ? Math.max(0.05, xg.home + xg.away) : 1
  const homePct = xg ? Math.round((xg.home / total) * 100) : 50
  const awayPct = 100 - homePct

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/70 bg-white/90 px-3 py-2 shadow-sm',
        className,
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
          xG (match)
        </span>
        {loading ? (
          <span className="text-[10px] font-semibold text-slate-400">Chargement…</span>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-3 text-xs font-black tabular-nums text-slate-800">
        <span className="min-w-0 shrink truncate" title={match.home.name}>
          {match.home.shortName}
        </span>
        <span className="shrink-0 text-slate-600">
          {xg ? (
            <>
              <span className="text-slate-900">{fmtXg(xg.home)}</span>
              <span className="mx-1 font-bold text-slate-400">—</span>
              <span className="text-slate-900">{fmtXg(xg.away)}</span>
            </>
          ) : (
            '…'
          )}
        </span>
        <span className="min-w-0 shrink truncate text-right" title={match.away.name}>
          {match.away.shortName}
        </span>
      </div>
      {xg ? (
        <div
          className="mt-2 flex h-2 overflow-hidden rounded-full bg-slate-100"
          role="img"
          aria-label={`Répartition xG ${fmtXg(xg.home)} à ${fmtXg(xg.away)}`}
        >
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${homePct}%`,
              background: `linear-gradient(90deg, ${match.home.colors.primary}, ${match.home.colors.secondary})`,
            }}
          />
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${awayPct}%`,
              background: `linear-gradient(90deg, ${match.away.colors.secondary}, ${match.away.colors.primary})`,
            }}
          />
        </div>
      ) : loading ? (
        <div className="mt-2 h-2 animate-pulse rounded-full bg-slate-200" aria-hidden />
      ) : null}
    </div>
  )
}
