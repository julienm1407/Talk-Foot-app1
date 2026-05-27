import { Link } from 'react-router-dom'
import { useAppearance } from '../../contexts/AppearanceContext'
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_PUBLISHER_NAME,
  legalContactMailto,
} from '../../constants/siteLegal'
import { cn } from '../../utils/cn'

export function SiteLegalFooter({
  className,
  compact = false,
}: {
  className?: string
  /** Tribune live : une ligne plus courte */
  compact?: boolean
}) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  const linkClass = cn(
    'font-bold underline-offset-2 hover:underline',
    L ? 'text-tf-cta' : 'text-sky-300',
  )

  return (
    <footer
      className={cn(
        'shrink-0 border-t px-[var(--tf-page-gutter)] py-3 sm:py-4',
        L ? 'border-tf-dark/10 bg-tf-dark/[0.03]' : 'border-white/10 bg-black/20',
        className,
      )}
      aria-label="Informations légales"
    >
      <div
        className={cn(
          'mx-auto flex w-full max-w-tf-content flex-col gap-2',
          compact ? 'text-[10px]' : 'text-[11px]',
        )}
      >
        <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 font-semibold">
          <Link to="/about" className={linkClass}>
            À propos
          </Link>
          <Link to="/privacy" className={linkClass}>
            Confidentialité
          </Link>
          <Link to="/terms" className={linkClass}>
            CGU
          </Link>
          <a href={legalContactMailto('Contact Talk Foot')} className={linkClass}>
            Contact
          </a>
        </nav>
        <p className={cn('font-medium leading-snug', L ? 'text-tf-app-muted' : 'text-sky-200/75')}>
          {LEGAL_PUBLISHER_NAME} ·{' '}
          <a href={legalContactMailto()} className={cn(linkClass, 'font-semibold')}>
            {LEGAL_CONTACT_EMAIL}
          </a>
          {!compact ? (
            <>
              {' '}
              · Paris entre supporters (jetons fictifs, sans argent réel). Les tribunes de discussion n&apos;affichent
              pas de publicité.
            </>
          ) : null}
        </p>
      </div>
    </footer>
  )
}
