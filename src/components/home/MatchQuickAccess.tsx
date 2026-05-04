import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import { useLinearDisplayedLiveMinute } from '../../hooks/useLinearDisplayedLiveMinute'
import { ClubCrest } from '../brand/ClubCrest'
import { cn } from '../../utils/cn'
import { formatKickoff } from '../../utils/time'
import { HubRailRowLive, HubRailRowUpcoming, formatHubDayLabel } from '../match/HubMatchEncart'
import { useAppearance } from '../../contexts/AppearanceContext'

function sortPool(matches: Match[], clubFocusIds: string[] | null) {
  if (clubFocusIds != null && clubFocusIds.length > 0) {
    const mine = matches.filter((m) =>
      clubFocusIds.some((id) => m.home.id === id || m.away.id === id),
    )
    return mine.length > 0 ? mine : matches
  }
  return matches
}

/** Puce horizontale : lisible, couleurs clubs, sans colonne étriquée */
function RailMatchChip({ match, light }: { match: Match; light: boolean }) {
  const isLive = match.status === 'live'
  const liveMin = useLinearDisplayedLiveMinute(match)
  const sc = match.score ?? { home: 0, away: 0 }
  return (
    <Link
      to={`/channel/${match.id}`}
      className={cn(
        'flex w-[min(100%,20rem)] max-w-full shrink-0 snap-start flex-col rounded-2xl border p-4 shadow-sm transition sm:w-[min(100%,22.5rem)]',
        light
          ? 'bg-white'
          : 'border-white/12 bg-[#0d1a2e]/95 ring-1 ring-white/[0.06]',
        isLive
          ? light
            ? 'border-rose-300/60 ring-1 ring-rose-200/50 hover:border-rose-400/70'
            : 'border-rose-500/45 ring-1 ring-rose-500/25 hover:border-rose-400/55'
          : light
            ? 'border-tf-dark/10 hover:border-sky-400/40'
            : 'hover:border-sky-400/35',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide',
            isLive ? 'bg-rose-600 text-white' : light ? 'bg-sky-100 text-sky-900' : 'bg-sky-500/25 text-sky-100',
          )}
        >
          {isLive ? '● Live' : 'À venir'}
        </span>
        <span
          className={cn('truncate text-[10px] font-bold', light ? 'text-tf-grey' : 'text-tf-app-muted')}
        >
          {match.competition.shortName}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <ClubCrest id={match.home.id} shortName={match.home.shortName} colors={match.home.colors} size={36} />
          <span className="truncate text-sm font-black text-tf-app-fg">{match.home.shortName}</span>
        </div>
        {isLive ? (
          <span className="shrink-0 font-display text-lg font-black tabular-nums text-tf-app-fg">
            {sc.home}–{sc.away}
          </span>
        ) : (
          <span className="shrink-0 text-sm font-black text-tf-app-fg">{formatKickoff(match.kickoffAt)}</span>
        )}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span className="truncate text-right text-sm font-black text-tf-app-fg">{match.away.shortName}</span>
          <ClubCrest id={match.away.id} shortName={match.away.shortName} colors={match.away.colors} size={36} />
        </div>
      </div>
      {!isLive ? (
        <p className={cn('mt-2 text-center text-[11px] font-bold', light ? 'text-tf-dark/72' : 'text-tf-app-muted')}>
          {formatHubDayLabel(match.kickoffAt)}
        </p>
      ) : (
        <p
          className={cn(
            'mt-2 text-center text-[11px] font-bold',
            light ? 'text-emerald-700' : 'text-emerald-400',
          )}
        >
          {`${liveMin}′`}
        </p>
      )}
    </Link>
  )
}

export function MatchQuickAccess({
  matches,
  clubFocusIds = null,
  variant = 'stack',
  className,
}: {
  matches: Match[]
  clubFocusIds?: string[] | null
  /** `stack` = cartes sombres empilées · `rail` = bandeau horizontal (page Matchs desktop) */
  variant?: 'stack' | 'rail'
  className?: string
}) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  const { liveMatches, upcomingMatches, orderedRail } = useMemo(() => {
    const pool = sortPool(matches, clubFocusIds)
    const live = pool.filter((m) => m.status === 'live')
    const upcoming = pool
      .filter((m) => m.status === 'upcoming')
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
      .slice(0, 3)
    const rail = [...live, ...upcoming].slice(0, 6)
    return { liveMatches: live, upcomingMatches: upcoming, orderedRail: rail }
  }, [matches, clubFocusIds])

  if (variant === 'rail') {
    if (orderedRail.length === 0) {
      return (
        <div
          className={cn(
            'rounded-2xl border border-dashed px-4 py-6 text-center',
            L ? 'border-tf-dark/15 bg-tf-ice/40' : 'border-white/20 bg-white/[0.04]',
            className,
          )}
        >
          <p className="text-sm font-semibold text-tf-app-muted">Aucun match à mettre en avant pour l’instant.</p>
          <Link
            to="/match"
            className={cn(
              'mt-2 inline-block text-sm font-black underline',
              L ? 'text-sky-700' : 'text-sky-300',
            )}
          >
            Voir les matchs
          </Link>
        </div>
      )
    }
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className="font-display text-lg font-black tracking-tight text-tf-app-fg sm:text-xl">
            {clubFocusIds != null && clubFocusIds.length > 0 ? 'Tes matchs en un coup d’œil' : 'Raccourcis matchs'}
          </h3>
          <Link
            to="/match"
            className={cn(
              'text-xs font-black underline-offset-2 hover:underline sm:text-sm',
              L ? 'text-sky-700' : 'text-sky-300',
            )}
          >
            Tous les matchs →
          </Link>
        </div>
        <div
          className="flex gap-4 overflow-x-auto pb-2 pt-1 [-webkit-overflow-scrolling:touch] snap-x snap-mandatory"
          role="list"
        >
          {orderedRail.map((m) => (
            <div key={m.id} role="listitem">
              <RailMatchChip match={m} light={L} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col gap-3', className)}>
      <h3 className="font-display text-lg font-black tracking-tight text-tf-app-fg">
        {clubFocusIds != null && clubFocusIds.length > 0 ? 'Tes clubs en direct' : 'Accès rapide'}
      </h3>

      {liveMatches.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#030b18]/95 shadow-[0_18px_52px_rgba(0,0,0,0.42)] ring-1 ring-white/10">
          <div className="border-b border-white/10 px-3 py-2 sm:px-4">
            <div className="flex items-center gap-2">
              <span
                className="flex h-2 w-2 animate-pulse rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.85)]"
                aria-hidden
              />
              <h4 className="text-sm font-black uppercase tracking-[0.12em] text-white">En direct</h4>
            </div>
          </div>
          <div className="space-y-2 p-2.5 sm:p-3">
            {liveMatches.map((m) => (
              <HubRailRowLive key={m.id} match={m} />
            ))}
          </div>
        </div>
      )}

      {upcomingMatches.length > 0 && (
        <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#030b18]/95 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <div className="border-b border-white/10 px-2.5 py-1.5 sm:px-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-white">À venir</h4>
          </div>
          <ul className="space-y-2 p-2 sm:p-2.5" role="list">
            {upcomingMatches.map((m) => (
              <li key={m.id}>
                <HubRailRowUpcoming match={m} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        to="/match"
        className="mt-auto rounded-xl border border-tf-grey-pastel/50 bg-tf-white px-3 py-2 text-center transition hover:border-tf-grey-pastel/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-grey/25"
      >
        <span className="text-sm font-bold text-tf-app-fg">Voir le calendrier</span>
      </Link>
    </div>
  )
}
