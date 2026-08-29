import { Link } from 'react-router-dom'
import { useCarouselSwipe } from '../../hooks/useCarouselSwipe'
import { teamHubPathForMatch } from '../../utils/teamHubRoute'
import type { Match } from '../../types/match'
import type { LiveEncartSimulation } from '../../types/liveSimulation'
import { useLinearDisplayedLiveMinute } from '../../hooks/useLinearDisplayedLiveMinute'
import { useLiveMatchClockLabel } from '../../hooks/useLiveMatchClockLabel'
import { useLiveMatchForClock } from '../../hooks/useLiveMatchForClock'
import { MatchTeamCrest } from '../brand/MatchTeamCrest'
import { formatRelativeMinute } from '../../utils/time'
import { getSportMonksToken } from '../../utils/apiTokens'
import { cn } from '../../utils/cn'
import { LiveSalonPresenceStrip } from './LiveSalonPresenceStrip'
import { HUB_STADIUM_URL, HubMatchProgressBar } from '../match/HubMatchEncart'

function AnimatedLiveScore({
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
  const h = Number.isFinite(Number(home)) ? Number(home) : 0
  const a = Number.isFinite(Number(away)) ? Number(away) : 0
  return (
    <span className={cn('tabular-nums', className)}>
      <span
        key="tf-score-home"
        className={cn('inline-block', bumpSide === 'home' ? 'tf-score-pop' : '')}
      >
        {h}
      </span>
      <span className="mx-1.5 font-normal opacity-75">—</span>
      <span
        key="tf-score-away"
        className={cn('inline-block', bumpSide === 'away' ? 'tf-score-pop' : '')}
      >
        {a}
      </span>
    </span>
  )
}

function GoalSparks() {
  const seeds = [0, 1, 2, 3, 4, 5, 6, 7]
  return (
    <div className="pointer-events-none absolute inset-0 z-[19] overflow-hidden" aria-hidden>
      {seeds.map((i) => (
        <span
          key={i}
          className="tf-live-spark absolute size-3 rounded-full bg-amber-100 shadow-[0_0_18px_rgba(253,224,71,1),0_0_6px_rgba(255,255,255,0.9)]"
          style={{
            left: `${12 + ((i * 11) % 76)}%`,
            top: `${38 + (i % 3) * 8}%`,
            ['--sx' as string]: `${((i % 5) - 2) * 28}px`,
            ['--sy' as string]: `${-72 - (i % 4) * 14}px`,
            animationDelay: `${i * 40}ms`,
          }}
        />
      ))}
    </div>
  )
}

/** Hero mobile / tablette / hub desktop : stade, LIVE, animations, salon, Rejoindre. */
export function LiveMatchHero({
  match,
  simulation,
  carousel,
  compact = false,
  /** Hub desktop : blasons + score plus grands, zone visuelle plus haute */
  variant = 'default',
  fillColumnHeight = false,
  className,
}: {
  match: Match
  simulation: LiveEncartSimulation
  carousel?: { count: number; index: number; onSelect: (i: number) => void }
  /** Hauteur réduite (accueil : laisser le hub raccourcis au-dessus de la ligne de flottaison) */
  compact?: boolean
  variant?: 'default' | 'spotlight'
  fillColumnHeight?: boolean
  className?: string
}) {
  const spotlight = variant === 'spotlight' && !compact
  const smDriven = Boolean(match.sportMonksFixtureId && getSportMonksToken())
  const matchForClock = useLiveMatchForClock(match) ?? match
  const linearMinute = useLinearDisplayedLiveMinute(matchForClock)
  const clockLabel = useLiveMatchClockLabel(matchForClock)
  const minute = smDriven ? linearMinute : simulation.active ? simulation.minute : linearMinute
  const minuteLabel = smDriven
    ? clockLabel
    : formatRelativeMinute(minute, {
        paused: matchForClock.liveClockPaused,
        inSecondHalf: matchForClock.liveInSecondHalf,
      }) || `${minute}′`
  const score = smDriven
    ? (matchForClock.score ?? { home: 0, away: 0 })
    : simulation.active
      ? simulation.score
      : (matchForClock.score ?? { home: 0, away: 0 })
  const { bumpSide, burst, toast, rim } = simulation
  /** Effets plein hero : flouter le terrain + renforcer le voile pour lisibilité */
  const heroAnimBackdrop =
    Boolean(burst) || Boolean(toast)
  /** But plein encart : masquer quasi tout le HUD match derrière */
  const goalFullTakeover = burst?.kind === 'goal'
  const crestSize = compact ? 40 : spotlight ? 56 : 60
  const carouselSwipeEnabled = Boolean(carousel && carousel.count > 1)
  const { swipeHandlers } = useCarouselSwipe({
    enabled: carouselSwipeEnabled,
    index: carousel?.index ?? 0,
    count: carousel?.count ?? 1,
    onSelect: carousel?.onSelect ?? (() => {}),
  })
  const minHero = compact
    ? 'min-h-[108px] sm:min-h-[118px]'
    : spotlight
      ? 'min-h-[128px] sm:min-h-[144px] lg:min-h-[min(168px,22vh)] xl:min-h-[min(180px,22vh)]'
      : 'min-h-[200px] sm:min-h-[220px]'

  const rimClass =
    rim === 'yellow'
      ? 'ring-2 ring-amber-400/75 ring-offset-1 ring-offset-[#030b18] sm:ring-4 sm:ring-offset-2 tf-live-rim-pulse'
      : rim === 'red'
        ? 'ring-2 ring-red-500/80 ring-offset-1 ring-offset-[#030b18] sm:ring-4 sm:ring-offset-2 tf-live-rim-pulse'
        : rim === 'goal'
          ? 'ring-2 ring-amber-200/70 shadow-[0_0_32px_rgba(250,204,21,0.22)] ring-offset-1 ring-offset-[#030b18] sm:ring-4 sm:ring-offset-2 sm:shadow-[0_0_48px_rgba(250,204,21,0.28)]'
        : rim === 'var'
          ? 'ring-2 ring-violet-400/65 ring-offset-1 ring-offset-[#030b18] sm:ring-4 sm:ring-offset-2'
          : ''

  return (
    <div
      className={cn(
        'relative isolate w-full min-w-0 max-w-full overflow-x-clip',
        fillColumnHeight && 'flex h-full min-h-0 flex-col',
        className,
      )}
      {...(carouselSwipeEnabled ? { 'data-no-swipe': true } : {})}
    >
      <div className="tf-live-encart-halo" aria-hidden />
      <div className="tf-live-encart-halo-ring" aria-hidden />
      <section
        className={cn(
          'relative z-[1] min-w-0 overflow-hidden rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-[box-shadow,ring] duration-300',
          spotlight &&
            'border-white/15 shadow-[0_28px_90px_rgba(0,0,0,0.62)] ring-1 ring-rose-500/25',
          fillColumnHeight && 'flex h-full min-h-0 flex-1 flex-col',
          rimClass,
          carouselSwipeEnabled && 'touch-pan-y cursor-grab active:cursor-grabbing',
        )}
        aria-label="Match en direct mis en avant"
        {...swipeHandlers}
      >
      <div
        className={cn(
          'relative isolate min-h-0 overflow-hidden rounded-t-3xl',
          minHero,
          fillColumnHeight && !spotlight && 'min-h-[240px] flex-1 lg:min-h-[280px]',
        )}
      >
        <img
          src={HUB_STADIUM_URL}
          alt=""
          className={cn(
            'absolute inset-0 size-full scale-110 object-cover transition-[filter] duration-300 ease-out',
            /* Flou uniquement sur l’image (clip overflow) — pas sur le HUD : évite le halo qui “mange” les coins du cadre */
            heroAnimBackdrop ? 'blur-lg sm:blur-xl' : 'blur-[2px]',
          )}
        />
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-[#030b18] transition-opacity duration-300',
            heroAnimBackdrop
              ? 'via-[#030b18]/90 to-[#030b18]/68'
              : spotlight
                ? 'via-[#030b18]/72 to-sky-950/35'
                : 'via-[#030b18]/78 to-[#061a2e]/50',
          )}
        />
        {heroAnimBackdrop ? (
          <div
            className={cn(
              'absolute inset-0 z-[1] transition-opacity duration-300',
              goalFullTakeover
                ? 'bg-[#030b18]/82 sm:bg-[#030b18]/78'
                : 'bg-[#030b18]/68 sm:bg-[#030b18]/62',
            )}
            aria-hidden
          />
        ) : null}

        {burst?.kind === 'goal' ? <GoalSparks /> : null}

        {burst?.kind === 'goal' ? (
          <div
            className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-4"
            aria-live="polite"
          >
            <div className="tf-live-goal-burst flex flex-col items-center gap-1 text-center">
              <span className="font-display text-[clamp(2.5rem,8vw,4rem)] font-black uppercase leading-none tracking-tight text-amber-50 [text-shadow:0_0_42px_rgba(250,204,21,0.95),0_2px_0_rgba(0,0,0,0.85),0_4px_20px_rgba(0,0,0,0.6)]">
                But !
              </span>
              <span className="max-w-[90%] text-lg font-black uppercase tracking-wide text-white [text-shadow:0_1px_0_rgba(0,0,0,0.9),0_0_24px_rgba(255,255,255,0.35)] sm:text-xl">
                {burst.teamName}
              </span>
              <span className="mt-1 rounded-full bg-black/35 px-3 py-0.5 text-sm font-bold text-white/95 backdrop-blur-sm">
                {minuteLabel}
              </span>
            </div>
          </div>
        ) : null}

        {burst?.kind === 'var' ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-3 pt-3"
            aria-live="polite"
          >
            <div className="tf-live-var-bar max-w-lg rounded-b-2xl border border-violet-300/55 bg-violet-950 px-5 py-2.5 text-center shadow-[0_12px_36px_rgba(0,0,0,0.55)]">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-violet-200">Vidéo</span>
              <p className="mt-0.5 text-sm font-bold text-white">{burst.line}</p>
            </div>
          </div>
        ) : null}

        {toast ? (
          <div
            className={cn(
              'tf-live-toast-in pointer-events-none absolute left-1/2 z-30 max-w-[min(100%,22rem)] -translate-x-1/2 px-3',
              spotlight ? 'bottom-[4.25rem]' : 'bottom-[5.5rem] sm:bottom-[6rem]',
            )}
            aria-live="polite"
          >
            <div
              className={cn(
                'rounded-2xl border-2 px-4 py-3 text-center shadow-[0_12px_40px_rgba(0,0,0,0.45)] ring-2 ring-white/20 backdrop-blur-md',
                toast.kind === 'yellow' && 'border-amber-300/70 bg-amber-950/95 text-amber-50',
                toast.kind === 'red' && 'border-rose-400/75 bg-red-950/95 text-red-50',
                toast.kind === 'var_line' && 'border-violet-300/55 bg-slate-950/95 text-violet-50',
                toast.kind === 'chance' && 'border-sky-300/50 bg-slate-950/95 text-sky-50',
              )}
            >
              <p className="text-sm font-black leading-snug">
                {toast.kind === 'yellow' ? (
                  <span className="mr-1.5 inline-block align-middle" aria-hidden>
                    🟨
                  </span>
                ) : null}
                {toast.kind === 'red' ? (
                  <span className="mr-1.5 inline-block align-middle" aria-hidden>
                    🟥
                  </span>
                ) : null}
                {toast.kind === 'var_line' ? (
                  <span className="mr-1.5 inline-block align-middle" aria-hidden>
                    📺
                  </span>
                ) : null}
                {toast.kind === 'chance' ? (
                  <span className="mr-1.5 inline-block align-middle" aria-hidden>
                    ⚡
                  </span>
                ) : null}
                {toast.text}
              </p>
            </div>
          </div>
        ) : null}

        {/* Bande d’état (LIVE + compétition) : jamais atténuée pendant but / toasts, sinon illisible */}
        <div
          className={cn('relative z-20 flex h-full min-h-0 min-w-0 flex-col', minHero)}
        >
          <div
            className={cn(
              'flex flex-wrap items-start justify-between gap-2 px-3 pb-1',
              compact ? 'pt-2' : spotlight ? 'px-3 pb-0 pt-2 sm:px-4 sm:pt-2.5' : 'px-4 pb-2 pt-4',
            )}
          >
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-md bg-rose-600 font-black uppercase tracking-wide text-white shadow-[0_0_20px_rgba(244,63,94,0.55),0_4px_14px_rgba(225,29,72,0.45),0_1px_0_rgba(0,0,0,0.4)] ring-2 ring-rose-300/70 ring-offset-2 ring-offset-[#030b18]/90',
                compact ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]',
              )}
            >
              <span
                className="tf-live-badge-dot size-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.95)]"
                aria-hidden
              />
              LIVE
            </span>
            <span
              className={cn(
                'max-w-[min(100%,14rem)] truncate rounded-md border border-white/20 bg-black/45 font-bold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.7)] backdrop-blur-sm sm:max-w-none',
                compact ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px] sm:text-xs',
              )}
            >
              {match.competition.shortName}
            </span>
            {match.competition.id === 'wc-2026' ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border font-black uppercase tracking-wide shadow-sm',
                  compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]',
                )}
                style={{
                  background: 'linear-gradient(135deg, #06214a 0%, #0a2f5e 100%)',
                  color: '#f4c542',
                  borderColor: 'rgba(244,197,66,0.45)',
                }}
                title="Coupe du Monde 2026"
              >
                <span aria-hidden>★</span> CDM
              </span>
            ) : null}
          </div>

          <div
            className={cn(
              'relative z-10 flex min-h-0 min-w-0 flex-1 flex-col transition-[opacity,filter] duration-300 ease-out',
              heroAnimBackdrop && 'pointer-events-none',
              goalFullTakeover
                ? 'opacity-[0.14] grayscale sm:opacity-[0.1]'
                : heroAnimBackdrop && 'opacity-[0.32] grayscale sm:opacity-[0.26]',
            )}
          >
          <div className="flex flex-1 flex-col justify-end">
            <div
              className={cn(
                'flex items-end justify-between gap-2 px-3 pb-1',
                compact ? 'pt-1' : spotlight ? 'px-3 pb-0 pt-2 sm:px-4 sm:pt-2' : 'px-4 pb-2 pt-4',
              )}
            >
              <Link
                to={teamHubPathForMatch(match.home, match.competition.id) ?? '#'}
                className="group/home flex min-w-0 flex-1 flex-col items-center gap-1 text-center outline-none"
                title={`Hub ${match.home.name}`}
                onClick={(e) => {
                  if (!teamHubPathForMatch(match.home, match.competition.id)) e.preventDefault()
                }}
              >
                <MatchTeamCrest
                  team={match.home}
                  competitionId={match.competition.id}
                  size={crestSize}
                  clickable={false}
                  className={cn(
                    'shrink-0 drop-shadow-lg transition-transform duration-500',
                    'group-focus-visible/home:ring-2 group-focus-visible/home:ring-sky-400/70 group-focus-visible/home:ring-offset-2 group-focus-visible/home:ring-offset-[#030b18]/90',
                    'group-hover/home:scale-[1.03]',
                    bumpSide === 'home' && 'scale-110 drop-shadow-[0_0_20px_rgba(250,204,21,0.45)]',
                  )}
                />
                <span
                  className={cn(
                    'truncate font-black text-white underline-offset-2 group-hover/home:underline',
                    compact
                      ? 'max-w-[4.5rem] text-[10px]'
                      : spotlight
                        ? 'max-w-[5rem] text-[11px] sm:text-xs'
                        : 'text-xs sm:text-sm',
                  )}
                >
                  {match.home.shortName}
                </span>
              </Link>
              <div className="flex shrink-0 flex-col items-center gap-0.5 px-0.5">
                <span
                  className={cn(
                    'font-display font-black tabular-nums text-white drop-shadow-lg',
                    compact
                      ? 'text-xl sm:text-2xl'
                      : spotlight
                        ? 'text-3xl sm:text-4xl lg:text-[2.65rem] xl:text-[2.75rem]'
                        : 'text-3xl sm:text-4xl',
                  )}
                >
                  <AnimatedLiveScore home={score.home} away={score.away} bumpSide={bumpSide} />
                </span>
                <span
                  key={minute}
                  className={cn(
                    'tf-live-minute-tick rounded-md bg-emerald-500/95 font-black text-white shadow',
                    compact ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-0.5 text-[11px] sm:text-xs',
                  )}
                >
                  {minuteLabel}
                </span>
              </div>
              <Link
                to={teamHubPathForMatch(match.away, match.competition.id) ?? '#'}
                className="group/away flex min-w-0 flex-1 flex-col items-center gap-1 text-center outline-none"
                title={`Hub ${match.away.name}`}
                onClick={(e) => {
                  if (!teamHubPathForMatch(match.away, match.competition.id)) e.preventDefault()
                }}
              >
                <MatchTeamCrest
                  team={match.away}
                  competitionId={match.competition.id}
                  size={crestSize}
                  clickable={false}
                  className={cn(
                    'shrink-0 drop-shadow-lg transition-transform duration-500',
                    'group-focus-visible/away:ring-2 group-focus-visible/away:ring-sky-400/70 group-focus-visible/away:ring-offset-2 group-focus-visible/away:ring-offset-[#030b18]/90',
                    'group-hover/away:scale-[1.03]',
                    bumpSide === 'away' && 'scale-110 drop-shadow-[0_0_20px_rgba(250,204,21,0.45)]',
                  )}
                />
                <span
                  className={cn(
                    'truncate font-black text-white underline-offset-2 group-hover/away:underline',
                    compact
                      ? 'max-w-[4.5rem] text-[10px]'
                      : spotlight
                        ? 'max-w-[5rem] text-[11px] sm:text-xs'
                        : 'text-xs sm:text-sm',
                  )}
                >
                  {match.away.shortName}
                </span>
              </Link>
            </div>
            <div className={cn(compact ? 'px-3 pb-1.5 pt-0' : spotlight ? 'px-3 pb-2 pt-0 sm:px-4' : 'px-4 pb-3 pt-1')}>
              <HubMatchProgressBar
                minute={minute}
                paused={Boolean(matchForClock.liveClockPaused)}
                className={
                  spotlight ? 'h-1 sm:h-1.5 [&>div]:shadow-[0_0_12px_rgba(16,185,129,0.55)]' : undefined
                }
              />
            </div>
          </div>
        </div>
        </div>
      </div>

      <div
        className={cn(
          'relative z-10 shrink-0 border-t border-white/10 bg-[#071422]/95',
          compact ? 'px-3 py-2' : spotlight ? 'px-3 py-2 sm:px-4' : 'px-4 py-3',
        )}
      >
        {spotlight ? (
          <div className="flex min-w-0 flex-col gap-2 sm:gap-2.5 lg:flex-row lg:items-stretch lg:justify-between lg:gap-3">
            <div className="min-w-0 w-full flex-1">
              <LiveSalonPresenceStrip match={match} variant="dense" />
            </div>
            <div className="flex w-full min-w-0 justify-stretch sm:justify-end lg:w-auto lg:shrink-0">
              <Link
                to={`/channel/${match.id}`}
                className="inline-flex min-h-tf-touch w-full min-w-0 max-w-full items-center justify-center rounded-lg bg-gradient-to-b from-emerald-500 to-teal-700 px-3 py-2 text-center text-[11px] font-black uppercase tracking-wide text-white shadow-[0_4px_18px_rgba(16,185,129,0.45)] ring-1 ring-white/15 transition hover:from-emerald-400 hover:to-teal-600 sm:w-auto sm:max-w-min sm:rounded-xl sm:px-5 sm:py-2 sm:text-xs sm:leading-tight sm:normal-case sm:tracking-normal"
              >
                <span className="hidden sm:inline sm:whitespace-nowrap">Rejoindre la tribune</span>
                <span className="sm:hidden">Rejoindre</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className={cn('flex flex-col gap-3', compact && 'gap-2')}>
            <LiveSalonPresenceStrip match={match} compact={compact} />
            <div className="flex min-w-0 flex-wrap items-stretch justify-end border-t border-white/5 pt-2.5 sm:pt-3">
              <Link
                to={`/channel/${match.id}`}
                className={cn(
                  'inline-flex min-h-tf-touch w-full min-w-0 max-w-full items-center justify-center rounded-lg bg-gradient-to-b from-sky-500 to-blue-600 text-center font-black text-white shadow-[0_4px_16px_rgba(14,165,233,0.4)] transition hover:from-sky-400 hover:to-blue-500 sm:w-auto',
                  compact ? 'px-3 py-1.5 text-[10px]' : 'text-xs sm:rounded-xl sm:px-5 sm:py-2.5 sm:text-sm',
                )}
              >
                Rejoindre
              </Link>
            </div>
          </div>
        )}
      </div>

      {carousel && carousel.count > 1 ? (
        <div
          className={cn(
            'flex shrink-0 items-center justify-between gap-2 border-t border-white/5 bg-[#050d14]/90',
            compact ? 'px-3 py-1.5' : spotlight ? 'px-3 py-1.5 sm:px-4' : 'px-4 py-2.5',
          )}
        >
          <p className="text-[10px] font-semibold text-sky-200/65" aria-hidden>
            Glisse ↔
          </p>
          <div
            className="flex justify-end gap-1.5"
            role="tablist"
            aria-label="Choisir le match en direct affiché"
          >
          {Array.from({ length: carousel.count }, (_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === carousel.index}
              onClick={() => carousel.onSelect(i)}
              className={cn(
                'size-2.5 rounded-full border border-white/40 transition',
                i === carousel.index ? 'scale-110 bg-white' : 'bg-white/25 hover:bg-white/50',
              )}
              aria-label={`Match live ${i + 1}`}
            />
          ))}
          </div>
        </div>
      ) : null}
      </section>
    </div>
  )
}
