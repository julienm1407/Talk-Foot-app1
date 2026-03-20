import { cn } from '../utils/cn'

const LOGO_PATH = `${import.meta.env.BASE_URL}logo-talk-foot.png`

type LogoVariant = 'compact' | 'header' | 'hero'

const variantClass: Record<LogoVariant, string> = {
  /** Barre latérale, menu */
  compact: 'h-9 sm:h-10',
  /** Top bar */
  header: 'h-9 sm:h-10',
  /** Connexion / landing */
  hero: 'h-14 w-auto sm:h-[4.5rem]',
}

type Props = {
  variant?: LogoVariant
  className?: string
  /** false = image porte le nom (accessibilité) ; true = décoratif si le parent a un libellé */
  decorative?: boolean
}

/**
 * Logo officiel Talk Foot (wordmark TALK / FOOT — PNG dans public/).
 */
export function LogoMark({ variant = 'compact', className, decorative = true }: Props) {
  return (
    <img
      src={LOGO_PATH}
      alt={decorative ? '' : 'Talk Foot'}
      width={320}
      height={160}
      className={cn('w-auto max-w-[min(100%,200px)] shrink-0 object-contain object-left', variantClass[variant], className)}
      draggable={false}
      {...(decorative ? { 'aria-hidden': true as const } : {})}
    />
  )
}
