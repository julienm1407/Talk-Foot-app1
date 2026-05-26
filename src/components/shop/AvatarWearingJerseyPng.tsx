import { CharacterAvatarSvg, type TorsoColors } from '../profile/CharacterAvatarSvg'
import { DEFAULT_CHARACTER_LOOK } from '../../data/characterPresets'
import { cn } from '../../utils/cn'

/**
 * Vignette « personnage portant le maillot officiel CDM ».
 *
 * Empilement (du fond vers la surface) :
 *   1) Couche fond  — silhouette complète (tête, bras, jambes, short), torse
 *      en couleur neutre (mannequin sous le maillot).
 *   2) Couche maillot — PNG officiel positionné précisément sur le buste.
 *      Sa hauteur est limitée et ancrée au sommet ; un mask radial elliptique
 *      retire le coin haut-centre pour qu'aucun pixel ne déborde dans la zone
 *      visage (col en V conservé, mais pas de chevauchement avec la tête).
 *   3) Couche tête  — second rendu du même avatar, clippé sur la zone crâne
 *      uniquement, posé par-dessus le maillot. Cela garantit que la tête reste
 *      visible (devant) sans qu'on perde l'effet « maillot porté » sur le bas.
 *
 * Aucune animation : ces vignettes sont des fiches produit, elles ne bougent
 * pas (l'animation flottante est désactivée pour ce type d'item dans la
 * grille boutique).
 */

/** Zone clip de la tête en % du conteneur (viewBox SVG 100×140). */
const HEAD_CLIP_BOTTOM_PCT = 56

/** Mask radial qui evide le haut-centre du maillot (zone tête + col). */
const JERSEY_HEAD_CUTOUT =
  'radial-gradient(ellipse 28% 22% at 50% 6%, transparent 70%, black 92%)'

export function AvatarWearingJerseyPng({
  imageUrl,
  alt,
  torsoTone,
  className,
}: {
  imageUrl: string
  alt: string
  torsoTone?: { primary: string; secondary: string; stripeLight?: string }
  className?: string
}) {
  const jerseyOverride: TorsoColors = {
    primary: torsoTone?.primary ?? '#0c2244',
    secondary: torsoTone?.secondary ?? '#0c2244',
    pattern: 'solid',
    stripeLight: torsoTone?.stripeLight ?? '#ffffff',
  }

  return (
    <div className={cn('relative flex h-full w-full items-end justify-center', className)}>
      {/* 1) Silhouette complète (fond) */}
      <div className="absolute inset-0">
        <CharacterAvatarSvg
          look={DEFAULT_CHARACTER_LOOK}
          jerseyOverride={jerseyOverride}
          supporterColors={null}
          variant="front"
          className="h-full w-full max-h-none max-w-none"
        />
      </div>

      {/* 2) Maillot PNG officiel — ancré sous le menton, evidé sur la zone tête */}
      <img
        src={imageUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        aria-hidden
        style={{
          maskImage: JERSEY_HEAD_CUTOUT,
          WebkitMaskImage: JERSEY_HEAD_CUTOUT,
        }}
        className={cn(
          'pointer-events-none absolute left-1/2 -translate-x-1/2',
          'top-[26%] w-[86%] max-w-none select-none object-contain object-top',
          'drop-shadow-[0_10px_24px_rgba(0,0,0,0.4)]',
        )}
      />

      {/* 3) Re-rendu de la tête par-dessus, clippé sur la moitié haute */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          clipPath: `inset(0 0 ${100 - HEAD_CLIP_BOTTOM_PCT}% 0)`,
          WebkitClipPath: `inset(0 0 ${100 - HEAD_CLIP_BOTTOM_PCT}% 0)`,
        }}
        aria-hidden
      >
        <CharacterAvatarSvg
          look={DEFAULT_CHARACTER_LOOK}
          jerseyOverride={jerseyOverride}
          supporterColors={null}
          variant="front"
          className="h-full w-full max-h-none max-w-none"
        />
      </div>
    </div>
  )
}
