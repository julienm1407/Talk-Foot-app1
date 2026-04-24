import type { BigFiveLeagueId, LeagueStandingRow } from '../../data/leagueStandings'
import { cn } from '../../utils/cn'
import { rankingsTeamShort } from '../../utils/rankingsTeamLabel'
import { gaPerMatch, gfPerMatch } from '../../utils/rankingsMetrics'

/**
 * Quadrant attaque / défense : abscisse = buts marqués par match, ordonnée = défense
 * (plus haut = moins de buts encaissés par match). Croise volume offensif et solidité arrière.
 */
export function RankingsScatterQuadrant({
  rows,
  leagueId,
  title = 'Profil attaque / défense',
  subtitle,
  className,
  accent,
}: {
  rows: LeagueStandingRow[]
  leagueId: BigFiveLeagueId
  title?: string
  subtitle?: string
  className?: string
  /** Couleur accent ligue (hex). */
  accent?: string
}) {
  const pool = rows.filter((r) => r.played > 0)
  if (pool.length < 2) {
    return (
      <div className={cn('rounded-2xl border border-tf-grey-pastel/50 bg-white/95 p-4 text-sm text-tf-grey', className)}>
        <p className="font-bold">{title}</p>
        <p className="mt-1 text-xs">Pas assez de données pour ce graphique.</p>
      </div>
    )
  }

  const xs = pool.map((r) => gfPerMatch(r))
  const ysRaw = pool.map((r) => gaPerMatch(r))
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ysRaw)
  const maxY = Math.max(...ysRaw)
  const padX = (maxX - minX || 1) * 0.08
  const padY = (maxY - minY || 1) * 0.08
  const x0 = minX - padX
  const x1 = maxX + padX
  const y0 = minY - padY
  const y1 = maxY + padY
  const midX = (x0 + x1) / 2
  const midY = (y0 + y1) / 2

  const toLeft = (gf: number) => ((gf - x0) / (x1 - x0)) * 100
  /** Moins de buts encaissés / match → plus haut sur le graphique. */
  const toBottom = (ga: number) => (1 - (ga - y0) / (y1 - y0)) * 100

  return (
    <div className={cn('rounded-2xl border border-tf-grey-pastel/50 bg-white/95 p-3 sm:p-3.5', className)}>
      <h3 className="text-[10px] font-black uppercase tracking-[0.12em] text-tf-grey">{title}</h3>
      {subtitle ? <p className="mt-0.5 text-[10px] font-semibold text-tf-grey">{subtitle}</p> : null}
      <div className="relative mx-auto mt-2 h-40 w-full max-w-lg sm:h-44">
        <div className="absolute inset-0 rounded-xl border border-tf-grey-pastel/40 bg-gradient-to-br from-slate-50/90 to-white">
          <div
            className="pointer-events-none absolute border-tf-grey-pastel/35 bg-tf-grey-pastel/10"
            style={{
              left: `${((midX - x0) / (x1 - x0)) * 100}%`,
              top: 0,
              bottom: 0,
              width: 1,
            }}
          />
          <div
            className="pointer-events-none absolute border-tf-grey-pastel/35 bg-tf-grey-pastel/10"
            style={{
              bottom: `${(1 - (midY - y0) / (y1 - y0)) * 100}%`,
              left: 0,
              right: 0,
              height: 1,
            }}
          />
        </div>
        <div className="absolute inset-[10%]">
          {pool.map((r) => {
            const gx = gfPerMatch(r)
            const gy = gaPerMatch(r)
            const left = toLeft(gx)
            const bottom = toBottom(gy)
            return (
              <div
                key={`${r.teamId}-qd`}
                className="absolute flex -translate-x-1/2 translate-y-1/2 flex-col items-center"
                style={{ left: `${left}%`, bottom: `${bottom}%` }}
                title={`${rankingsTeamShort(leagueId, r)} — ${gx.toFixed(2)} buts/m marqués, ${gy.toFixed(2)} encaissés/m`}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full border border-white shadow-sm sm:size-3"
                  style={{ backgroundColor: accent ?? '#0f172a' }}
                />
                <span className="mt-0.5 max-w-[3.5rem] truncate text-[7px] font-black text-tf-dark sm:text-[8px]">
                  {rankingsTeamShort(leagueId, r)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      <p className="mt-1.5 text-center text-[9px] font-semibold leading-snug text-tf-grey">
        Horizontal : buts marqués / match · Vertical : défense (haut = moins encaissé / match)
      </p>
    </div>
  )
}
