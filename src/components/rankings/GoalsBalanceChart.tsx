import type { BigFiveLeagueId, LeagueStandingRow } from '../../data/leagueStandings'
import { teams } from '../../data/teams'
import { cn } from '../../utils/cn'

function teamShort(leagueId: string, teamId: string) {
  const list = teams[leagueId as keyof typeof teams]
  const t = list?.find((x) => x.id === teamId)
  return t?.shortName ?? teamId.toUpperCase()
}

export function GoalsBalanceChart({
  rows,
  leagueId,
  className,
}: {
  rows: LeagueStandingRow[]
  leagueId: BigFiveLeagueId
  className?: string
}) {
  const top = rows.slice(0, 6)

  return (
    <div className={cn('rounded-2xl border border-tf-grey-pastel/50 bg-white/95 p-4', className)}>
      <h3 className="text-xs font-black uppercase tracking-[0.15em] text-tf-grey">Buts marqués / encaissés</h3>
      <p className="mt-1 text-[11px] font-semibold text-tf-grey">Top 6 — comparaison (mock)</p>
      <ul className="mt-4 space-y-3" role="list">
        {top.map((r) => (
          <li key={r.teamId}>
            <div className="mb-1 flex justify-between text-[11px] font-black text-tf-dark">
              <span className="truncate">{teamShort(leagueId, r.teamId)}</span>
              <span className="shrink-0 tabular-nums text-tf-grey">
                {r.gf} / {r.ga}
              </span>
            </div>
            <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-lg">
              <div
                className="min-w-[4px] rounded-l-md bg-emerald-500/90"
                style={{ flex: `${r.gf} 1 0` }}
                title={`${r.gf} buts marqués`}
              />
              <div
                className="min-w-[4px] rounded-r-md bg-rose-400/90"
                style={{ flex: `${r.ga} 1 0` }}
                title={`${r.ga} buts encaissés`}
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-4 text-[10px] font-bold text-tf-grey">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-sm bg-emerald-500" /> BM
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-sm bg-rose-400" /> BE
        </span>
      </div>
    </div>
  )
}
