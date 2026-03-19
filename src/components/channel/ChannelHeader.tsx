import type { Match } from '../../types/match'
import { formatKickoff, formatRelativeMinute } from '../../utils/time'
import { ClubCrest } from '../brand/ClubCrest'
import { themeForCompetition } from '../../data/competitionThemes'
import { cn } from '../../utils/cn'

export function ChannelHeader({ match }: { match: Match }) {
  const isLive = match.status === 'live'
  const theme = themeForCompetition(match.competition.id)
  const homeScore = match.score?.home ?? '—'
  const awayScore = match.score?.away ?? '—'
  const minuteText = isLive ? `${match.minute ?? 0}'` : 'AVANT'

  return (
    <header className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      {/* Teams + competition */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        <ClubCrest
          id={match.home.id}
          shortName={match.home.shortName}
          colors={match.home.colors}
          size={40}
          className="shrink-0"
        />
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="text-[11px] font-black tracking-[0.16em] text-slate-500 uppercase">
            {match.competition.shortName}
          </div>
          <h1 className="mt-0.5 line-clamp-2 break-words text-lg font-black tracking-tight text-slate-900 sm:text-xl">
            {match.home.shortName} — {match.away.shortName}
          </h1>
          <div className="mt-0.5 text-xs font-semibold text-slate-600">
            {!isLive
              ? `Coup d'envoi ${formatKickoff(match.kickoffAt)}`
              : 'En direct'}
          </div>
        </div>
        <ClubCrest
          id={match.away.id}
          shortName={match.away.shortName}
          colors={match.away.colors}
          size={40}
          className="shrink-0"
        />
      </div>

      {/* Scoreboard bloc */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
        <div
          className={cn(
            'flex items-center gap-4 rounded-2xl px-5 py-3 shadow-sm',
            theme
              ? 'border'
              : 'border border-slate-200/80 bg-white/95',
          )}
          style={
            theme
              ? {
                  borderColor: `${theme.accent}30`,
                  background: `linear-gradient(135deg, ${theme.accent}08, ${theme.accent2}06)`,
                }
              : undefined
          }
        >
          <span className="text-2xl font-black tabular-nums text-slate-900 sm:text-3xl">
            {homeScore}
          </span>
          <span className="text-lg font-bold text-slate-400">–</span>
          <span className="text-2xl font-black tabular-nums text-slate-900 sm:text-3xl">
            {awayScore}
          </span>
        </div>

        <div className="flex flex-col items-center rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm">
          <div className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
            Temps
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            {isLive && (
              <span
                className="h-2 w-2 rounded-full bg-rose-500"
                style={{ animation: 'tf-live-dot 1.2s ease-in-out infinite' }}
                aria-hidden
              />
            )}
            <span className="text-xl font-black tabular-nums text-slate-900">
              {isLive ? formatRelativeMinute(match.minute) || minuteText : formatKickoff(match.kickoffAt)}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
