import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import type { LiveEncartSimulation } from '../../types/liveSimulation'
import { ClubCrest } from '../brand/ClubCrest'
import { formatRelativeMinute } from '../../utils/time'
import { cn } from '../../utils/cn'
import { HUB_STADIUM_URL, HubMatchProgressBar, hubFansK } from '../match/HubMatchEncart'

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

/** Hero mobile / tablette : même DA que les encarts hub (stade, LIVE, barre verte, Rejoindre). */
export function LiveMatchHero({
  match,
  simulation,
  carousel,
}: {
  match: Match
  simulation: LiveEncartSimulation
  carousel?: { count: number; index: number; onSelect: (i: number) => void }
}) {
  const minute = simulation.active ? simulation.minute : match.minute ?? 0
  const score = simulation.active ? simulation.score : match.score ?? { home: 0, away: 0 }
  const { bumpSide, burst, toast, rim } = simulation
  const fans = hubFansK(match)

  const rimClass =
    rim === 'yellow'
      ? 'ring-4 ring-amber-400/75 ring-offset-2 ring-offset-[#030b18] tf-live-rim-pulse'
      : rim === 'red'
        ? 'ring-4 ring-red-500/80 ring-offset-2 ring-offset-[#030b18] tf-live-rim-pulse'
        : rim === 'goal'
          ? 'ring-4 ring-amber-200/70 shadow-[0_0_48px_rgba(250,204,21,0.28)] ring-offset-2 ring-offset-[#030b18]'
          : rim === 'var'
            ? 'ring-4 ring-violet-400/65 ring-offset-2 ring-offset-[#030b18]'
            : ''

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-[box-shadow,ring] duration-300',
        rimClass,
      )}
      aria-label="Match en direct mis en avant"
    >
      <div className="relative min-h-[200px] overflow-hidden sm:min-h-[220px]">
        <img
          src={HUB_STADIUM_URL}
          alt=""
          className="absolute inset-0 size-full scale-110 object-cover blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030b18] via-[#030b18]/78 to-[#061a2e]/50" />

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
              <span className="text-xs font-black uppercase tracking-[0.2em] text-violet-200/90">Vidéo</span>
              <p className="mt-0.5 text-sm font-bold text-white">{burst.line}</p>
            </div>
          </div>
        ) : null}

        {toast ? (
          <div
            className="tf-live-toast-in pointer-events-none absolute bottom-[5.5rem] left-1/2 z-30 max-w-[min(100%,22rem)] -translate-x-1/2 px-3 sm:bottom-[6rem]"
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

        <div className="relative z-10 flex h-full min-h-[200px] flex-col sm:min-h-[220px]">
          <div className="flex flex-wrap items-start justify-between gap-2 px-4 pb-2 pt-4">
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-lg ring-1 ring-rose-400/60">
              <span className="size-1.5 animate-pulse rounded-full bg-white" aria-hidden />
              LIVE
            </span>
            <span className="max-w-[min(100%,14rem)] truncate rounded-md border border-white/15 bg-black/25 px-2.5 py-1 text-[10px] font-bold text-white/90 backdrop-blur-sm sm:max-w-none sm:text-xs">
              {match.competition.shortName}
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-end">
            <div className="flex items-end justify-between gap-2 px-4 pb-2 pt-4">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
                <ClubCrest
                  id={match.home.id}
                  shortName={match.home.shortName}
                  colors={match.home.colors}
                  size={60}
                  className={cn(
                    'shrink-0 drop-shadow-lg transition-transform duration-500',
                    bumpSide === 'home' && 'scale-110 drop-shadow-[0_0_20px_rgba(250,204,21,0.45)]',
                  )}
                />
                <span className="truncate text-xs font-black text-white sm:text-sm">{match.home.shortName}</span>
              </div>
              <div className="flex shrink-0 flex-col items-center gap-1 px-1">
                <span className="font-display text-3xl font-black tabular-nums text-white drop-shadow-lg sm:text-4xl">
                  <AnimatedLiveScore home={score.home} away={score.away} bumpSide={bumpSide} />
                </span>
                <span
                  key={minute}
                  className="rounded-md bg-emerald-500/95 px-2.5 py-0.5 text-[11px] font-black text-white shadow animate-[tf-live-bar_0.85s_ease-out] sm:text-xs"
                >
                  {formatRelativeMinute(minute) ?? `${minute}′`}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
                <ClubCrest
                  id={match.away.id}
                  shortName={match.away.shortName}
                  colors={match.away.colors}
                  size={60}
                  className={cn(
                    'shrink-0 drop-shadow-lg transition-transform duration-500',
                    bumpSide === 'away' && 'scale-110 drop-shadow-[0_0_20px_rgba(250,204,21,0.45)]',
                  )}
                />
                <span className="truncate text-xs font-black text-white sm:text-sm">{match.away.shortName}</span>
              </div>
            </div>
            <div className="px-4 pb-3 pt-1">
              <HubMatchProgressBar minute={minute} />
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#071422]/95 px-4 py-3">
        <span className="text-[11px] font-semibold text-white/60 sm:text-xs">
          {(fans * 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}k fans
        </span>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            to={`/channel/${match.id}/stade?salons=1`}
            className="text-[11px] font-black text-sky-300 underline-offset-2 hover:text-sky-200 hover:underline sm:text-xs"
          >
            Salon stade
          </Link>
          <Link
            to={`/channel/${match.id}`}
            className="rounded-xl bg-gradient-to-b from-sky-500 to-blue-600 px-5 py-2 text-xs font-black text-white shadow-[0_4px_16px_rgba(14,165,233,0.4)] transition hover:from-sky-400 hover:to-blue-500 sm:px-6 sm:py-2.5 sm:text-sm"
          >
            Rejoindre
          </Link>
        </div>
      </div>

      {carousel && carousel.count > 1 ? (
        <div
          className="flex justify-end gap-1.5 border-t border-white/5 bg-[#050d14]/90 px-4 py-2.5"
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
    </section>
  )
}
