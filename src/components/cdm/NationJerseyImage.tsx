import type { Nation } from '../../data/nations'
import { cn } from '../../utils/cn'

/** Zoom visuel uniforme des PNG maillot (souvent petits à l’intrinsèque). */
const JERSEY_SCALE = 3

type NationJerseyImageProps = {
  nation: Pick<Nation, 'jerseyUrl' | 'nameFr'>
  variant?: 'hero' | 'card'
  className?: string
  wrapperClassName?: string
}

/**
 * Maillot nation — rendu agrandi (×3) pour toutes les fiches / cartes CDM.
 */
export function NationJerseyImage({
  nation,
  variant = 'card',
  className,
  wrapperClassName,
}: NationJerseyImageProps) {
  const isHero = variant === 'hero'

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-visible',
        isHero
          ? 'min-h-[calc(6.5rem*3)] w-[min(12rem,34vw)] sm:min-h-[calc(8rem*3)] sm:w-[min(15rem,24vw)]'
          : 'min-h-[calc(2.85rem*3)] w-full flex-1 px-1 pt-2',
        wrapperClassName,
      )}
    >
      <img
        src={nation.jerseyUrl}
        alt={`Maillot ${nation.nameFr}`}
        loading="lazy"
        decoding="async"
        draggable={false}
        className={cn(
          'pointer-events-none w-auto select-none object-contain origin-bottom',
          isHero
            ? 'h-[6.5rem] drop-shadow-[0_18px_28px_rgba(0,0,0,0.4)] sm:h-[8rem]'
            : 'h-[2.85rem] drop-shadow-[0_8px_14px_rgba(0,0,0,0.35)]',
          className,
        )}
        style={{ transform: `scale(${JERSEY_SCALE})` }}
      />
    </div>
  )
}
