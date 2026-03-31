import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'
import type { AppSectionId } from '../../theme/appSectionThemes'
import { getAppSectionTheme } from '../../theme/appSectionThemes'
import { useAppearance } from '../../contexts/AppearanceContext'

/** Sombre : libellés caps lisibles sur fond bleu nuit. */
function eyebrowDarkClass() {
  return 'text-sky-100'
}

type Props = {
  /** Petit libellé (CAPS) — même style sur tout le site */
  eyebrow?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
  titleId?: string
  /** Moins de texte secondaire sur mobile */
  compact?: boolean
  /** Teinte de section (navigation & hiérarchie visuelle) */
  section?: AppSectionId
  /** Titre principal de page (SEO) vs sous-section */
  titleAs?: 'h1' | 'h2'
  /** Désactiver le caps lock sur le titre (pages « sentence case ») */
  uppercaseTitle?: boolean
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
  section,
  titleAs = 'h2',
  uppercaseTitle = true,
}: Props) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const tone = section ? getAppSectionTheme(section) : null
  const TitleTag = titleAs

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b pb-4 sm:gap-4 sm:pb-5',
        L ? tone?.page.borderBottomClass ?? 'border-tf-grey-pastel/50' : 'border-white/15',
        compact ? 'mb-4 sm:mb-5' : 'mb-5 sm:mb-6',
        'sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-6 sm:gap-y-3',
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-2 sm:space-y-3">
        {eyebrow ? (
          <p
            className={cn(
              'text-[11px] font-black uppercase tracking-[0.22em] sm:text-xs',
              L ? tone?.page.eyebrowClass ?? 'text-tf-electric-deep' : eyebrowDarkClass(),
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <TitleTag
          id={titleId}
          className={cn(
            'font-display font-black leading-[1.1] tracking-tight text-tf-app-fg',
            uppercaseTitle && 'uppercase',
            compact
              ? 'text-xl sm:text-2xl'
              : 'text-2xl sm:text-[1.65rem] lg:text-3xl lg:leading-[1.08]',
          )}
        >
          {title}
        </TitleTag>
        {description ? (
          <p
            className={cn(
              'max-w-2xl text-sm font-medium leading-relaxed text-tf-app-muted',
              compact && 'line-clamp-2 sm:line-clamp-none',
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
