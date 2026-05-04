import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import type { LiveMirrorForCard } from '../../types/liveSimulation'
import { ClubCrest } from '../brand/ClubCrest'
import { cn } from '../../utils/cn'
import { formatKickoff } from '../../utils/time'
import { themeForCompetition } from '../../data/competitionThemes'
import { formatHubDayLabel, hubFansK, HubStripLive } from './HubMatchEncart'

/**
 * Carte « À l’affiche » / calendrier : **live** = strip stade global (`HubStripLive`) ; **à venir** = dégradé clubs ; **terminé** = variante débrief.
 */
export function MatchSpotlightCard({
  match,
  liveMirror,
  className,
}: {
  match: Match
  liveMirror?: LiveMirrorForCard
  className?: string
}) {
  const fans = hubFansK(match)
  const comp = themeForCompetition(match.competition.id)
  const h = match.home.colors.primary
  const h2 = match.home.colors.secondary
  const a = match.away.colors.primary
  const a2 = match.away.colors.secondary
  const gradient = `linear-gradient(125deg, ${h} 0%, ${h2} 38%, #0a0f1a 50%, ${a2} 62%, ${a} 100%)`

  if (match.status === 'finished') {
    const fsc = match.score ?? { home: 0, away: 0 }
    return (
      <Link
        to={`/channel/${match.id}`}
        className={cn(
          'group relative flex min-h-[220px] flex-col overflow-hidden rounded-2xl border border-tf-dark/10 bg-tf-white shadow-md outline-none transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-sky-500/40',
          className,
        )}
        aria-label={`${match.home.name} contre ${match.away.name}, terminé`}
      >
        <div className="relative min-h-[160px] p-5" style={{ background: gradient }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/45 to-black/60" />
          <div className="relative flex h-full flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-lg bg-white/20 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-sm ring-1 ring-white/25">
                Terminé
              </span>
              {comp ? (
                <span
                  className={cn(
                    'rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wide',
                    comp.labelBg,
                    comp.labelText,
                  )}
                >
                  {match.competition.shortName}
                </span>
              ) : (
                <span className="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-black text-tf-dark">
                  {match.competition.shortName}
                </span>
              )}
            </div>
            <div className="mt-4 flex flex-1 items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
                <ClubCrest
                  id={match.home.id}
                  shortName={match.home.shortName}
                  colors={match.home.colors}
                  logoUrl={match.home.logoUrl}
                  size={44}
                />
                <span className="w-full truncate text-sm font-black text-white drop-shadow-md sm:text-base">
                  {match.home.name}
                </span>
              </div>
              <div className="shrink-0 text-center">
                <p className="font-display text-3xl font-black tabular-nums text-white drop-shadow-lg sm:text-4xl">
                  {fsc.home}–{fsc.away}
                </p>
                <span className="mt-1 text-[11px] font-bold text-white/75">Score final</span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
                <ClubCrest
                  id={match.away.id}
                  shortName={match.away.shortName}
                  colors={match.away.colors}
                  logoUrl={match.away.logoUrl}
                  size={44}
                />
                <span className="w-full truncate text-sm font-black text-white drop-shadow-md sm:text-base">
                  {match.away.name}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-tf-dark/8 bg-tf-ice/80 px-4 py-3">
          <span className="text-xs font-bold text-tf-dark/75">Salon & débrief</span>
          <span className="rounded-xl bg-tf-dark px-4 py-2 text-xs font-black text-white transition group-hover:bg-tf-dark-alt">
            Ouvrir
          </span>
        </div>
      </Link>
    )
  }

  if (match.status === 'live') {
    return (
      <HubStripLive
        match={match}
        liveMirror={liveMirror}
        className={cn('min-h-[240px]', className)}
      />
    )
  }

  return (
    <Link
      to={`/channel/${match.id}`}
      className={cn(
        'group relative flex min-h-[240px] flex-col overflow-hidden rounded-2xl border border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.28)] outline-none transition hover:-translate-y-0.5 hover:shadow-[0_20px_56px_rgba(0,0,0,0.35)] focus-visible:ring-2 focus-visible:ring-sky-400/50',
        className,
      )}
      aria-label={`${match.home.name} contre ${match.away.name}, à venir`}
    >
      <div className="relative min-h-[188px] flex-1 p-5 sm:min-h-[200px] sm:p-6" style={{ background: gradient }}>
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(ellipse 120% 80% at 50% 0%, rgba(255,255,255,0.12), transparent 55%), linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.5))',
          }}
        />
        <div className="relative flex h-full flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-lg bg-sky-600 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white shadow-md ring-1 ring-sky-400/40">
              À venir
            </span>
            {comp ? (
              <span
                className={cn(
                  'rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wide shadow-sm',
                  comp.labelBg,
                  comp.labelText,
                )}
              >
                {match.competition.shortName}
              </span>
            ) : (
              <span className="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-black text-tf-dark">
                {match.competition.shortName}
              </span>
            )}
          </div>

          <div className="mt-5 flex flex-1 items-center justify-between gap-2 sm:gap-4">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-2.5 text-center">
              <ClubCrest
                id={match.home.id}
                shortName={match.home.shortName}
                colors={match.home.colors}
                logoUrl={match.home.logoUrl}
                size={48}
              />
              <span className="w-full max-w-[10rem] truncate text-sm font-black leading-tight text-white drop-shadow-md sm:max-w-[13rem] sm:text-base">
                {match.home.name}
              </span>
            </div>

            <div className="flex shrink-0 flex-col items-center gap-1.5 px-1">
              <p className="font-display text-2xl font-black tabular-nums text-white drop-shadow-lg sm:text-3xl">
                {formatKickoff(match.kickoffAt)}
              </p>
              <span className="rounded-lg bg-white/20 px-2.5 py-1 text-xs font-black text-white backdrop-blur-sm ring-1 ring-white/25">
                {formatHubDayLabel(match.kickoffAt)}
              </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col items-center gap-2.5 text-center">
              <ClubCrest
                id={match.away.id}
                shortName={match.away.shortName}
                colors={match.away.colors}
                logoUrl={match.away.logoUrl}
                size={48}
              />
              <span className="w-full max-w-[10rem] truncate text-sm font-black leading-tight text-white drop-shadow-md sm:max-w-[13rem] sm:text-base">
                {match.away.name}
              </span>
            </div>
          </div>

        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-[#050a12]/92 px-4 py-3.5 backdrop-blur-sm">
        <span className="truncate text-xs font-semibold text-white/65">
          {(fans * 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}k fans · {match.competition.shortName}
        </span>
        <span className="shrink-0 rounded-xl bg-gradient-to-b from-sky-500 to-blue-600 px-4 py-2 text-xs font-black text-white shadow-md transition group-hover:from-sky-400 group-hover:to-blue-500">
          Voir le salon
        </span>
      </div>
    </Link>
  )
}
