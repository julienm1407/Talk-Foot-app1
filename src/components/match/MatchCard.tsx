import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import { formatKickoff, formatRelativeMinute } from '../../utils/time'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { cn } from '../../utils/cn'
import { themeForCompetition } from '../../data/competitionThemes'
import { LeagueMark } from '../brand/LeagueMark'
import { ClubCrest } from '../brand/ClubCrest'

export function MatchCard({
  match,
  compact,
  elevation,
}: {
  match: Match
  compact?: boolean
  elevation?: 'none' | 'soft'
}) {
  const isLive = match.status === 'live'
  const compTheme = themeForCompetition(match.competition.id)
  const timeTone = isLive ? 'live' : 'upcoming'
  const kickoffTime = formatKickoff(match.kickoffAt)
  const kickoffDay = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(new Date(match.kickoffAt))

  return (
    <Link
      to={`/channel/${match.id}`}
      className="group block rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20"
      aria-label={`Ouvrir le live ${match.home.name} vs ${match.away.name}`}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-3xl',
          compTheme ? 'p-[2px]' : 'p-0',
        )}
        style={
          compTheme
            ? ({
                background: `linear-gradient(135deg, ${compTheme.accent}, ${compTheme.accent2})`,
              } as React.CSSProperties)
            : undefined
        }
      >
        <Card
          elevation={elevation}
          className={cn(
            'relative overflow-hidden bg-white/85 transition will-change-transform group-hover:scale-[1.01] group-active:scale-[1.005] hover:bg-white',
            // Slightly smaller inner radius makes the outer gradient outline look clean & even.
            compTheme && 'rounded-[22px]',
            compact ? 'p-4' : 'p-6',
          )}
        >
          {/* Confrontation backdrop (bicolor + lightning divider) */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.85]"
            aria-hidden="true"
          >
            <div className="absolute inset-0">
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(90deg, ${match.home.colors.primary}66 0%, ${match.home.colors.primary}2f 46%, #ffffff00 50%, ${match.away.colors.primary}2f 54%, ${match.away.colors.primary}66 100%)`,
                }}
              />
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/85 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/85 to-transparent" />
            </div>

            {/* Ghost team labels to sell the rivalry */}
            <div className="absolute inset-0 flex items-center justify-between px-6">
              <div className="text-[44px] font-black tracking-tight text-slate-900/10 sm:text-[56px]">
                {match.home.shortName}
              </div>
              <div className="text-[44px] font-black tracking-tight text-slate-900/10 sm:text-[56px]">
                {match.away.shortName}
              </div>
            </div>

            <svg
              className="absolute left-1/2 top-0 h-full w-12 -translate-x-1/2 opacity-70"
              viewBox="0 0 48 200"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="bolt" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#0a3dff" stopOpacity="0.40" />
                  <stop offset="0.5" stopColor="#0b1b3a" stopOpacity="0.16" />
                  <stop offset="1" stopColor="#0a3dff" stopOpacity="0.30" />
                </linearGradient>
              </defs>
              <path
                d="M26 0 L10 78 L24 78 L14 140 L38 92 L24 92 L34 0 Z"
                fill="url(#bolt)"
              />
              <path
                d="M24 0 L8 78 L22 78 L12 140 L36 92 L22 92 L32 0 Z"
                fill="#ffffff"
                opacity="0.30"
              />
            </svg>
          </div>

        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <LeagueMark theme={compTheme} label={match.competition.name} />
              </div>
            </div>

            <Badge
              tone={timeTone}
              className={cn(
                'shadow-sm',
                isLive && 'border-rose-200 bg-rose-50 text-rose-800',
              )}
            >
              {isLive ? 'LIVE' : 'À venir'}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="min-w-0">
              <TeamStack team={match.home} align="left" />
            </div>
            <div className="relative px-2 text-center">
              <div className="text-[10px] font-black tracking-[0.20em] text-slate-600/80">
                {isLive ? (formatRelativeMinute(match.minute) || 'LIVE') : kickoffDay}
              </div>
              <div className="mt-1 text-[13px] font-black text-slate-800">VS</div>
              <div className="mt-1 text-[10px] font-black tracking-[0.20em] text-slate-600/80">
                {isLive ? 'LIVE' : kickoffTime}
              </div>
              <div
                className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 opacity-60"
                style={{
                  background: compTheme
                    ? `linear-gradient(180deg, transparent, ${compTheme.accent}55, transparent)`
                    : 'linear-gradient(180deg, transparent, rgba(148,163,184,.55), transparent)',
                }}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0">
              <TeamStack team={match.away} align="right" />
            </div>
          </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-700">
            {isLive ? 'Rejoindre le live' : 'Avant-match'}
          </div>
        </div>

        {match.score && (
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-black tabular-nums text-slate-900">
              {match.score.home} - {match.score.away}
            </span>
            <span className="font-semibold">Score en direct</span>
          </div>
        )}
          </div>
        </Card>
      </div>
    </Link>
  )
}

function TeamStack({
  team,
  align,
}: {
  team: { id?: string; shortName: string; colors: { primary: string; secondary: string } }
  align: 'left' | 'right'
}) {
  return (
    <div className={cn('flex items-center gap-3', align === 'right' && 'justify-end')}>
      {align === 'right' ? (
        <>
          <div className="text-right">
            <div className="text-lg font-black tracking-tight text-slate-900">
              {team.shortName}
            </div>
            <div className="text-xs font-semibold text-slate-600">Club</div>
          </div>
          <ClubCrest
            id={team.id ?? team.shortName}
            shortName={team.shortName}
            colors={team.colors}
            size={compactSize(align)}
          />
        </>
      ) : (
        <>
          <ClubCrest
            id={team.id ?? team.shortName}
            shortName={team.shortName}
            colors={team.colors}
            size={compactSize(align)}
          />
          <div>
            <div className="text-lg font-black tracking-tight text-slate-900">
              {team.shortName}
            </div>
            <div className="text-xs font-semibold text-slate-600">Club</div>
          </div>
        </>
      )}
    </div>
  )
}

function compactSize(_align: 'left' | 'right') {
  return 44
}

