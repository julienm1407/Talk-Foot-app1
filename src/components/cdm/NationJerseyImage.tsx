import type { Nation } from '../../data/nations'
import { cn } from '../../utils/cn'

/** Zoom visuel ×3 — PNG souvent petits à l’intrinsèque ; scale depuis le centre pour ne pas décaler. */
const JERSEY_SCALE = 3

type NationJerseyImageProps = {
  nation: Pick<Nation, 'jerseyUrl' | 'nameFr'>
  variant?: 'hero' | 'card'
  className?: string
}

/**
 * Maillot nation agrandi (×3), centré sur place — fiches et cartes CDM.
 */
export function NationJerseyImage({
  nation,
  variant = 'card',
  className,
}: NationJerseyImageProps) {
  const isHero = variant === 'hero'

  return (
    <img
      src={nation.jerseyUrl}
      alt={`Maillot ${nation.nameFr}`}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={cn(
        'pointer-events-none w-auto select-none object-contain origin-center',
        isHero
          ? 'max-h-[5rem] drop-shadow-[0_18px_28px_rgba(0,0,0,0.4)] sm:max-h-[6rem]'
          : 'max-h-[2.85rem] drop-shadow-[0_8px_14px_rgba(0,0,0,0.35)]',
        className,
      )}
      style={{ transform: `scale(${JERSEY_SCALE})` }}
    />
  )
}
