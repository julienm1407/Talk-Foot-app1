import type { LeagueStandingRow } from '../../data/leagueStandings'
import { rankingsTeamShort } from '../../utils/rankingsTeamLabel'
import { cn } from '../../utils/cn'
import { formWindowPoints } from '../../utils/rankingsMetrics'

const pill =
  'inline-flex items-center rounded-full border border-tf-grey-pastel/45 bg-white/95 px-2.5 py-1 text-[11px] font-bold text-tf-app-fg shadow-sm'

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
  const top3 = [...rows]
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      const gdA = a.gf - a.ga
      const gdB = b.gf - b.ga
      if (gdB !== gdA) return gdB - gdA
      return b.gf - a.gf
    })
    .slice(0, 3)
  const playable = sorted.filter((r) => r.played > 0)
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
        'space-y-2 rounded-2xl border border-[color:var(--tf-c30-border)] bg-[color:color-mix(in_srgb,var(--tf-c30-surface-soft)_55%,transparent)] p-2.5',
        className,
      )}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-tf-app-muted">
        Resume classement
      </p>
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {top3.map((r, i) => (
          <span
            key={r.teamId}
            className={cn(
              pill,
              i === 0 && 'border-emerald-300/60 bg-emerald-50/50 text-emerald-900',
            )}
          >
            {i + 1}. {rankingsTeamShort(leagueId, r)} {r.points} pts
          </span>
        ))}
        {bestForm ? (
          <span className={cn(pill, 'border-violet-300/60 bg-violet-50/40 text-violet-900')}>
            Forme: {rankingsTeamShort(leagueId, bestForm)} {formWindowPoints(bestForm.form, 5)}/15
          </span>
        ) : null}
        <span className={cn(pill, 'border-amber-300/60 bg-amber-50/50 text-amber-900')}>
          Ecart 1-4: {gap14 != null ? gap14 : '—'} pts
        </span>
      </div>
    </div>
  )
}
