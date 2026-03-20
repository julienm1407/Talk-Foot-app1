import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import { ClubCrest } from '../brand/ClubCrest'
import { themeForCompetition } from '../../data/competitionThemes'
import { formatKickoff, formatRelativeMinute } from '../../utils/time'
import { cn } from '../../utils/cn'

function formatKickoffDay(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(new Date(iso))
}

export function MatchQuickAccess({
  matches,
  clubFocusId = null,
}: {
  matches: Match[]
  /** Mode supporter : n’afficher que les matchs du club si possible */
  clubFocusId?: string | null
}) {
  const { liveMatches, upcomingMatches } = useMemo(() => {
    const pool =
      clubFocusId != null && clubFocusId !== ''
        ? (() => {
            const mine = matches.filter(
              (m) => m.home.id === clubFocusId || m.away.id === clubFocusId,
            )
            return mine.length > 0 ? mine : matches
          })()
        : matches
    const live = pool.filter((m) => m.status === 'live')
    const upcoming = pool
      .filter((m) => m.status !== 'live')
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
      .slice(0, 3)
    return { liveMatches: live, upcomingMatches: upcoming }
  }, [matches, clubFocusId])

  return (
    <div className="flex h-full flex-col gap-3">
      <h3 className="font-display text-lg font-black tracking-tight text-tf-dark">
        {clubFocusId ? 'Ton club en direct' : 'Accès rapide'}
      </h3>

      {/* En direct */}
      {liveMatches.length > 0 && (
        <div className="rounded-xl border border-tf-grey-pastel/50 bg-tf-white">
          <div className="border-b border-tf-grey-pastel/40 px-3 py-2 sm:px-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-rose-500" aria-hidden />
              <h4 className="text-sm font-black uppercase tracking-wider text-tf-dark">
                En direct
              </h4>
            </div>
          </div>
          <div className="space-y-2 p-2.5 sm:p-3">
            {liveMatches.map((m) => {
              const theme = themeForCompetition(m.competition.id)
              const score = m.score ? `${m.score.home} - ${m.score.away}` : null
              const minute = formatRelativeMinute(m.minute)
              return (
                <Link
                  key={m.id}
                  to={`/channel/${m.id}`}
                  className="block rounded-lg border border-tf-grey-pastel/40 bg-tf-white p-2.5 transition hover:border-tf-grey-pastel/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-grey/25"
                  aria-label={`Rejoindre le live ${m.home.name} vs ${m.away.name}`}
                >
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden sm:gap-2">
                      <ClubCrest
                        id={m.home.id}
                        shortName={m.home.shortName}
                        colors={m.home.colors}
                        size={24}
                        className="shrink-0"
                      />
                      <span className="truncate text-xs font-bold text-tf-dark sm:text-sm">
                        {m.home.shortName}
                      </span>
                      <span className="shrink-0 text-[11px] font-black text-tf-grey">
                        {score ?? minute}
                      </span>
                      <ClubCrest
                        id={m.away.id}
                        shortName={m.away.shortName}
                        colors={m.away.colors}
                        size={24}
                        className="shrink-0"
                      />
                      <span className="truncate text-xs font-bold text-tf-dark sm:text-sm">
                        {m.away.shortName}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase text-white',
                        theme ? '' : 'bg-rose-500',
                      )}
                      style={theme ? { background: theme.accent } : undefined}
                    >
                      Rejoindre
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Prochains matchs */}
      {upcomingMatches.length > 0 && (
        <div className="min-w-0 rounded-xl border border-tf-grey-pastel/50 bg-tf-white">
          <div className="border-b border-tf-grey-pastel/40 px-2.5 py-1.5 sm:px-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-tf-dark">
              À venir
            </h4>
          </div>
          <ul className="space-y-0.5 p-2 sm:p-2.5">
            {upcomingMatches.map((m) => (
              <li key={m.id}>
                <Link
                  to={`/channel/${m.id}`}
                  className="flex flex-col gap-0.5 rounded-lg p-2 transition hover:bg-tf-grey-pastel/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-grey/25"
                  aria-label={`Voir ${m.home.name} vs ${m.away.name}`}
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <ClubCrest id={m.home.id} shortName={m.home.shortName} colors={m.home.colors} size={24} className="shrink-0" />
                    <span className="font-semibold text-tf-dark">{m.home.shortName}</span>
                    <span className="text-tf-grey">–</span>
                    <span className="font-semibold text-tf-dark">{m.away.shortName}</span>
                    <ClubCrest id={m.away.id} shortName={m.away.shortName} colors={m.away.colors} size={24} className="shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 text-[12px] font-medium text-tf-grey">
                    <span>{formatKickoffDay(m.kickoffAt)}</span>
                    <span>•</span>
                    <span>{formatKickoff(m.kickoffAt)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Calendrier */}
      <Link
        to="/calendar"
        className="mt-auto rounded-xl border border-tf-grey-pastel/50 bg-tf-white px-3 py-2 text-center transition hover:border-tf-grey-pastel/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-grey/25"
      >
        <span className="text-sm font-bold text-tf-dark">Voir le calendrier</span>
      </Link>
    </div>
  )
}
