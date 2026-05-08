import type { Match } from '../../types/match'
import { useLinearDisplayedLiveMinute } from '../../hooks/useLinearDisplayedLiveMinute'
import { formatKickoff, formatRelativeMinute } from '../../utils/time'
import { ClubCrest } from '../brand/ClubCrest'
import { themeForCompetition } from '../../data/competitionThemes'
import { cn } from '../../utils/cn'

export function ChannelHeader({ match }: { match: Match }) {
  const isLive = match.status === 'live'
  const liveMinute = useLinearDisplayedLiveMinute(match)
  const theme = themeForCompetition(match.competition.id)
  const homeScore = match.score?.home ?? '—'
  const awayScore = match.score?.away ?? '—'
  const minuteText = isLive ? `${liveMinute}'` : 'AVANT'

  return (
    <header className="rounded-2xl border border-[#16334d] bg-[#041a2d] px-2.5 py-2 text-white shadow-[0_14px_28px_rgba(0,0,0,0.35)] sm:px-3.5 lg:h-[86px] lg:py-1.5">
      <div className="mb-1 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] text-sky-100/65">
        {match.competition.shortName}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3 lg:h-[54px]">
        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 sm:px-3 sm:py-2">
          <ClubCrest
            id={match.home.id}
            shortName={match.home.shortName}
            colors={match.home.colors}
            logoUrl={match.home.logoUrl}
            sportMonksTeamId={match.home.sportMonksTeamId}
            size={34}
            className="shrink-0"
          />
          <span className="truncate text-sm font-black uppercase tracking-wide sm:text-lg lg:text-[30px] lg:leading-none">
            {match.home.shortName}
          </span>
        </div>
        <div
          className={cn(
            'flex flex-col items-center rounded-xl border px-3 py-1.5 sm:px-5 sm:py-2',
            theme ? 'border-white/20' : 'border-white/15',
          )}
          style={theme ? { background: `linear-gradient(140deg, ${theme.accent}3d, #061a2f)` } : undefined}
        >
          <div className="text-2xl font-black tabular-nums leading-none sm:text-4xl lg:text-[46px]">
            {homeScore} <span className="px-1 text-slate-300">-</span> {awayScore}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-sky-100/75">
            {isLive && (
              <span
                className="h-2 w-2 rounded-full bg-rose-400"
                style={{ animation: 'tf-live-dot 1.2s ease-in-out infinite' }}
                aria-hidden
              />
            )}
            {isLive ? formatRelativeMinute(liveMinute) || minuteText : formatKickoff(match.kickoffAt)}
          </div>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 sm:px-3 sm:py-2">
          <span className="truncate text-right text-sm font-black uppercase tracking-wide sm:text-lg lg:text-[30px] lg:leading-none">
            {match.away.shortName}
          </span>
          <ClubCrest
            id={match.away.id}
            shortName={match.away.shortName}
            colors={match.away.colors}
            logoUrl={match.away.logoUrl}
            sportMonksTeamId={match.away.sportMonksTeamId}
            size={34}
            className="shrink-0"
          />
        </div>
      </div>
      {!isLive ? (
        <p className="mt-2 text-center text-xs font-semibold text-sky-100/80">
          Coup d&apos;envoi {formatKickoff(match.kickoffAt)}
        </p>
      ) : null}
    </header>
  )
}
