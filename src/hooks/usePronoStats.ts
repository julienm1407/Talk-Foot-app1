import { useMemo } from 'react'
import { mockPredictions } from '../data/predictions'
import { useAppearance } from '../contexts/AppearanceContext'

export function usePronoStats() {
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  const predictions = useMemo(() => {
    return [...mockPredictions].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    )
  }, [])

  const stats = useMemo(() => {
    const total = predictions.length
    const decided = predictions.filter((p) => p.outcome !== 'pending')
    const won = decided.filter((p) => p.outcome === 'won').length
    const accuracy = decided.length ? Math.round((won / decided.length) * 100) : 0
    const points = predictions.reduce((sum, p) => sum + (p.points ?? 0), 0)

    let streak = 0
    for (const p of predictions) {
      if (p.outcome !== 'won') break
      streak += 1
    }

    const byComp = new Map<string, { name: string; count: number }>()
    for (const p of predictions) {
      const key = p.match.competition.id
      const existing = byComp.get(key)
      if (existing) existing.count += 1
      else byComp.set(key, { name: p.match.competition.name, count: 1 })
    }
    const fav = Array.from(byComp.values()).sort((a, b) => b.count - a.count)[0]

    return { total, decided: decided.length, won, accuracy, points, streak, fav }
  }, [predictions])

  const badges = useMemo(() => {
    const b: Array<{
      kind:
        | 'starter'
        | 'beta'
        | 'predictor'
        | 'accuracy'
        | 'streak'
        | 'league'
      label: string
      hint: string
      tone?: 'neutral' | 'live' | 'upcoming'
      className?: string
    }> = []

    b.push({
      kind: 'starter',
      label: 'Supporter',
      hint: 'Compte de départ',
      tone: 'neutral',
    })
    b.push({
      kind: 'beta',
      label: 'Beta',
      hint: 'Accès anticipé',
      tone: 'upcoming',
    })

    if (stats.total >= 5)
      b.push({
        kind: 'predictor',
        label: 'Pronostiqueur',
        hint: '5 pronos enregistrés',
        className: L
          ? 'border-blue-200 bg-blue-50 text-blue-700'
          : 'border-blue-400/30 bg-blue-950/50 text-sky-200',
      })

    if (stats.accuracy >= 60)
      b.push({
        kind: 'accuracy',
        label: `Précision ${stats.accuracy}%`,
        hint: 'Bon taux de réussite',
        className: L
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-emerald-400/30 bg-emerald-950/45 text-emerald-200',
      })

    if (stats.streak >= 2)
      b.push({
        kind: 'streak',
        label: `Série x${stats.streak}`,
        hint: 'Victoires consécutives',
        className: L
          ? 'border-amber-200 bg-amber-50 text-amber-800'
          : 'border-amber-400/30 bg-amber-950/45 text-amber-200',
      })

    if (stats.fav)
      b.push({
        kind: 'league',
        label: `Fan de ${stats.fav.name}`,
        hint: 'Compétition la plus pronostiquée',
        className: L
          ? 'border-slate-200/80 bg-slate-50 text-slate-800'
          : 'border-white/10 bg-white/[0.06] text-sky-200/95',
      })

    return b
  }, [stats, L])

  const progress = useMemo(() => {
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
  }, [stats])

  return { predictions, stats, badges, progress }
}
