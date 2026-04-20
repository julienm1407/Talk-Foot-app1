import { AdSlot } from '../components/ui/AdSlot'
import { cn } from '../utils/cn'

type CenterMax = 'content' | 'ultra'

/**
 * Colonnes publicitaires (xl+) autour du contenu, ou colonne centrale seule (accueil hub).
 * Mobile-first : pas de rails sur petit écran ; flex + min-w-0 pour éviter les débordements.
 */
export function PageAdRails({
  children,
  variant = 'rails',
  centerMax = 'content',
}: {
  children: React.ReactNode
  /** `centerOnly` : pas de colonnes latérales (largeur max hub). */
  variant?: 'rails' | 'centerOnly'
  /** Largeur max de la zone centrale. */
  centerMax?: CenterMax
}) {
  const centerClass = centerMax === 'ultra' ? 'max-w-tf-ultra' : 'max-w-tf-content'

  if (variant === 'centerOnly') {
    return (
      <div
        className={cn(
          'mx-auto flex w-full min-w-0 flex-col',
          centerClass,
          'md:h-full md:min-h-0 md:flex-1 md:overflow-hidden',
        )}
      >
        {children}
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-tf-rails min-w-0 justify-center gap-2 sm:gap-3 xl:gap-4 2xl:gap-6">
      <aside
        className="hidden w-[var(--tf-rail-ad-width)] shrink-0 2xl:w-[var(--tf-rail-ad-width-2xl)] xl:block"
        aria-label="Espace publicitaire gauche"
      >
        <div className="sticky top-[5.25rem] space-y-4 pb-8">
          <AdSlot
            variant="rail"
            imageSeed="tf-rail-left-a"
            tone="navy"
            brand="Partenaire officiel"
            body="Espace partenaire"
          />
          <AdSlot
            variant="rail"
            imageSeed="tf-rail-left-b"
            tone="blue"
            brand="Offre tribune"
            body="Offre partenaire"
          />
        </div>
      </aside>

      <div className={cn('min-w-0 flex-1', centerClass)}>{children}</div>

      <aside
        className="hidden w-[var(--tf-rail-ad-width)] shrink-0 2xl:w-[var(--tf-rail-ad-width-2xl)] xl:block"
        aria-label="Espace publicitaire droite"
      >
        <div className="sticky top-[5.25rem] space-y-4 pb-8">
          <AdSlot
            variant="rail"
            imageSeed="tf-rail-right-a"
            tone="sky"
            brand="Streaming & stats"
            body="Espace partenaire"
          />
          <AdSlot
            variant="rail"
            imageSeed="tf-rail-right-b"
            tone="navy"
            brand="Équipement pro"
            body="Offre partenaire"
          />
        </div>
      </aside>
    </div>
  )
}
