import type { Match } from '../../types/match'
import { Badge } from '../ui/Badge'
import { formatKickoff, formatRelativeMinute } from '../../utils/time'
import { ClubCrest } from '../brand/ClubCrest'

export function ChannelHeader({ match }: { match: Match }) {
  const isLive = match.status === 'live'
  const scoreText = match.score
    ? `${match.score.home} – ${match.score.away}`
    : '— – —'
  const minuteText = isLive ? `${match.minute ?? 0}'` : 'AVANT'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-xs font-semibold tracking-wide text-slate-600">
          {match.competition.name}
        </div>
        <div className="mt-1 truncate text-xl font-black tracking-tight text-slate-900">
          {match.home.name} — {match.away.name}
        </div>
        <div className="mt-1 text-xs font-semibold text-slate-600">
          {!isLive ? `Coup d’envoi ${formatKickoff(match.kickoffAt)}` : 'Match en direct'}
        </div>
      </div>

      {/* Big scoreboard: score + minute must be instantly readable */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2">
          <ClubCrest
            id={match.home.id}
            shortName={match.home.shortName}
            colors={match.home.colors}
            size={38}
          />
          <ClubCrest
            id={match.away.id}
            shortName={match.away.shortName}
            colors={match.away.colors}
            size={38}
          />
        </div>
        <div className="rounded-3xl bg-[#0b1b3a] px-4 py-2 text-white shadow-sm">
          <div className="text-[11px] font-black tracking-[0.18em] text-white/70">
            SCORE
          </div>
          <div className="mt-0.5 text-3xl font-black tabular-nums tracking-tight">
            {scoreText}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/80 px-4 py-2 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            {isLive ? (
              <Badge tone="live">
                <span className="inline-flex size-1.5 rounded-full bg-rose-500" />
                LIVE
              </Badge>
            ) : (
              <Badge tone="upcoming">AVANT</Badge>
            )}
            <div className="text-[11px] font-black tracking-[0.18em] text-slate-600/70">
              TEMPS
            </div>
          </div>
          <div className="mt-0.5 text-2xl font-black tabular-nums text-slate-900">
            {isLive ? formatRelativeMinute(match.minute) || minuteText : minuteText}
          </div>
        </div>
      </div>
    </div>
  )
}

