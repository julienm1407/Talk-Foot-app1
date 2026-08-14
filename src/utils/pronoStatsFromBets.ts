import type { Bet } from '../types/bet'
import { buildCdmBetaBadge } from './cdmBetaParticipant'

export type PronoHubStats = {
  total: number
  decided: number
  won: number
  accuracy: number
  points: number
  streak: number
  fav: { name: string; count: number } | null
}

export type PronoBadge = {
  kind: 'starter' | 'beta' | 'predictor' | 'accuracy' | 'streak' | 'league' | 'invincible'
  label: string
  hint: string
  tone?: 'neutral' | 'live' | 'upcoming'
  className?: string
}

export type PronoProgress = {
  predictor: { label: string; cur: number; next: number; pct: number }
  accuracy: { label: string; cur: number; next: number; pct: number }
  streak: { label: string; cur: number; next: number; pct: number }
}

/** Stats paris réels — profil, pronostic, classement. */
export function computePronoHubStats(bets: Bet[]): PronoHubStats {
  const active = bets.filter((b) => b.status !== 'cancelled')
  const total = active.length
  const decided = active.filter((b) => b.status === 'won' || b.status === 'lost')
  const won = decided.filter((b) => b.status === 'won').length
  const accuracy = decided.length ? Math.round((won / decided.length) * 100) : 0
  const points = active
    .filter((b) => b.status === 'won')
    .reduce((sum, b) => sum + Math.max(0, (b.payout ?? 0) - (b.stake ?? 0)), 0)

  const settledNewestFirst = [...decided].sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
  )
  let streak = 0
  for (const b of settledNewestFirst) {
    if (b.status !== 'won') break
    streak += 1
  }

  const byComp = new Map<string, { name: string; count: number }>()
  for (const b of active) {
    const name = b.matchLabel?.competition?.trim()
    if (!name) continue
    const existing = byComp.get(name)
    if (existing) existing.count += 1
    else byComp.set(name, { name, count: 1 })
  }
  const fav = Array.from(byComp.values()).sort((a, b) => b.count - a.count)[0] ?? null

  return { total, decided: decided.length, won, accuracy, points, streak, fav }
}

export function buildPronoBadges(
  stats: PronoHubStats,
  light: boolean,
  opts?: { cdmBetaParticipant?: boolean },
): PronoBadge[] {
  const b: PronoBadge[] = []

  if (opts?.cdmBetaParticipant) {
    b.push(buildCdmBetaBadge(light))
  }

  if (stats.total >= 5) {
    b.push({
      kind: 'predictor',
      label: 'Pronostiqueur',
      hint: '5 pronos enregistrés',
      className: light
        ? 'border-blue-200 bg-blue-50 text-blue-700'
        : 'border-blue-400/30 bg-blue-950/50 text-sky-200',
    })
  }

  if (stats.accuracy >= 60) {
    b.push({
      kind: 'accuracy',
      label: `Précision ${stats.accuracy}%`,
      hint: 'Bon taux de réussite',
      className: light
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-emerald-400/30 bg-emerald-950/45 text-emerald-200',
    })
  }

  if (stats.streak >= 5) {
    b.push({
      kind: 'invincible',
      label: 'Invaincu',
      hint: `${stats.streak} victoires d'affilée`,
      className: light
        ? 'border-violet-200 bg-violet-50 text-violet-800'
        : 'border-violet-400/30 bg-violet-950/45 text-violet-200',
    })
  } else if (stats.streak >= 2) {
    b.push({
      kind: 'streak',
      label: `Série x${stats.streak}`,
      hint: 'Victoires consécutives',
      className: light
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-amber-400/30 bg-amber-950/45 text-amber-200',
    })
  }

  if (stats.fav) {
    b.push({
      kind: 'league',
      label: `Fan de ${stats.fav.name}`,
      hint: 'Compétition la plus pronostiquée',
      className: light
        ? 'border-slate-200/80 bg-slate-50 text-slate-800'
        : 'border-white/10 bg-white/[0.06] text-sky-200/95',
    })
  }

  return b
}

export function buildPronoProgress(stats: PronoHubStats): PronoProgress {
  const nextPredictor = 10
  const predictorPct = Math.round((Math.min(stats.total, nextPredictor) / nextPredictor) * 100)

  const nextAcc = 75
  const accPct = Math.round((Math.min(stats.accuracy, nextAcc) / nextAcc) * 100)

  const nextStreak = 5
  const streakPct = Math.round((Math.min(stats.streak, nextStreak) / nextStreak) * 100)

  return {
    predictor: { label: 'Niveau pronos', cur: stats.total, next: nextPredictor, pct: predictorPct },
    accuracy: { label: 'Précision', cur: stats.accuracy, next: nextAcc, pct: accPct },
    streak: { label: 'Série', cur: stats.streak, next: nextStreak, pct: streakPct },
  }
}

export function pronoHubStatsFromPublicRow(row: {
  total?: number
  decided?: number
  won?: number
  accuracy?: number
  points?: number
  streak?: number
  top_competition?: string | null
}): PronoHubStats {
  const top = row.top_competition?.trim()
  return {
    total: Number(row.total) || 0,
    decided: Number(row.decided) || 0,
    won: Number(row.won) || 0,
    accuracy: Number(row.accuracy) || 0,
    points: Number(row.points) || 0,
    streak: Number(row.streak) || 0,
    fav: top ? { name: top, count: 1 } : null,
  }
}
