import { cn } from '../../utils/cn'

export function DebateRankBadge({
  rank,
  className,
  size = 'md',
}: {
  rank: number
  className?: string
  size?: 'sm' | 'md'
}) {
  const tone =
    rank === 1
      ? 'bg-amber-400/95 text-amber-950 ring-amber-200/80'
      : rank === 2
        ? 'bg-slate-200/95 text-slate-800 ring-white/50'
        : rank === 3
          ? 'bg-orange-300/90 text-orange-950 ring-orange-100/70'
          : 'bg-white/20 text-white ring-white/30'

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-black tabular-nums ring-1',
        size === 'sm' ? 'min-w-[1.65rem] px-1.5 py-0.5 text-[10px]' : 'min-w-[2rem] px-2 py-0.5 text-xs',
        tone,
        className,
      )}
      title={`Rang ${rank} au classement`}
    >
      #{rank}
    </span>
  )
}
