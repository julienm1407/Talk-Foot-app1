import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import type { LiveMirrorForCard } from '../../types/liveSimulation'
import { useLinearDisplayedLiveMinute } from '../../hooks/useLinearDisplayedLiveMinute'
import { formatKickoff, formatLiveMatchClock } from '../../utils/time'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { cn } from '../../utils/cn'
import { themeForCompetition } from '../../data/competitionThemes'
import { ClubCrest } from '../brand/ClubCrest'
import { ShareButton } from '../ui/ShareButton'

function patternFor(seed: string): 0 | 1 | 2 | 3 {
  let h = 0
  for (let i = 0; i < seed.length; i++) h ^= seed.charCodeAt(i)
  return (h % 4) as 0 | 1 | 2 | 3
}

function TeamPattern({
  color,
  color2,
  pattern,
}: {
  color: string
  color2: string
  pattern: 0 | 1 | 2 | 3
}) {
  const c1 = `${color}50`
  const c2 = `${color2}35`
  if (pattern === 0) {
    return (
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            105deg,
            ${c1} 0px, ${c1} 4px, ${c2} 4px, ${c2} 8px
          )`,
        }}
      />
    )
  }
  if (pattern === 1) {
    return (
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-radial-gradient(
            circle at 0 0,
            ${c1} 0,
            ${c1} 2px,
            transparent 2px,
            transparent 14px
          ), repeating-radial-gradient(
            circle at 14px 14px,
            ${c2} 0,
            ${c2} 2px,
            transparent 2px,
            transparent 14px
          )`,
          backgroundSize: '28px 28px',
        }}
      />
    )
  }
  if (pattern === 2) {
    return (
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${c1} 1px, transparent 1px),
            linear-gradient(90deg, ${c1} 1px, transparent 1px)`,
          backgroundSize: '10px 10px',
        }}
      />
    )
  }
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 6px,
            ${c1} 6px,
            ${c1} 7px
          ),
          repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 6px,
            ${c2} 6px,
            ${c2} 7px
          )`,
      }}
    />
  )
}

function MirroredScore({
  home,
  away,
  bumpSide,
  className,
}: {
  home: number
  away: number
  bumpSide: 'home' | 'away' | null
  className?: string
}) {
  return (
    <div className={cn('w-full text-center text-base font-black tabular-nums text-tf-dark sm:text-lg', className)}>
      <span className={cn('inline-block', bumpSide === 'home' && 'tf-score-pop')}>{home}</span>
      <span className="font-normal text-slate-500"> — </span>
      <span className={cn('inline-block', bumpSide === 'away' && 'tf-score-pop')}>{away}</span>
    </div>
  )
}

export function MatchCard({
  match,
  compact,
  liveMirror,
}: {
  match: Match
  compact?: boolean
  /** Synchronisé avec le hero accueil (même match en live). */
  liveMirror?: LiveMirrorForCard
}) {
  const isLive = match.status === 'live'
  const sim = isLive && liveMirror?.active ? liveMirror : null
  const linearMinute = useLinearDisplayedLiveMinute(match)
  const displayMinute = sim ? sim.minute : linearMinute
  const compTheme = themeForCompetition(match.competition.id)
  const timeTone = isLive ? 'live' : 'upcoming'
  const kickoffTime = formatKickoff(match.kickoffAt)
  const kickoffDay = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(new Date(match.kickoffAt))

  const fixedSize = !isLive
  const channelTo = `/channel/${match.id}`
  const monoFont = compact
    ? 'clamp(1.35rem, 5.5vw, 2.35rem)'
    : 'clamp(2rem, 9vw, 3.25rem)'

  return (
    <div
      className={cn(
        'tf-card-hover rounded-lg outline-none focus-within:ring-2 focus-within:ring-tf-grey/30',
        fixedSize &&
          (compact ? 'h-full min-h-[200px] sm:min-h-[220px]' : 'h-full min-h-[200px] sm:min-h-[220px]'),
      )}
      role="group"
      aria-label={`Match ${match.home.name} contre ${match.away.name}`}
    >
      {/* Cadre épais style écran/télé + traits autour */}
      <div
        className={cn(
          'relative flex h-full overflow-hidden transition-shadow',
          compTheme ? 'p-[6px] rounded-lg' : 'p-0 rounded-lg',
          isLive && 'animate-[tf-live-glow_2s_ease-in-out_infinite]',
          sim?.rim === 'yellow' && 'ring-2 ring-amber-400/80 ring-offset-2 ring-offset-white/10',
          sim?.rim === 'red' && 'ring-2 ring-red-500/85 ring-offset-2 ring-offset-white/10',
          sim?.rim === 'goal' && 'ring-2 ring-amber-300/70 shadow-[0_0_20px_rgba(250,204,21,0.35)]',
          sim?.rim === 'var' && 'ring-2 ring-violet-500/65',
        )}
        style={
          compTheme
            ? ({
                background: `linear-gradient(145deg, ${compTheme.accent}, ${compTheme.accent2})`,
                boxShadow: `inset 0 0 0 2px rgba(0,0,0,.1)`,
              } as React.CSSProperties)
            : undefined
        }
      >
        <Card
          elevation="none"
          className={cn(
            'relative flex flex-1 flex-col overflow-hidden bg-tf-white/95 transition hover:bg-tf-white rounded-md border border-tf-grey-pastel/40',
            compact ? 'p-3.5 sm:p-4' : 'p-4',
            fixedSize && (compact ? 'min-h-[185px] sm:min-h-[205px]' : 'min-h-[180px] sm:min-h-[200px]'),
          )}
        >
          {/* Arrière-plan : monogrammes + motifs variés (traits, bulles, carrés, losanges) */}
          <div
            className="pointer-events-none absolute inset-0 z-0"
            aria-hidden="true"
          >
            {/* Monogramme + motif club domicile */}
            <div
              className="absolute inset-0"
              style={{
                maskImage: 'linear-gradient(90deg, black 0%, black 35%, transparent 42%)',
                WebkitMaskImage: 'linear-gradient(90deg, black 0%, black 35%, transparent 42%)',
              }}
            >
              <TeamPattern
                color={match.home.colors.primary}
                color2={match.home.colors.secondary}
                pattern={patternFor(match.home.id ?? match.home.shortName)}
              />
              <div
                className="absolute inset-0 flex items-center pl-3"
                style={{
                  color: `${match.home.colors.primary}55`,
                  fontSize: monoFont,
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                }}
              >
                {match.home.shortName}
              </div>
            </div>
            {/* Monogramme + motif club extérieur */}
            <div
              className="absolute inset-0"
              style={{
                maskImage: 'linear-gradient(90deg, transparent 58%, black 65%, black 100%)',
                WebkitMaskImage: 'linear-gradient(90deg, transparent 58%, black 65%, black 100%)',
              }}
            >
              <TeamPattern
                color={match.away.colors.primary}
                color2={match.away.colors.secondary}
                pattern={patternFor(match.away.id ?? match.away.shortName)}
              />
              <div
                className="absolute inset-0 flex items-center justify-end pr-3"
                style={{
                  color: `${match.away.colors.primary}55`,
                  fontSize: monoFont,
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                }}
              >
                {match.away.shortName}
              </div>
            </div>
            {/* Voile blanc léger */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/55 via-white/70 to-white/55" />
            {/* Séparation centrale versus : trait vertical illustrant le face-à-face */}
            <div
              className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 z-[1]"
              style={{
                background: `linear-gradient(180deg,
                  transparent 0%,
                  ${match.home.colors.primary}50 20%,
                  ${match.home.colors.primary}80 45%,
                  ${match.away.colors.primary}80 55%,
                  ${match.away.colors.primary}50 80%,
                  transparent 100%
                )`,
                boxShadow: '0 0 6px rgba(0,0,0,0.06)',
              }}
              aria-hidden="true"
            />
          </div>

        <div className="relative z-10">
          {sim?.burst?.kind === 'goal' ? (
            <div
              className="pointer-events-none absolute inset-x-2 top-10 z-[15] flex justify-center sm:top-11"
              aria-hidden
            >
              <span className="tf-live-goal-burst rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-lg">
                But !
              </span>
            </div>
          ) : null}
          {sim?.burst?.kind === 'var' ? (
            <div
              className="pointer-events-none absolute inset-x-1 top-8 z-[15] flex justify-center"
              aria-hidden
            >
              <span className="tf-live-var-bar max-w-[95%] truncate rounded-lg border border-violet-400/40 bg-violet-950/90 px-2 py-1 text-center text-[9px] font-bold leading-tight text-violet-100">
                {sim.burst.line}
              </span>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              {compTheme ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold text-tf-dark"
                  style={{ background: `${compTheme.accent}12`, border: `1px solid ${compTheme.accent}25` }}
                >
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ background: `linear-gradient(135deg, ${compTheme.accent}, ${compTheme.accent2})` }}
                    aria-hidden
                  />
                  {match.competition.shortName}
                </span>
              ) : (
                <span className="text-[11px] font-bold text-tf-dark">{match.competition.shortName}</span>
              )}
              <span className="hidden text-[11px] font-medium text-tf-grey sm:inline">
                {match.competition.name}
              </span>
            </div>
            <Badge
              tone={timeTone}
              className="inline-flex items-center gap-1.5"
            >
              {isLive ? (
                <>
                  <span
                    className="h-2 w-2 rounded-full bg-rose-500 animate-[tf-live-dot_1.2s_ease-in-out_infinite]"
                    aria-hidden="true"
                  />
                  LIVE
                </>
              ) : (
                'À venir'
              )}
            </Badge>
          </div>

          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3 sm:grid-cols-[minmax(5rem,1fr)_auto_minmax(5rem,1fr)]">
            <div className="min-w-0 overflow-hidden">
              <TeamStack team={match.home} align="left" size={compact ? 58 : 64} />
            </div>
            <div
              className="relative flex min-w-[6rem] shrink-0 flex-col items-center justify-center gap-1 rounded-lg bg-white/50 px-2.5 py-2 text-center backdrop-blur-md border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:min-w-[7.25rem] sm:px-3 sm:py-2"
              style={{
                borderLeft: `2px solid ${match.home.colors.primary}40`,
                borderRight: `2px solid ${match.away.colors.primary}40`,
              }}
            >
              <div
                key={
                  isLive
                    ? `m-${displayMinute}`
                    : `k-${match.kickoffAt}`
                }
                className={cn(
                  'w-full text-center text-xs font-black leading-tight text-tf-dark',
                  isLive && 'tf-live-minute-tick',
                )}
              >
                {isLive
                  ? formatLiveMatchClock(displayMinute, match.liveClockPaused)
                  : (
                    <>
                      <span className="block">{kickoffDay}</span>
                      <span className="block text-tf-grey">{kickoffTime}</span>
                    </>
                  )}
              </div>
              {isLive ? (
                sim ? (
                  <MirroredScore
                    home={sim.score.home}
                    away={sim.score.away}
                    bumpSide={sim.bumpSide}
                  />
                ) : match.score ? (
                  <div className="w-full text-center text-lg font-black tabular-nums text-tf-dark">
                    {match.score.home} <span className="font-normal text-slate-500">-</span>{' '}
                    {match.score.away}
                  </div>
                ) : (
                  <div className="w-full text-center text-base font-black text-tf-dark">VS</div>
                )
              ) : match.score ? (
                <div className="w-full text-center text-lg font-black tabular-nums text-tf-dark">
                  {match.score.home} <span className="font-normal text-slate-500">-</span>{' '}
                  {match.score.away}
                </div>
              ) : (
                <div className="w-full text-center text-base font-black text-tf-dark">VS</div>
              )}
              {isLive && (
                <div className="w-full text-center text-xs font-bold text-tf-grey">en direct</div>
              )}
            </div>
            <div className="min-w-0 overflow-hidden">
              <TeamStack team={match.away} align="right" size={compact ? 58 : 64} />
            </div>
          </div>
          <div className="mt-4 flex w-full gap-2">
            <Link
              to={channelTo}
              className="tf-interactive-press inline-flex min-w-0 flex-1 items-center justify-center rounded-2xl bg-tf-dark px-3 py-2.5 text-center text-xs font-black text-white shadow-sm transition hover:bg-tf-dark-alt"
            >
              {isLive
                ? 'Rejoindre le live'
                : match.status === 'upcoming'
                  ? "Voir l'avant-match"
                  : 'Salon match'}
            </Link>
            {(isLive || match.status === 'upcoming') && (
              <ShareButton
                compact
                className="shrink-0"
                path={channelTo}
                title={`${match.home.shortName} – ${match.away.shortName}`}
                text={`Salon Talk Foot : ${match.home.shortName} – ${match.away.shortName}`}
              />
            )}
          </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function TeamStack({
  team,
  align,
  size = 56,
}: {
  team: {
    id?: string
    shortName: string
    colors: { primary: string; secondary: string }
    logoUrl?: string
    sportMonksTeamId?: number
  }
  align: 'left' | 'right'
  size?: number
}) {
  return (
    <div className={cn('flex justify-center', align === 'right' && 'justify-end')}>
      <ClubCrest
        id={team.id ?? team.shortName}
        shortName={team.shortName}
        colors={team.colors}
        logoUrl={team.logoUrl}
        sportMonksTeamId={team.sportMonksTeamId}
        size={size}
        className="shrink-0"
      />
    </div>
  )
}

