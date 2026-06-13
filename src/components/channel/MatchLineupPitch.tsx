import { cn } from '../../utils/cn'
import type { LineupPitchLayout } from '../../utils/lineupPitchPositions'

function PlayerChip({
  name,
  number,
  light,
  compact,
}: {
  name: string
  number?: string
  light?: boolean
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'min-w-0 flex-1 basis-0 truncate rounded border px-0.5 py-0.5 text-center font-bold leading-tight',
        compact ? 'text-[8px] sm:text-[9px]' : 'text-[9px] sm:text-[10px]',
        light
          ? 'border-sky-400/45 bg-white/95 text-[#023458] shadow-sm'
          : 'border-cyan-200/50 bg-[#062235]/95 text-sky-50 shadow-[0_2px_6px_rgba(0,0,0,0.35)]',
      )}
      title={number ? `#${number} ${name}` : name}
    >
      {number ? (
        <>
          <span className={light ? 'text-emerald-700' : 'text-emerald-300'}>{number}</span>{' '}
        </>
      ) : null}
      {name}
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
            ? 'aspect-[4/5] min-h-[260px] w-full'
            : isUpcoming
              ? 'h-[260px] md:h-[min(34vh,260px)]'
              : 'h-[300px] md:h-[min(38vh,300px)]',
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
            className="absolute inset-x-[4%] flex items-center justify-evenly gap-0.5"
            style={{
              top: `${row.topPct}%`,
              transform: 'translateY(-50%)',
              maxHeight: '14%',
            }}
          >
            {row.players.map((p) => (
              <PlayerChip
                key={`${row.row}-${p.col}-${p.number ?? ''}-${p.name}`}
                name={p.name}
                number={p.number}
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
