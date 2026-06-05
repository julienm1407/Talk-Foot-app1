import { cn } from '../../utils/cn'

/** Badge « compte vérifié » (Ultra / Ambassadeur). */
export function VerifiedBadge({
  className,
  size = 'sm',
}: {
  className?: string
  size?: 'xs' | 'sm'
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border font-black leading-none',
        size === 'xs'
          ? 'size-3.5 border-sky-400/55 bg-sky-500/20 text-[8px] text-sky-100'
          : 'size-4 border-sky-400/50 bg-sky-500/15 px-1 text-[9px] text-sky-100',
        className,
      )}
      title="Compte vérifié"
      aria-label="Compte vérifié"
    >
      ✓
    </span>
  )
}
