import { useEffect, useMemo, useState } from 'react'
import type { Match } from '../../types/match'
import type { LiveEncartSimulation } from '../../types/liveSimulation'
import { useLinearDisplayedLiveMinute } from '../../hooks/useLinearDisplayedLiveMinute'
import { Avatar } from '../ui/Avatar'
import { cn } from '../../utils/cn'
import { getLiveSalonPresenceSnapshot, liveSalonActiveSeeds } from '../../utils/liveSalonPresence'

const heatFillByTier = {
  calm: 'bg-gradient-to-r from-emerald-400/95 via-teal-400/90 to-cyan-500/85',
  warm: 'bg-gradient-to-r from-amber-400/95 via-yellow-400/90 to-orange-400/85',
  hot: 'bg-gradient-to-r from-orange-500 via-rose-500 to-red-500',
  fire: 'bg-gradient-to-r from-rose-600 via-orange-500 to-amber-400',
} as const

const tierLabelClass = {
  calm: 'text-emerald-300',
  warm: 'text-amber-200',
  hot: 'text-orange-200',
  fire: 'text-rose-200 drop-shadow-[0_0_12px_rgba(251,113,133,0.55)]',
} as const

export function LiveSalonPresenceStrip({
  match,
  simulation,
  compact,
  /** Hub desktop : moins de hauteur, stats + actifs sur une ligne */
  variant = 'default',
}: {
  match: Match
  simulation: LiveEncartSimulation
  compact?: boolean
  variant?: 'default' | 'dense'
}) {
  const dense = variant === 'dense'
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 2100)
    return () => window.clearInterval(id)
  }, [match.id])

  const linearMinute = useLinearDisplayedLiveMinute(match)
  const minute = simulation.active ? simulation.minute : linearMinute
  const score = simulation.active ? simulation.score : match.score ?? { home: 0, away: 0 }
  const simForPresence = useMemo(
    () => ({ ...simulation, minute, score }),
    [simulation, minute, score],
  )

  const snap = useMemo(
    () => getLiveSalonPresenceSnapshot(match, simForPresence, tick),
    [match, simForPresence, tick],
  )

  const actifs = useMemo(() => liveSalonActiveSeeds(match.id), [match.id])
  const heatPulse = snap.intensity >= 72
  const shineMs = Math.max(900, 2400 - snap.intensity * 16)

  return (
    <div
      className={cn(
        'w-full min-w-0 max-w-full',
        compact ? 'space-y-1.5' : dense ? 'space-y-1' : 'space-y-2.5',
      )}
      aria-label="Activité du salon live"
    >
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <span
          className={cn(
            'font-black uppercase tracking-[0.14em] text-zinc-200 [text-shadow:0_1px_2px_rgba(0,0,0,0.65)]',
            compact || dense ? 'text-[8px]' : 'text-[9px] sm:text-[10px]',
          )}
        >
          Intensité salon
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 font-black tabular-nums',
            compact ? 'text-[9px]' : dense ? 'text-[9px]' : 'text-[10px] sm:text-xs',
            tierLabelClass[snap.tier],
          )}
        >
          {snap.tier === 'fire' ? <span aria-hidden>🔥</span> : null}
          {snap.tierLabel}
          <span className="text-white/45">·</span>
          <span className="text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.75)]">{snap.intensity}%</span>
        </span>
      </div>

      <div
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-black/50 ring-1 ring-inset ring-white/10',
          dense ? 'h-1' : 'h-2',
          heatPulse && 'tf-salon-heat-pulse',
        )}
      >
        <div
          className={cn(
            'relative h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out',
            heatFillByTier[snap.tier],
          )}
          style={{
            width: `${snap.intensity}%`,
            boxShadow:
              snap.intensity >= 68
                ? '0 0 16px rgba(251, 146, 60, 0.45), inset 0 1px 0 rgba(255,255,255,0.25)'
                : undefined,
          }}
        />
        {snap.intensity >= 38 ? (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-[40%] bg-gradient-to-r from-transparent via-white/35 to-transparent"
            style={{ animation: `tf-salon-heat-shine ${shineMs}ms ease-in-out infinite` }}
            aria-hidden
          />
        ) : null}
      </div>

      <div
        className={cn(
          dense || compact
            ? 'flex flex-wrap items-center justify-between gap-x-2 gap-y-1'
            : 'flex flex-col gap-1.5 sm:gap-2',
          dense && 'text-[9px]',
        )}
      >
        <p
          className={cn(
            'min-w-0 max-w-full font-black text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]',
            compact ? 'text-[10px]' : dense ? 'text-[9px]' : 'text-[11px] sm:text-xs',
            !dense && !compact && 'w-full',
          )}
        >
          <span className="whitespace-nowrap">👥 {snap.viewers.toLocaleString('fr-FR')}</span>
          <span className="text-white/40"> · </span>
          <span className="whitespace-nowrap">💬 {snap.messages.toLocaleString('fr-FR')}</span>
        </p>
        <div
          className={cn(
            'flex min-w-0 max-w-full flex-wrap items-center gap-1.5',
            dense || compact ? '' : 'justify-end',
          )}
        >
          <span
            className={cn(
              'font-bold uppercase tracking-wide text-zinc-200 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]',
              compact || dense ? 'text-[7px]' : 'text-[9px]',
            )}
          >
            Actifs
          </span>
          <div
            className={cn(
              'flex min-w-0 max-w-full flex-nowrap justify-end overflow-x-auto overflow-y-hidden py-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]',
              dense ? '-space-x-1' : '-space-x-1.5 sm:-space-x-2',
            )}
          >
            {actifs.map((a, i) => (
              <Avatar
                key={`${match.id}-live-act-${a.seed}-${i}`}
                seed={a.seed}
                accent={a.accent}
                className={cn(
                  'ring-2 ring-white/25',
                  snap.tier === 'fire' && 'ring-rose-400/50',
                  compact ? 'size-7 [&>div]:size-5 [&>div]:text-[10px]' : dense
                    ? 'size-6 [&>div]:size-4 [&>div]:text-[9px]'
                    : 'size-8 sm:size-9 [&>div]:text-xs',
                )}
                alt=""
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
