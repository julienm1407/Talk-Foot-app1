import type { BigFiveLeagueId, LeagueStandingRow } from '../../data/leagueStandings'
import { cn } from '../../utils/cn'
import { rankingsTeamShort } from '../../utils/rankingsTeamLabel'
import { formWindowPoints } from '../../utils/rankingsMetrics'

/**
 * Croise les points totaux (saison) avec les points pris sur les 5 derniers matchs (forme).
 * Permet de repérer les équipes en surchauffe ou au ralenti récent.
 */
export function PointsVsRecentFormChart({
  rows,
  leagueId,
  className,
  accent,
}: {
  rows: LeagueStandingRow[]
  leagueId: BigFiveLeagueId
  className?: string
  accent?: string
}) {
  const pool = rows.filter((r) => r.played > 0)
  if (pool.length < 2) {
    return (
      <div className={cn('rounded-2xl border border-tf-grey-pastel/50 bg-white/95 p-4 text-sm text-tf-grey', className)}>
        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-tf-grey">Saison vs forme récente</h3>
        <p className="mt-1 text-xs">Pas assez de données.</p>
      </div>
    )
  }

  const formPts = pool.map((r) => formWindowPoints(r.form, 5))
  const totPts = pool.map((r) => r.points)
  const minF = Math.min(...formPts)
  const maxF = Math.max(...formPts, 1)
  const minT = Math.min(...totPts)
  const maxT = Math.max(...totPts, 1)
  const pF = (maxF - minF || 1) * 0.12
  const pT = (maxT - minT || 1) * 0.1
  const f0 = minF - pF
  const f1 = maxF + pF
  const t0 = minT - pT
  const t1 = maxT + pT

  const toLeft = (f: number) => ((f - f0) / (f1 - f0)) * 100
  const toBottom = (t: number) => ((t - t0) / (t1 - t0)) * 100

  return (
    <div className={cn('rounded-2xl border border-tf-grey-pastel/50 bg-white/95 p-3 sm:p-3.5', className)}>
      <h3 className="text-[10px] font-black uppercase tracking-[0.12em] text-tf-grey">Saison vs forme récente</h3>
      <p className="mt-0.5 text-[10px] font-semibold leading-snug text-tf-grey">
        Abscisse : pts sur 5j · Ordonnée : pts total
      </p>
      <div className="relative mx-auto mt-2 h-40 w-full max-w-lg sm:h-44">
        <div className="absolute inset-0 rounded-xl border border-tf-grey-pastel/40 bg-gradient-to-t from-violet-50/40 to-white" />
        <div className="absolute inset-[12%]">
          <span className="absolute -left-1 bottom-0 rotate-0 text-[8px] font-bold text-tf-grey">Forme 5j →</span>
          <span className="absolute bottom-full left-0 right-0 text-center text-[8px] font-bold text-tf-grey">Points saison ↑</span>
          {pool.map((r) => {
            const f = formWindowPoints(r.form, 5)
            const left = toLeft(f)
            const bottom = toBottom(r.points)
            return (
              <div
                key={`${r.teamId}-pf`}
                className="absolute flex -translate-x-1/2 translate-y-1/2 flex-col items-center"
                style={{ left: `${left}%`, bottom: `${bottom}%` }}
                title={`${rankingsTeamShort(leagueId, r)} — ${r.points} pts saison, ${f}/15 sur 5 matchs`}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full border border-white shadow sm:size-3"
                  style={{ backgroundColor: accent ?? '#6366f1' }}
                />
                <span className="mt-0.5 max-w-[3.25rem] truncate text-[7px] font-black text-tf-dark sm:text-[8px]">
                  {rankingsTeamShort(leagueId, r)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
