import { cn } from '../../utils/cn'

/** Badge compact « beta CDM » à côté du pseudo (profil, chat). */
export function CdmBetaBadge({
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
          ? 'size-3.5 border-sky-400/55 bg-gradient-to-br from-sky-500/25 to-blue-700/30 text-[8px] text-sky-50'
          : 'size-4 border-sky-400/50 bg-gradient-to-br from-sky-500/20 to-blue-700/25 px-1 text-[9px] text-sky-50',
        className,
      )}
      title="Beta CDM 2026 — participant de la beta Coupe du Monde"
      aria-label="Beta CDM 2026"
    >
      ★
    </span>
  )
}
