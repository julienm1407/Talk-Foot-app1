import type { LineupPlayerMatchOverlay } from '../../api/sportMonks/extractPlayerMatchOverlaysFromSmFixture'
import { useState } from 'react'
import { cn } from '../../utils/cn'
import type { LineupPitchLayout } from '../../utils/lineupPitchPositions'
import { formatLineupRating, lineupRatingBackground } from '../../utils/lineupPlayerRatingColor'

function playerInitials(name: string): string {
  const parts = name.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

function CardBadge({ kind }: { kind: 'yellow' | 'red' }) {
  return (
    <span
      className={cn(
        'block h-3 w-2 rounded-[2px] border border-black/30 shadow-md ring-1 ring-white/70',
        kind === 'yellow' ? 'bg-yellow-400' : 'bg-red-600',
      )}
      aria-hidden
    />
  )
}

function GoalBadge({ count, ownGoal }: { count: number; ownGoal?: boolean }) {
  if (count <= 0) return null
  return (
    <span
      className="relative inline-flex h-3.5 w-3.5 items-center justify-center"
      title={ownGoal ? `CSC ×${count}` : `But${count > 1 ? 's' : ''} ×${count}`}
    >
      <span className={cn('text-[10px] leading-none', ownGoal ? 'text-red-600' : 'text-neutral-800')} aria-hidden>
        ⚽
      </span>
      {count > 1 ? (
        <span className="absolute -bottom-0.5 -right-1 flex h-2.5 min-w-2.5 items-center justify-center rounded-full bg-neutral-900 px-px text-[6px] font-black text-white">
          {count}
        </span>
      ) : null}
    </span>
  )
}

function LineupPlayerToken({
  name,
  fullName,
  number,
  photoUrl,
  leftPct,
  overlay,
  light,
  compact,
}: {
  name: string
  fullName: string
  number?: string
  photoUrl?: string
  leftPct: number
  overlay?: LineupPlayerMatchOverlay
  light?: boolean
  compact?: boolean
}) {
  const [photoFailed, setPhotoFailed] = useState(false)
  const bubbleSize = compact ? 'h-9 w-9' : 'h-10 w-10'
  const textSize = compact ? 'text-[7px]' : 'text-[8px]'
  const subbedOff = overlay?.subbedOffMinute != null
  const goals = overlay?.goals ?? 0
  const ownGoals = overlay?.ownGoals ?? 0
  const yellowCards = overlay?.yellowCards ?? 0
  const redCards = overlay?.redCards ?? 0
  const rating = overlay?.rating
  const showPhoto = photoUrl && !photoFailed

  return (
    <div
      className="absolute top-1/2 w-[3.25rem] max-w-[15vw] -translate-x-1/2 -translate-y-1/2 tf-lineup-player-token"
      style={{ left: `${leftPct}%` }}
      title={number ? `#${number} ${fullName}` : fullName}
    >
      <div className={cn('relative mx-auto w-fit', subbedOff && 'opacity-55')}>
        <div className="relative mx-auto w-fit">
          {rating != null ? (
            <span
              className="absolute -right-1.5 -top-1 z-20 flex h-4 min-w-4 items-center justify-center rounded px-0.5 text-[7px] font-black leading-none text-white shadow-md ring-1 ring-black/10"
              style={{ backgroundColor: lineupRatingBackground(rating) }}
            >
              {formatLineupRating(rating)}
            </span>
          ) : null}

          {(goals > 0 || ownGoals > 0) && (
            <div className="absolute -left-1 -top-1 z-20 flex flex-col gap-0.5">
              {goals > 0 ? <GoalBadge count={goals} /> : null}
              {ownGoals > 0 ? <GoalBadge count={ownGoals} ownGoal /> : null}
            </div>
          )}

          {(yellowCards > 0 || redCards > 0) && (
            <div className="absolute -left-0.5 -top-0.5 z-20 flex gap-0.5">
              {yellowCards > 0 ? <CardBadge kind="yellow" /> : null}
              {redCards > 0 ? <CardBadge kind="red" /> : null}
            </div>
          )}

          <div
            className={cn(
              'overflow-hidden rounded-full border-2 bg-white shadow-md',
              bubbleSize,
              light ? 'border-white' : 'border-white/90',
            )}
          >
            {showPhoto ? (
              <img
                src={photoUrl}
                alt=""
                className="h-full w-full object-cover object-top"
                loading="lazy"
                onError={() => setPhotoFailed(true)}
              />
            ) : (
              <div
                className={cn(
                  'flex h-full w-full items-center justify-center font-black',
                  textSize,
                  light ? 'bg-sky-100 text-sky-900/70' : 'bg-[#0a1f35] text-sky-100/85',
                )}
              >
                {playerInitials(fullName)}
              </div>
            )}
          </div>

          {number ? (
            <span
              className={cn(
                'absolute -bottom-0.5 -right-0.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full border px-0.5 text-[8px] font-black leading-none text-white',
                light
                  ? 'border-emerald-700/40 bg-emerald-500'
                  : 'border-emerald-300/50 bg-emerald-600',
              )}
            >
              {number}
            </span>
          ) : null}

          {subbedOff ? (
            <span
              className="absolute -bottom-0.5 -left-1 z-10 flex h-3.5 w-3.5 flex-col overflow-hidden rounded-[2px] border border-white/25 bg-neutral-900/90 shadow"
              title={`Sorti ${overlay!.subbedOffMinute!}′`}
            >
              <span className="flex flex-1 items-center justify-center bg-emerald-600 text-[5px] leading-none text-white">
                ↑
              </span>
              <span className="flex flex-1 items-center justify-center bg-red-600 text-[5px] leading-none text-white">
                ↓
              </span>
            </span>
          ) : null}
        </div>

        <p
          className={cn(
            'mt-0.5 truncate text-center font-bold leading-tight',
            textSize,
            light ? 'text-[#023458]' : 'text-sky-50',
          )}
        >
          {name}
        </p>
      </div>
    </div>
  )
}

export function MatchLineupPitch({
  layout,
  homeToneColor,
  awayToneColor,
  isUpcoming,
  light,
  compact,
  className,
}: {
  layout: LineupPitchLayout
  homeToneColor: string
  awayToneColor: string
  isUpcoming?: boolean
  light?: boolean
  compact?: boolean
  className?: string
}) {
  const { rows } = layout

  return (
    <div className={cn('w-full min-w-0 space-y-2', className)}>
      <div
        className={cn(
          'tf-lineup-pitch relative w-full min-w-0 overflow-hidden rounded-lg border border-emerald-300/35 bg-[#14543f]',
          compact
            ? 'aspect-[4/5] min-h-[240px] w-full max-w-full'
            : isUpcoming
              ? 'h-[280px] w-full md:h-[min(36vh,280px)]'
              : 'h-[320px] w-full md:h-[min(40vh,320px)]',
        )}
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, ${homeToneColor} 24%, #14543f) 0%, #14543f 46%, color-mix(in srgb, ${awayToneColor} 22%, #14543f) 100%)`,
        }}
      >
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/15" />
        <div className="absolute left-[8%] right-[8%] top-[6%] h-[38%] rounded-md border border-white/20" />
        <div className="absolute bottom-[6%] left-[8%] right-[8%] h-[38%] rounded-md border border-white/20" />

        {rows.map((row) => (
          <div
            key={`lineup-row-${row.row}`}
            className="tf-lineup-pitch-row absolute inset-x-[2%] h-14 sm:inset-x-[3%]"
            style={{
              top: `${row.topPct}%`,
              transform: 'translateY(-50%)',
            }}
          >
            {row.players.map((p) => (
              <LineupPlayerToken
                key={`${row.row}-${p.col}-${p.number ?? ''}-${p.fullName}`}
                name={p.name}
                fullName={p.fullName}
                number={p.number}
                photoUrl={p.photoUrl}
                leftPct={p.leftPct}
                overlay={p.overlay}
                light={light}
                compact={compact}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
