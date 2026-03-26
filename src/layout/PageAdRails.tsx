import { AdSlot } from '../components/ui/AdSlot'

/**
 * Colonnes publicitaires sur les côtés du contenu principal (xl+).
 * Le centre reste lisible ; les bandeaux utilisent des visuels mock (picsum).
 */
export function PageAdRails({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[1720px] justify-center gap-2 sm:gap-3 xl:gap-4 2xl:gap-6">
      <aside
        className="hidden w-[min(132px,11vw)] shrink-0 xl:block 2xl:w-[min(152px,12vw)]"
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

      <div className="min-w-0 flex-1 max-w-[1240px]">{children}</div>

      <aside
        className="hidden w-[min(132px,11vw)] shrink-0 xl:block 2xl:w-[min(152px,12vw)]"
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
