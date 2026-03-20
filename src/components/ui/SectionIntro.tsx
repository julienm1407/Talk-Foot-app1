import { cn } from '../../utils/cn'

type Props = {
  /** Petit libellé (CAPS + tracking) — loi de similarité entre les pages */
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
  titleId?: string
}

/**
 * Bloc d’introduction de section : regroupe titre + texte + actions (proximité, hiérarchie).
 */
export function SectionIntro({
  eyebrow,
  title,
  description,
  actions,
  className,
  titleId,
}: Props) {
  return (
    <div
      className={cn(
        'mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4',
        className,
      )}
    >
      <div className="min-w-0 max-w-prose space-y-1">
        {eyebrow ? (
          <p className="text-[11px] font-black tracking-[0.2em] text-tf-electric-deep">{eyebrow}</p>
        ) : null}
        <h2
          id={titleId}
          className="font-display text-2xl font-black tracking-tight text-tf-dark sm:text-3xl"
        >
          {title}
          <span className="mt-2 block h-1 w-12 rounded-full bg-tf-electric sm:w-16" aria-hidden />
        </h2>
        {description ? (
          <p className="text-sm font-semibold leading-relaxed text-tf-dark/75">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
