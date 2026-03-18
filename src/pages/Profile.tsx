import { currentUser } from '../data/users'
import { Avatar } from '../components/ui/Avatar'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { mockPredictions } from '../data/predictions'
import { useMemo } from 'react'
import { formatKickoff } from '../utils/time'
import { ProgressBar } from '../components/ui/ProgressBar'
import { BadgeIllustration } from '../components/profile/BadgeIllustration'
import { useLocalStorageState } from '../hooks/useLocalStorage'
import type { Bet } from '../types/bet'
import { upcomingMatches } from '../data/matches'

export function ProfilePage() {
  const [bets] = useLocalStorageState<Bet[]>('talkfoot.bets.v1', [])

  const predictions = useMemo(() => {
    return [...mockPredictions].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    )
  }, [])

  const betsView = useMemo(() => {
    const matchesById = new Map(upcomingMatches.map((m) => [m.id, m]))
    const open = bets.filter((b) => b.status === 'open')
    const settled = bets.filter((b) => b.status !== 'open')
    const lastOpen = open.slice(0, 8)
    const lastSettled = settled.slice(0, 12)

    const marketLabel = (m: Bet['market']) => {
      if (m === 'next_goal') return 'Prochaine équipe à marquer'
      if (m === 'first_goal') return 'Première équipe à marquer'
      if (m === 'result_1x2') return '1N2'
      if (m === 'over25') return '+2,5 buts'
      if (m === 'exact_score') return 'Score exact'
      return m
    }
    const selectionLabel = (b: Bet, matchId: string) => {
      const match = matchesById.get(matchId)
      const home = match?.home.shortName ?? 'HOME'
      const away = match?.away.shortName ?? 'AWAY'
      const s = b.selection
      if (s === 'home') return home
      if (s === 'away') return away
      if (s === 'draw') return 'Nul'
      if (s === 'over') return 'Over'
      if (s === 'under') return 'Under'
      return s
    }

    const matchLine = (matchId: string) => {
      const m = matchesById.get(matchId)
      if (!m) return { title: 'Match inconnu', sub: '' }
      return {
        title: `${m.home.shortName} — ${m.away.shortName}`,
        sub: `${m.competition.shortName} • ${formatKickoff(m.kickoffAt)}`,
      }
    }

    return { open, settled, lastOpen, lastSettled, marketLabel, selectionLabel, matchLine }
  }, [bets])

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
        className: 'border-blue-200 bg-blue-50 text-blue-700',
      })

    if (stats.accuracy >= 60)
      b.push({
        kind: 'accuracy',
        label: `Précision ${stats.accuracy}%`,
        hint: 'Bon taux de réussite',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      })

    if (stats.streak >= 2)
      b.push({
        kind: 'streak',
        label: `Série x${stats.streak}`,
        hint: 'Victoires consécutives',
        className: 'border-amber-200 bg-amber-50 text-amber-800',
      })

    if (stats.fav)
      b.push({
        kind: 'league',
        label: `Fan de ${stats.fav.name}`,
        hint: 'Compétition la plus pronostiquée',
        className: 'border-slate-200 bg-white/70 text-slate-700',
      })

    return b
  }, [stats])

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

  return (
    <div className="space-y-5">
      <div className="px-1">
        <div className="text-[11px] font-black tracking-[0.18em] text-slate-700/70">
          PROFIL
        </div>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          {currentUser.username}
        </h2>
        <p className="mt-1 text-sm font-semibold text-slate-700/70">
          Badges + historique de tes prédictions (mock).
        </p>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar
              seed={currentUser.avatarSeed}
              accent={currentUser.accent}
              alt={currentUser.username}
              className="size-12 rounded-[22px]"
            />
            <div>
              <div className="text-base font-black text-slate-900">
                @{currentUser.username}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {badges.slice(0, 2).map((b) => (
                  <Badge
                    key={b.label}
                    tone={b.tone ?? 'neutral'}
                    className={b.className}
                    title={b.hint}
                  >
                    {b.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Button variant="soft" aria-label="Modifier le profil (placeholder)">
            Modifier
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <Stat label="Pronos" value={`${stats.total}`} hint="Au total" />
          <Stat
            label="Précision"
            value={`${stats.accuracy}%`}
            hint={`${stats.won}/${stats.decided} validés`}
          />
          <Stat
            label="Série"
            value={`x${stats.streak}`}
            hint="Victoires d’affilée"
          />
          <Stat label="Points" value={`${stats.points}`} hint="Score pronos" />
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-black tracking-[0.18em] text-slate-700/70">
              MES PARIS
            </div>
            <div className="mt-1 text-lg font-black tracking-tight text-slate-900">
              En cours & validés
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700/70">
            <Badge className="border-slate-200 bg-white/70 text-slate-700">
              En cours: {betsView.open.length}
            </Badge>
            <Badge className="border-slate-200 bg-white/70 text-slate-700">
              Validés: {betsView.settled.length}
            </Badge>
          </div>
        </div>

        {bets.length ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-black text-slate-900">En cours</div>
                <Badge className="border-blue-200 bg-blue-50 text-blue-700">
                  {betsView.open.length}
                </Badge>
              </div>
              {betsView.lastOpen.length ? (
                <div className="mt-3 divide-y divide-slate-200/70 rounded-3xl border border-slate-200/70 bg-white/70">
                  {betsView.lastOpen.map((b) => {
                    const m = betsView.matchLine(b.matchId)
                    return (
                      <div key={b.id} className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-xs font-black text-slate-900">
                              {m.title}
                            </div>
                            {m.sub ? (
                              <div className="mt-0.5 text-[11px] font-semibold text-slate-700/70">
                                {m.sub}
                              </div>
                            ) : null}
                            <div className="mt-2 text-xs font-bold text-slate-800">
                              {betsView.marketLabel(b.market)} •{' '}
                              {betsView.selectionLabel(b, b.matchId)} • {b.stake}j • x
                              {b.odds.toFixed(2).replace('.', ',')}
                            </div>
                          </div>
                          <Badge className="border-blue-200 bg-blue-50 text-blue-700">
                            En cours
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-3 text-sm font-semibold text-slate-700/70">
                  Aucun pari en cours.
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-black text-slate-900">Validés</div>
                <Badge className="border-slate-200 bg-white/70 text-slate-700">
                  {betsView.settled.length}
                </Badge>
              </div>
              {betsView.lastSettled.length ? (
                <div className="mt-3 divide-y divide-slate-200/70 rounded-3xl border border-slate-200/70 bg-white/70">
                  {betsView.lastSettled.map((b) => {
                    const m = betsView.matchLine(b.matchId)
                    const statusBadge =
                      b.status === 'won'
                        ? {
                            cls: 'border-emerald-200 bg-emerald-50 text-emerald-800',
                            label: `Gagné +${b.payout ?? 0}`,
                          }
                        : b.status === 'lost'
                          ? {
                              cls: 'border-rose-200 bg-rose-50 text-rose-800',
                              label: 'Perdu',
                            }
                          : {
                              cls: 'border-slate-200 bg-white/70 text-slate-700',
                              label: 'Annulé',
                            }
                    return (
                      <div key={b.id} className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-xs font-black text-slate-900">
                              {m.title}
                            </div>
                            {m.sub ? (
                              <div className="mt-0.5 text-[11px] font-semibold text-slate-700/70">
                                {m.sub}
                              </div>
                            ) : null}
                            <div className="mt-2 text-xs font-bold text-slate-800">
                              {betsView.marketLabel(b.market)} •{' '}
                              {betsView.selectionLabel(b, b.matchId)} • {b.stake}j
                            </div>
                          </div>
                          <Badge className={statusBadge.cls}>{statusBadge.label}</Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-3 text-sm font-semibold text-slate-700/70">
                  Aucun pari validé pour le moment.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3 text-sm font-semibold text-slate-700/70">
            Pas encore de paris. Lance un match live et tente un prono.
          </div>
        )}
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-black tracking-[0.18em] text-slate-700/70">
              BADGES PRONOS
            </div>
            <div className="mt-1 text-lg font-black tracking-tight text-slate-900">
              Tes badges
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-700/70">
            {badges.length} badges
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((b) => (
            <div
              key={b.label}
              className="rounded-3xl border border-slate-200/80 bg-white/70 p-4"
              title={b.hint}
            >
              <div className="flex items-start gap-3">
                <BadgeIllustration kind={b.kind} />
                <div className="min-w-0">
                  <div className="text-sm font-black text-slate-900">
                    {b.label}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-700/70">
                    {b.hint}
                  </div>
                  <div className="mt-2">
                    <Badge
                      tone={b.tone ?? 'neutral'}
                      className={b.className}
                    >
                      Débloqué
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-black tracking-[0.18em] text-slate-700/70">
              PROGRESSION
            </div>
            <div className="mt-1 text-lg font-black tracking-tight text-slate-900">
              Prochains paliers
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-700/70">
            Gagne des badges en jouant
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-sm font-black text-slate-900">
                {progress.predictor.label}
              </div>
              <div className="text-xs font-bold text-slate-700/70">
                {progress.predictor.cur}/{progress.predictor.next}
              </div>
            </div>
            <div className="mt-2">
              <ProgressBar value={progress.predictor.pct} tone="blue" />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-sm font-black text-slate-900">
                {progress.accuracy.label}
              </div>
              <div className="text-xs font-bold text-slate-700/70">
                {progress.accuracy.cur}/{progress.accuracy.next}%
              </div>
            </div>
            <div className="mt-2">
              <ProgressBar value={progress.accuracy.pct} tone="emerald" />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-sm font-black text-slate-900">
                {progress.streak.label}
              </div>
              <div className="text-xs font-bold text-slate-700/70">
                {progress.streak.cur}/{progress.streak.next}
              </div>
            </div>
            <div className="mt-2">
              <ProgressBar value={progress.streak.pct} tone="amber" />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-black tracking-[0.18em] text-slate-700/70">
              HISTORIQUE
            </div>
            <div className="mt-1 text-lg font-black tracking-tight text-slate-900">
              Prédictions récentes
            </div>
          </div>
          <Button
            variant="ghost"
            className="h-10 rounded-2xl"
            aria-label="Voir plus (placeholder)"
          >
            Voir plus
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          {predictions.map((p) => (
            <div
              key={p.id}
              className="rounded-3xl border border-slate-200/80 bg-white/70 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-black text-slate-900">
                      {p.match.home.shortName} – {p.match.away.shortName}
                    </div>
                    <Badge
                      className={
                        p.outcome === 'won'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : p.outcome === 'lost'
                            ? 'border-rose-200 bg-rose-50 text-rose-700'
                            : 'border-slate-200 bg-white/70 text-slate-700'
                      }
                    >
                      {p.outcome === 'won'
                        ? 'Gagné'
                        : p.outcome === 'lost'
                          ? 'Perdu'
                          : 'En attente'}
                    </Badge>
                    <Badge tone="upcoming" title={p.match.competition.name}>
                      {p.match.competition.shortName}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-700/70">
                    Coup d’envoi {formatKickoff(p.match.kickoffAt)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    className="border-slate-200 bg-white/70 text-slate-900"
                    title="Score prédit"
                  >
                    Prono {p.predictedScore.home}-{p.predictedScore.away}
                  </Badge>
                  <Badge
                    className="border-slate-200 bg-white/70 text-slate-900"
                    title="Score réel (si dispo)"
                  >
                    Réel{' '}
                    {p.actualScore
                      ? `${p.actualScore.home}-${p.actualScore.away}`
                      : '—'}
                  </Badge>
                  <Badge
                    className={
                      p.points > 0
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white/70 text-slate-700'
                    }
                    title="Points gagnés"
                  >
                    +{p.points}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-4">
      <div className="text-xs font-semibold tracking-wide text-slate-700/70">
        {label}
      </div>
      <div className="mt-1 text-2xl font-black tracking-tight text-slate-900">
        {value}
      </div>
      <div className="mt-1 text-xs font-semibold text-slate-700/70">{hint}</div>
    </div>
  )
}

