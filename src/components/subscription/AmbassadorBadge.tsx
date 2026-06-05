import { cn } from '../../utils/cn'

/** Badge statut Ambassadeur (formule Ambassadeur). */
export function AmbassadorBadge({
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
          ? 'border-amber-400/55 bg-amber-500/20 px-1 text-[8px] text-amber-100'
          : 'border-amber-400/50 bg-amber-500/15 px-1.5 text-[9px] text-amber-100',
        className,
      )}
      title="Ambassadeur Talk Foot"
      aria-label="Ambassadeur Talk Foot"
    >
      👑
    </span>
  )
}
