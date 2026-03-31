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
    return <div className={cn('mx-auto w-full min-w-0', centerClass)}>{children}</div>
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
            body="Emplacement skyscraper gauche — mock pour intégration réelle (GPT, IAB, etc.)."
          />
          <AdSlot
            variant="rail"
            imageSeed="tf-rail-left-b"
            tone="blue"
            brand="Offre tribune"
            body="Second encart latéral — visible sur grands écrans uniquement."
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
            body="Colonne droite — même format que la gauche pour équilibre visuel."
          />
          <AdSlot
            variant="rail"
            imageSeed="tf-rail-right-b"
            tone="navy"
            brand="Équipement pro"
            body="Rappel : visuels fictifs ; remplacer par vos créas ou scripts ad server."
          />
        </div>
      </aside>
    </div>
  )
}
