import type { LeagueStandingRow } from '../../data/leagueStandings'
import { rankingsTeamShort } from '../../utils/rankingsTeamLabel'
import { cn } from '../../utils/cn'
import { motion, useReducedMotion } from 'framer-motion'

function ratioPct(num: number, den: number): number {
  if (!Number.isFinite(num) || !Number.isFinite(den) || den <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((num / den) * 100)))
}

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
  const reducedMotion = useReducedMotion()

  const sorted = [...rows].sort((a, b) => a.rank - b.rank)

  const fourth = sorted.find((r) => r.rank === 4) ?? sorted[3]
  const leader = sorted[0]
  const gap14 =
    leader && fourth ? Math.max(0, leader.points - fourth.points) : null
  const second = sorted.find((r) => r.rank === 2) ?? sorted[1] ?? null
  const gap12 =
    leader && second ? Math.max(0, leader.points - second.points) : null

  const bestAttack = [...sorted].sort((a, b) => b.gf - a.gf || a.rank - b.rank)[0] ?? null
  const bestDefense = [...sorted].sort((a, b) => a.ga - b.ga || a.rank - b.rank)[0] ?? null
  const relegationCut = sorted.length >= 18 ? 3 : 2
  const redZone = [...sorted].sort((a, b) => b.rank - a.rank).slice(0, relegationCut)
  const redZonePointsAvg = redZone.length
    ? Math.round(redZone.reduce((acc, r) => acc + r.points, 0) / redZone.length)
    : null
  const totalPlayed = sorted.reduce((acc, r) => acc + Math.max(0, r.played), 0)
  const totalGoals = sorted.reduce((acc, r) => acc + Math.max(0, r.gf), 0)
  const avgGoalsPerTeamGame = totalPlayed > 0 ? totalGoals / totalPlayed : null

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
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <motion.div
          className="rounded-xl border border-[color:var(--tf-c30-border)] bg-[color:color-mix(in_srgb,var(--tf-c30-surface)_70%,var(--tf-c30-surface-soft)_30%)] px-2.5 py-2"
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-[10px] font-black uppercase tracking-wide text-tf-app-fg">Course au titre</p>
          <p className="mt-1 text-xs font-bold text-tf-app-fg">
            1-2: {gap12 != null ? `${gap12} pts` : '—'} ({leader ? rankingsTeamShort(leagueId, leader) : '—'} devant)
          </p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[color:rgb(var(--tf-app-fg-rgb)/0.16)]">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${ratioPct(12 - Math.min(12, gap12 ?? 0), 12)}%` }}
            />
          </div>
        </motion.div>

        <motion.div
          className="rounded-xl border border-[color:var(--tf-c30-border)] bg-[color:color-mix(in_srgb,var(--tf-c30-surface)_70%,var(--tf-c30-surface-soft)_30%)] px-2.5 py-2"
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.03 }}
        >
          <p className="text-[10px] font-black uppercase tracking-wide text-tf-app-fg">Attaque</p>
          <p className="mt-1 text-xs font-bold text-tf-app-fg">
            {bestAttack ? rankingsTeamShort(leagueId, bestAttack) : '—'} ({bestAttack?.gf ?? '—'} BP)
          </p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[color:rgb(var(--tf-app-fg-rgb)/0.16)]">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${ratioPct(bestAttack?.gf ?? 0, leader?.gf ?? bestAttack?.gf ?? 1)}%` }}
            />
          </div>
        </motion.div>

        <motion.div
          className="rounded-xl border border-[color:var(--tf-c30-border)] bg-[color:color-mix(in_srgb,var(--tf-c30-surface)_70%,var(--tf-c30-surface-soft)_30%)] px-2.5 py-2"
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.06 }}
        >
          <p className="text-[10px] font-black uppercase tracking-wide text-tf-app-fg">Defense</p>
          <p className="mt-1 text-xs font-bold text-tf-app-fg">
            {bestDefense ? rankingsTeamShort(leagueId, bestDefense) : '—'} ({bestDefense?.ga ?? '—'} BC)
          </p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[color:rgb(var(--tf-app-fg-rgb)/0.16)]">
            <div
              className="h-full rounded-full bg-sky-500"
              style={{
                width: `${ratioPct(
                  (sorted.reduce((m, r) => Math.max(m, r.ga), 0) || 1) - (bestDefense?.ga ?? 0),
                  sorted.reduce((m, r) => Math.max(m, r.ga), 0) || 1,
                )}%`,
              }}
            />
          </div>
        </motion.div>

        <motion.div
          className="rounded-xl border border-[color:var(--tf-c30-border)] bg-[color:color-mix(in_srgb,var(--tf-c30-surface)_70%,var(--tf-c30-surface-soft)_30%)] px-2.5 py-2"
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.09 }}
        >
          <p className="text-[10px] font-black uppercase tracking-wide text-tf-app-fg">Zone rouge</p>
          <p className="mt-1 text-xs font-bold text-tf-app-fg">
            Moyenne: {redZonePointsAvg != null ? `${redZonePointsAvg} pts` : '—'} · {relegationCut} equipes
          </p>
          <p className="mt-1 text-[11px] font-semibold text-tf-app-muted">
            Ecart 1-4: {gap14 != null ? `${gap14} pts` : '—'}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-tf-app-muted">
            Rythme buts: {avgGoalsPerTeamGame != null ? `${avgGoalsPerTeamGame.toFixed(2)} / match` : '—'}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
