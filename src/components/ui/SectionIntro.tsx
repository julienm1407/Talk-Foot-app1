import { cn } from '../../utils/cn'

type Props = {
  /** Petit libellé (CAPS) — même style sur tout le site */
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
  titleId?: string
  /** Moins de texte secondaire sur mobile */
  compact?: boolean
}

/**
 * Introduction de section : titre très visible, sous-titre optionnel court, actions alignées (Gestalt).
 */
export function SectionIntro({
  eyebrow,
  title,
  description,
  actions,
  className,
  titleId,
  compact,
}: Props) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-tf-grey-pastel/50 pb-4 sm:gap-4 sm:pb-5',
        compact ? 'mb-4 sm:mb-5' : 'mb-5 sm:mb-6',
        'sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-6 sm:gap-y-3',
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-2 sm:space-y-3">
        {eyebrow ? (
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-tf-electric-deep sm:text-xs">
            {eyebrow}
          </p>
        ) : null}
        <h2
          id={titleId}
          className={cn(
            'font-display font-black uppercase leading-[1.1] tracking-tight text-tf-dark',
            compact
              ? 'text-xl sm:text-2xl'
              : 'text-2xl sm:text-[1.65rem] lg:text-3xl lg:leading-[1.08]',
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              'max-w-2xl text-sm font-semibold leading-relaxed text-tf-dark/75',
              compact && 'line-clamp-2 text-tf-grey sm:line-clamp-none sm:text-tf-dark/75',
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
