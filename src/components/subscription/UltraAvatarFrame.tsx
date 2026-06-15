import { cn } from '../../utils/cn'

/** Contour doré Ultra — overlay exact, la PP reste visible en dessous. */
export function UltraAvatarFrame({
  size = 'salon',
  className,
}: {
  size?: 'salon' | 'compact'
  className?: string
}) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 z-10 rounded-full',
        size === 'compact' ? 'border-[1.5px]' : 'border-2',
        'border-amber-400/95',
        size === 'compact'
          ? 'shadow-[0_0_4px_rgba(251,191,36,0.75),inset_0_0_2px_rgba(251,191,36,0.35)]'
          : 'shadow-[0_0_6px_rgba(251,191,36,0.85),inset_0_0_3px_rgba(251,191,36,0.4)]',
        className,
      )}
    />
  )
}
