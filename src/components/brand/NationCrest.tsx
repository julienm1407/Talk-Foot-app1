import type { Nation } from '../../data/nations'
import { cn } from '../../utils/cn'

/**
 * Pastille « drapeau + initiales » d'une sélection nationale.
 * Simple et léger — on garde les couleurs vraies du drapeau pour la lisibilité.
 */
export function NationCrest({
  nation,
  size = 'md',
  className,
  withRing = true,
}: {
  nation: Nation
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  withRing?: boolean
}) {
  const dims =
    size === 'sm'
      ? 'h-7 w-7 text-[11px]'
      : size === 'md'
        ? 'h-10 w-10 text-base'
        : size === 'lg'
          ? 'h-14 w-14 text-xl'
          : 'h-20 w-20 text-3xl'

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full text-white shadow-sm',
        dims,
        withRing ? 'ring-2 ring-white/70 dark:ring-white/30' : null,
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${nation.primary} 0%, ${nation.secondary} 100%)`,
        color: nation.accent,
      }}
      aria-label={`Drapeau ${nation.nameFr}`}
      title={nation.nameFr}
    >
      <span aria-hidden className="leading-none drop-shadow-sm">
        {nation.flag}
      </span>
    </span>
  )
}
