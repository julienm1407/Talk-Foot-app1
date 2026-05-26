import type { AvatarItem } from '../../types/profile'
import { AvatarWearingJerseyPng } from './AvatarWearingJerseyPng'
import { cn } from '../../utils/cn'

/**
 * Vignette boutique d'un item :
 *  · Maillot avec `jerseyVisual.imageUrl` (PNG officiel CDM) → avatar 2D
 *    portant le maillot photo-réaliste superposé sur le torse.
 *  · Sinon (accessoires, casquettes, écharpes, short, chaussures…) → emoji.
 *
 * Les anciens maillots SVG « inspirés » ont été retirés du catalogue : tout
 * passe désormais par les PNG officiels CDM 2026.
 */

const SHOWCASE_FRAME =
  'flex h-44 w-full max-w-[13rem] shrink-0 items-center justify-center sm:h-48 sm:max-w-[14rem]'

export function JerseyPreviewThumb({
  item,
  /** `showcase` : cartes boutique / modal — taille unique pour tous les personnages */
  size = 'default',
}: {
  item: AvatarItem
  size?: 'default' | 'showcase'
}) {
  const imageUrl = item.jerseyVisual?.imageUrl

  if (imageUrl) {
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          size === 'showcase' ? SHOWCASE_FRAME : 'h-28 w-24',
        )}
      >
        <div
          className={cn(
            size === 'showcase'
              ? 'h-[min(220px,48vw)] w-[min(170px,44vw)] sm:h-[240px] sm:w-[184px]'
              : 'h-28 w-24',
          )}
        >
          <AvatarWearingJerseyPng
            imageUrl={imageUrl}
            alt={`Maillot ${item.name}`}
            torsoTone={
              item.jerseyVisual
                ? {
                    primary: item.jerseyVisual.primary,
                    secondary: item.jerseyVisual.secondary,
                    stripeLight: item.jerseyVisual.stripeLight,
                  }
                : undefined
            }
          />
        </div>
      </div>
    )
  }

  // Fallback emoji — tous les items non-maillot (accessoires, écharpe, hat, pants, shoes).
  if (size === 'showcase') {
    return (
      <div className={SHOWCASE_FRAME}>
        <span
          className="select-none text-6xl leading-none drop-shadow-[0_4px_14px_rgba(0,0,0,0.5)] sm:text-7xl"
          aria-hidden
        >
          {item.emoji}
        </span>
      </div>
    )
  }
  return <span className="text-4xl drop-shadow-md">{item.emoji}</span>
}
