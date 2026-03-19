import { cn } from '../../utils/cn'

export function HypeMeter({
  value,
  totalReactions = 0,
  className,
  homeColor,
  awayColor,
}: {
  value: number // 0..100
  totalReactions?: number
  className?: string
  homeColor?: string
  awayColor?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  const label =
    clamped >= 85
      ? 'MODE STADE'
      : clamped >= 65
        ? 'AMBIANCE'
        : clamped >= 40
          ? 'ÇA MONTE'
          : 'CALME'

  const isHot = clamped >= 65

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-black tracking-[0.12em] text-slate-600">
          AMBIANCE LIVE
        </span>
        <div className="flex items-center gap-2">
          {totalReactions > 0 && (
            <span className="text-[10px] font-bold tabular-nums text-slate-500">
              {totalReactions} réaction{totalReactions > 1 ? 's' : ''}
            </span>
          )}
          <span
            className={cn(
              'rounded-md px-2 py-0.5 text-xs font-black tracking-wide',
              isHot ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600',
            )}
          >
            {label}
          </span>
        </div>
      </div>
      <div
        className={cn(
          'relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/80',
          isHot && 'ring-rose-200/60',
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            isHot && 'shadow-[0_0_12px_rgba(244,63,94,0.4)]',
          )}
          style={{
            width: `${clamped}%`,
            background: homeColor && awayColor
              ? `linear-gradient(90deg, ${homeColor}, ${awayColor})`
              : 'linear-gradient(90deg, #011e33, #5d86a2)',
          }}
          aria-hidden="true"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          role="progressbar"
        />
        {isHot && (
          <div
            className="absolute inset-0 pointer-events-none rounded-full tf-hype-glow"
            style={{
              background: `linear-gradient(90deg, transparent, ${homeColor ?? '#011e33'}40, ${awayColor ?? '#5d86a2'}40, transparent)`,
            }}
          />
        )}
      </div>
    </div>
  )
}

