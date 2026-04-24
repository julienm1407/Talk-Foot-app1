import type { LeagueStandingRow } from '../../data/leagueStandings'
import { rankingsTeamShort } from '../../utils/rankingsTeamLabel'
import { cn } from '../../utils/cn'
import {
  formWindowPoints,
  gaPerMatch,
  gfPerMatch,
  ppg,
} from '../../utils/rankingsMetrics'

const chip =
  'rounded-xl border border-tf-grey-pastel/45 bg-white/95 px-2 py-1.5 shadow-sm sm:px-2.5'

/** Bandeau KPI compact (une ligne visuelle, wrap) — évite les grosses cartes podium. */
export function StandingsInsightsStrip({
  leagueId,
  rows,
  className,
}: {
  leagueId: string
  rows: LeagueStandingRow[]
  className?: string
}) {
  if (!rows.length) return null

  const sorted = [...rows].sort((a, b) => a.rank - b.rank)
  const top3 = sorted.slice(0, 3)
  const pool = sorted.slice(0, Math.min(10, sorted.length))
  const sumPts = pool.reduce((a, r) => a + r.points, 0)
  const sumGf = pool.reduce((a, r) => a + r.gf, 0)
  const sumGa = pool.reduce((a, r) => a + r.ga, 0)
  const sumPl = pool.reduce((a, r) => a + Math.max(1, r.played), 0)
  const avgPtsTeam = pool.length ? sumPts / pool.length : 0
  const avgGfPm = pool.length && sumPl ? sumGf / sumPl : 0
  const avgGaPm = pool.length && sumPl ? sumGa / sumPl : 0

  const playable = sorted.filter((r) => r.played > 0)
  const bestAtk =
    playable.length > 0
      ? playable.reduce((a, b) => (gfPerMatch(b) > gfPerMatch(a) ? b : a))
      : null
  const bestDef =
    playable.length > 0
      ? playable.reduce((a, b) => (gaPerMatch(b) < gaPerMatch(a) ? b : a))
      : null
  const bestForm =
    playable.length > 0
      ? playable.reduce((a, b) =>
          formWindowPoints(b.form, 5) > formWindowPoints(a.form, 5) ? b : a,
        )
      : null

  const fourth = sorted.find((r) => r.rank === 4) ?? sorted[3]
  const leader = sorted[0]
  const gap14 =
    leader && fourth ? Math.max(0, leader.points - fourth.points) : null

  return (
    <div
      className={cn(
        'flex flex-wrap items-stretch gap-2 rounded-2xl border border-[color:var(--tf-c30-border)] bg-[color:color-mix(in_srgb,var(--tf-c30-surface-soft)_55%,transparent)] p-2 sm:gap-2.5 sm:p-2.5',
        className,
      )}
    >
      {top3.map((r, i) => (
        <div
          key={r.teamId}
          className={cn(
            chip,
            'min-w-[6.5rem] flex-1 sm:min-w-[7.25rem]',
            i === 0 && 'border-emerald-300/50 bg-emerald-50/40',
          )}
        >
          <p className="text-[8px] font-black uppercase leading-none text-tf-app-muted">
            {i === 0 ? '1er' : i === 1 ? '2ᵉ' : '3ᵉ'}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-black leading-tight text-tf-app-fg">
            {rankingsTeamShort(leagueId, r)}
          </p>
          <p className="mt-0.5 text-[10px] font-bold tabular-nums text-tf-app-muted">
            <span className="text-tf-app-fg">{r.points}</span> pts ·{' '}
            <span className="text-emerald-800">{r.played ? ppg(r).toFixed(2) : '—'}</span>/J
          </p>
        </div>
      ))}

      <div className={cn(chip, 'min-w-[8.5rem] flex-1')}>
        <p className="text-[8px] font-black uppercase text-tf-app-muted">Top {pool.length} moy.</p>
        <p className="mt-0.5 text-[10px] font-semibold leading-snug text-tf-app-fg">
          <span className="font-black text-sky-600">{avgPtsTeam.toFixed(1).replace('.', ',')}</span> pts/éq. ·{' '}
          <span className="font-black text-emerald-700">{avgGfPm.toFixed(2).replace('.', ',')}</span> BM/j ·{' '}
          <span className="font-black text-rose-600">{avgGaPm.toFixed(2).replace('.', ',')}</span> BE/j
        </p>
      </div>

      {bestAtk ? (
        <div className={cn(chip, 'min-w-[7.5rem] flex-1')}>
          <p className="text-[8px] font-black uppercase text-tf-app-muted">Attaque</p>
          <p className="mt-0.5 truncate text-[10px] font-black text-tf-app-fg">{rankingsTeamShort(leagueId, bestAtk)}</p>
          <p className="text-[10px] font-bold text-emerald-800">{gfPerMatch(bestAtk).toFixed(2)} BM/j</p>
        </div>
      ) : null}
      {bestDef ? (
        <div className={cn(chip, 'min-w-[7.5rem] flex-1')}>
          <p className="text-[8px] font-black uppercase text-tf-app-muted">Défense</p>
          <p className="mt-0.5 truncate text-[10px] font-black text-tf-app-fg">{rankingsTeamShort(leagueId, bestDef)}</p>
          <p className="text-[10px] font-bold text-sky-600">{gaPerMatch(bestDef).toFixed(2)} BE/j</p>
        </div>
      ) : null}
      {bestForm ? (
        <div className={cn(chip, 'min-w-[7.5rem] flex-1')}>
          <p className="text-[8px] font-black uppercase text-tf-app-muted">Forme 5j</p>
          <p className="mt-0.5 truncate text-[10px] font-black text-tf-app-fg">{rankingsTeamShort(leagueId, bestForm)}</p>
          <p className="text-[10px] font-bold text-violet-800">
            {formWindowPoints(bestForm.form, 5)}/15 · r.{bestForm.rank}
          </p>
        </div>
      ) : null}

      <div className={cn(chip, 'min-w-[5.5rem]')}>
        <p className="text-[8px] font-black uppercase text-tf-app-muted">1er–4e</p>
        <p className="mt-0.5 text-lg font-black tabular-nums leading-none text-amber-800">
          {gap14 != null ? gap14 : '—'}
        </p>
        <p className="text-[8px] font-semibold text-tf-app-muted">pts d’écart</p>
      </div>
    </div>
  )
}
