import type { BigFiveLeagueId, LeagueStandingRow } from '../../data/leagueStandings'
import { teams } from '../../data/teams'
import { cn } from '../../utils/cn'

function teamShort(leagueId: string, teamId: string) {
  const list = teams[leagueId as keyof typeof teams]
  const t = list?.find((x) => x.id === teamId)
  return t?.shortName ?? teamId.toUpperCase()
}

export function PointsBarChart({
  rows,
  leagueId,
  title,
  className,
}: {
  rows: LeagueStandingRow[]
  leagueId: BigFiveLeagueId
  title: string
  className?: string
}) {
  const top = rows.slice(0, 8)
  const maxPts = Math.max(...top.map((r) => r.points), 1)

  return (
    <div className={cn('rounded-2xl border border-tf-grey-pastel/50 bg-white/95 p-4', className)}>
      <h3 className="text-xs font-black uppercase tracking-[0.15em] text-tf-grey">{title}</h3>
      <p className="mt-1 text-[11px] font-semibold text-tf-grey">Top 8 — points (mock)</p>
      <ul className="mt-4 space-y-2.5" role="list">
        {top.map((r) => {
          const pct = Math.round((r.points / maxPts) * 100)
          return (
            <li key={r.teamId} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                <span className="truncate text-tf-dark">
                  <span className="mr-1.5 font-black text-tf-grey">{r.rank}.</span>
                  {teamShort(leagueId, r.teamId)}
                </span>
                <span className="shrink-0 tabular-nums text-tf-grey">{r.points} pts</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-tf-grey-pastel/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-tf-night to-tf-electric-deep transition-[width] duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
