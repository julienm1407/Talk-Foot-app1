import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import { Card } from '../ui/Card'
import { ClubCrest } from '../brand/ClubCrest'
import { formatKickoff } from '../../utils/time'
import { cn } from '../../utils/cn'

function formatKickoffDay(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(new Date(iso))
}

function rowLinkClass() {
  return cn(
    'flex flex-col gap-0.5 rounded-xl border border-tf-grey-pastel/35 bg-tf-dark/[0.03] px-2 py-2 transition',
    'hover:border-tf-grey-pastel/60 hover:bg-tf-white/80',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-electric/30',
  )
}

export function HomeLeftColumn({
  upcomingPool,
  resultsPool,
}: {
  upcomingPool: Match[]
  resultsPool: Match[]
}) {
  const upcoming = useMemo(() => {
    return [...upcomingPool]
      .filter((m) => m.status === 'upcoming')
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
      .slice(0, 4)
  }, [upcomingPool])

  const results = useMemo(() => {
    const fin = resultsPool.filter((m) => m.status === 'finished' && m.score)
    return [...fin]
      .sort((a, b) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime())
      .slice(0, 3)
  }, [resultsPool])

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <Card className="rounded-2xl p-4 shadow-sm" elevation="soft">
        <h3 className="border-b border-tf-grey-pastel/45 pb-2 font-display text-sm font-black uppercase tracking-[0.18em] text-tf-dark">
          Matchs à venir
        </h3>
        <ul className="mt-3 space-y-2" role="list">
          {upcoming.length === 0 ? (
            <li className="rounded-xl bg-tf-grey-pastel/15 px-3 py-4 text-center text-xs font-semibold text-tf-grey">
              Aucun match à venir dans la fenêtre affichée.
            </li>
          ) : (
            upcoming.map((m) => (
              <li key={m.id}>
                <Link
                  to={`/channel/${m.id}`}
                  className={rowLinkClass()}
                  aria-label={`${m.home.shortName} contre ${m.away.shortName}`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      <ClubCrest
                        id={m.home.id}
                        shortName={m.home.shortName}
                        colors={m.home.colors}
                        size={22}
                        className="shrink-0"
                      />
                      <span className="truncate text-xs font-black text-tf-dark">{m.home.shortName}</span>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold text-tf-grey">vs</span>
                    <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
                      <span className="truncate text-xs font-black text-tf-dark">{m.away.shortName}</span>
                      <ClubCrest
                        id={m.away.id}
                        shortName={m.away.shortName}
                        colors={m.away.colors}
                        size={22}
                        className="shrink-0"
                      />
                    </div>
                  </div>
                  <div className="text-center text-[10px] font-bold text-tf-grey">
                    {formatKickoffDay(m.kickoffAt)} · {formatKickoff(m.kickoffAt)}
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
        <Link
          to="/calendar"
          className="mt-2 block rounded-lg border border-tf-grey-pastel/50 py-1.5 text-center text-[11px] font-black text-tf-dark transition hover:bg-tf-grey-pastel/20"
        >
          Calendrier
        </Link>
      </Card>

      <Card className="rounded-2xl p-4 shadow-sm" elevation="soft">
        <h3 className="border-b border-tf-grey-pastel/45 pb-2 font-display text-sm font-black uppercase tracking-[0.18em] text-tf-dark">
          Derniers résultats
        </h3>
        <ul className="mt-3 space-y-2" role="list">
          {results.length === 0 ? (
            <li className="rounded-xl bg-tf-grey-pastel/15 px-3 py-4 text-center text-xs font-semibold text-tf-grey">
              Pas encore de matchs terminés dans les données chargées.
            </li>
          ) : (
            results.map((m) => (
              <li key={m.id}>
                <Link
                  to={`/channel/${m.id}`}
                  className={rowLinkClass()}
                  aria-label={`Résultat ${m.home.shortName} ${m.score?.home} à ${m.score?.away} ${m.away.shortName}`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      <ClubCrest
                        id={m.home.id}
                        shortName={m.home.shortName}
                        colors={m.home.colors}
                        size={22}
                        className="shrink-0"
                      />
                      <span className="truncate text-xs font-black text-tf-dark">{m.home.shortName}</span>
                    </div>
                    <span className="shrink-0 font-display text-xs font-black tabular-nums text-tf-dark">
                      {m.score?.home}–{m.score?.away}
                    </span>
                    <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
                      <span className="truncate text-xs font-black text-tf-dark">{m.away.shortName}</span>
                      <ClubCrest
                        id={m.away.id}
                        shortName={m.away.shortName}
                        colors={m.away.colors}
                        size={22}
                        className="shrink-0"
                      />
                    </div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  )
}
