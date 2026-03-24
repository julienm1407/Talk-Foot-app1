import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import type { LiveEncartSimulation } from '../../types/liveSimulation'
import { ClubCrest } from '../brand/ClubCrest'
import { formatRelativeMinute } from '../../utils/time'
import { themeForCompetition } from '../../data/competitionThemes'
import { cn } from '../../utils/cn'

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black font-display outline-none transition focus-visible:ring-2 focus-visible:ring-tf-electric/40 tf-interactive-press'

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
  return (
    <span className={cn('tabular-nums', className)}>
      <span
        key={home}
        className={cn('inline-block', bumpSide === 'home' ? 'tf-score-pop' : '')}
      >
        {home}
      </span>
      <span className="mx-1.5 font-normal opacity-75">—</span>
      <span
        key={away}
        className={cn('inline-block', bumpSide === 'away' ? 'tf-score-pop' : '')}
      >
        {away}
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

export function LiveMatchHero({
  match,
  simulation,
  carousel,
}: {
  match: Match
  simulation: LiveEncartSimulation
  carousel?: { count: number; index: number; onSelect: (i: number) => void }
}) {
  const theme = themeForCompetition(match.competition.id)
  const minute = simulation.active ? simulation.minute : match.minute ?? 0
  const score = simulation.active ? simulation.score : match.score ?? { home: 0, away: 0 }
  const { bumpSide, burst, toast, rim } = simulation

  const rimClass =
    rim === 'yellow'
      ? 'ring-4 ring-amber-400/75 ring-offset-2 ring-offset-black/20 tf-live-rim-pulse'
      : rim === 'red'
        ? 'ring-4 ring-red-500/80 ring-offset-2 ring-offset-black/25 tf-live-rim-pulse'
        : rim === 'goal'
          ? 'ring-4 ring-amber-200/70 shadow-[0_0_48px_rgba(250,204,21,0.28)] ring-offset-2 ring-offset-black/15'
          : rim === 'var'
            ? 'ring-4 ring-violet-400/65 ring-offset-2 ring-offset-black/20'
            : ''

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(1,30,51,0.25)] transition-[box-shadow,ring] duration-300 sm:min-h-[280px]',
        rimClass,
      )}
      aria-label="Match en direct mis en avant"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-tf-night via-tf-dark to-black"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40 blur-2xl"
        style={{
          background: theme
            ? `radial-gradient(ellipse 80% 60% at 50% 20%, ${theme.accent2}55, transparent 70%)`
            : 'radial-gradient(ellipse 80% 60% at 50% 20%, #0ea5e955, transparent 70%)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M0 40h80M40 0v80' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

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
              {formatRelativeMinute(minute) ?? `${minute}′`}
            </span>
          </div>
        </div>
      ) : null}

      {burst?.kind === 'var' ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-3 pt-3"
          aria-live="polite"
        >
          <div className="tf-live-var-bar max-w-lg rounded-b-2xl border border-violet-400/40 bg-gradient-to-r from-violet-950/95 via-indigo-950/92 to-violet-950/95 px-5 py-2.5 text-center shadow-lg backdrop-blur-md">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-violet-200/90">
              Vidéo
            </span>
            <p className="mt-0.5 text-sm font-bold text-white">{burst.line}</p>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div
          className="tf-live-toast-in pointer-events-none absolute bottom-6 left-1/2 z-30 max-w-[min(100%,22rem)] px-3"
          aria-live="polite"
        >
          <div
            className={cn(
              'rounded-2xl border-2 px-4 py-3 text-center shadow-[0_12px_40px_rgba(0,0,0,0.45)] ring-2 ring-white/20 backdrop-blur-md',
              toast.kind === 'yellow' &&
                'border-amber-300/70 bg-amber-950/95 text-amber-50',
              toast.kind === 'red' && 'border-rose-400/75 bg-red-950/95 text-red-50',
              toast.kind === 'var_line' &&
                'border-violet-300/55 bg-slate-950/95 text-violet-50',
              toast.kind === 'chance' &&
                'border-sky-300/50 bg-slate-950/95 text-sky-50',
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

      <div className="relative z-10 px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-rose-600/90 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-lg ring-2 ring-rose-400/50">
            <span className="size-2 animate-pulse rounded-full bg-white" aria-hidden />
            En cours
          </span>
          <span
            className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white/90 backdrop-blur-sm"
            style={
              theme
                ? { borderColor: `${theme.accent2}55`, color: '#fff' }
                : undefined
            }
          >
            {match.competition.shortName} · {match.competition.name}
          </span>
        </div>

        <div className="mt-6 flex flex-col items-stretch gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center justify-between gap-4 sm:justify-center sm:gap-10">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center sm:items-end sm:text-right">
              <ClubCrest
                id={match.home.id}
                shortName={match.home.shortName}
                colors={match.home.colors}
                size={72}
                className={cn(
                  'shrink-0 drop-shadow-lg transition-transform duration-500',
                  bumpSide === 'home' && 'scale-110 drop-shadow-[0_0_20px_rgba(250,204,21,0.45)]',
                )}
              />
              <span className="text-sm font-black text-white sm:text-base">{match.home.name}</span>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-1 px-2">
              <span className="font-display text-4xl font-black tabular-nums text-white drop-shadow-md sm:text-5xl">
                <AnimatedLiveScore
                  home={score.home}
                  away={score.away}
                  bumpSide={bumpSide}
                />
              </span>
              <span
                key={minute}
                className="rounded-full bg-white/15 px-3 py-0.5 text-sm font-black text-white/95 backdrop-blur-sm animate-[tf-live-bar_0.85s_ease-out]"
              >
                {formatRelativeMinute(minute) ?? `${minute}′`}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center sm:items-start sm:text-left">
              <ClubCrest
                id={match.away.id}
                shortName={match.away.shortName}
                colors={match.away.colors}
                size={72}
                className={cn(
                  'shrink-0 drop-shadow-lg transition-transform duration-500',
                  bumpSide === 'away' && 'scale-110 drop-shadow-[0_0_20px_rgba(250,204,21,0.45)]',
                )}
              />
              <span className="text-sm font-black text-white sm:text-base">{match.away.name}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to={`/channel/${match.id}`}
            className={cn(
              btnBase,
              'w-full border-0 bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-lg hover:from-rose-700 hover:to-red-800 sm:w-auto sm:min-w-[200px]',
            )}
          >
            SUIVEZ LE LIVE
          </Link>
          <Link
            to={`/channel/${match.id}`}
            className={cn(
              btnBase,
              'w-full border border-white/25 bg-white/95 text-tf-dark shadow-md hover:bg-white sm:w-auto sm:min-w-[200px]',
            )}
          >
            Rejoindre le salon
          </Link>
        </div>

        {carousel && carousel.count > 1 ? (
          <div
            className="mt-6 flex justify-end gap-1.5 sm:absolute sm:bottom-5 sm:right-6 sm:mt-0"
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
        ) : null}
      </div>
    </section>
  )
}
