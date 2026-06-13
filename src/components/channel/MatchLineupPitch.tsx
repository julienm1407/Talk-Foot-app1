import { cn } from '../../utils/cn'
import type { LineupPitchLayout } from '../../utils/lineupPitchPositions'

function playerInitials(name: string): string {
  const parts = name.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

function LineupPlayerToken({
  name,
  number,
  photoUrl,
  leftPct,
  light,
  compact,
}: {
  name: string
  number?: string
  photoUrl?: string
  leftPct: number
  light?: boolean
  compact?: boolean
}) {
  const size = compact ? 'h-8 w-8' : 'h-9 w-9'
  const textSize = compact ? 'text-[7px]' : 'text-[8px]'

  return (
    <div
      className="absolute top-1/2 w-[3.25rem] max-w-[14vw] -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${leftPct}%` }}
      title={number ? `#${number} ${name}` : name}
    >
      <div className="relative mx-auto w-fit">
        <div
          className={cn(
            'overflow-hidden rounded-full border-2 shadow-md',
            size,
            light ? 'border-white bg-sky-100' : 'border-white/90 bg-[#0a1f35]',
          )}
        >
          {photoUrl ? (
            <img src={photoUrl} alt="" className="h-full w-full object-cover object-top" loading="lazy" />
          ) : (
            <div
              className={cn(
                'flex h-full w-full items-center justify-center font-black',
                textSize,
                light ? 'text-sky-900/70' : 'text-sky-100/80',
              )}
            >
              {playerInitials(name)}
            </div>
          )}
        </div>
        {number ? (
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border px-0.5 text-[8px] font-black leading-none',
              light
                ? 'border-emerald-700/40 bg-emerald-500 text-white'
                : 'border-emerald-300/50 bg-emerald-600 text-white',
            )}
          >
            {number}
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
  const { rows, roster } = layout

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'tf-lineup-pitch relative overflow-hidden rounded-lg border border-emerald-300/35 bg-[#14543f]',
          compact
            ? 'aspect-[4/5] min-h-[280px] w-full'
            : isUpcoming
              ? 'h-[280px] md:h-[min(36vh,280px)]'
              : 'h-[320px] md:h-[min(40vh,320px)]',
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
            className="absolute inset-x-[3%] h-14"
            style={{
              top: `${row.topPct}%`,
              transform: 'translateY(-50%)',
            }}
          >
            {row.players.map((p) => (
              <LineupPlayerToken
                key={`${row.row}-${p.col}-${p.number ?? ''}-${p.name}`}
                name={p.name}
                number={p.number}
                photoUrl={p.photoUrl}
                leftPct={p.leftPct}
                light={light}
                compact={compact}
              />
            ))}
          </div>
        ))}
      </div>

      {roster.length > 0 ? (
        <div
          className={cn(
            'grid grid-cols-2 gap-x-2 gap-y-1 rounded-md border border-white/10 bg-black/20 px-2 py-1.5',
            compact ? 'text-[9px]' : 'text-[10px]',
          )}
        >
          {roster.map((p) => (
            <div
              key={`roster-${p.number ?? ''}-${p.name}`}
              className={cn('min-w-0 truncate font-semibold', light ? 'text-sky-900/90' : 'text-sky-100/92')}
              title={p.name}
            >
              {p.number ? (
                <span className={cn('mr-1 font-black', light ? 'text-emerald-700' : 'text-emerald-300')}>
                  {p.number}
                </span>
              ) : null}
              {p.name}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
