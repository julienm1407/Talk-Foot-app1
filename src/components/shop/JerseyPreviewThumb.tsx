import type { AvatarItem } from '../../types/profile'
import { DEFAULT_CHARACTER_LOOK } from '../../data/characterPresets'
import { CharacterAvatarSvg } from '../profile/CharacterAvatarSvg'
import { cn } from '../../utils/cn'

/** Même cadre pour toutes les vignettes boutique (maillot pixel ou non, emoji). */
const SHOWCASE_FRAME =
  'flex h-44 w-full max-w-[13rem] shrink-0 items-center justify-center sm:h-48 sm:max-w-[14rem]'
const SHOWCASE_AVATAR =
  'max-h-[min(220px,48vw)] max-w-[min(158px,40vw)] sm:max-h-[240px] sm:max-w-[172px]'

export function JerseyPreviewThumb({
  item,
  /** `showcase` : cartes boutique / modal — taille unique pour tous les personnages */
  size = 'default',
}: {
  item: AvatarItem
  size?: 'default' | 'showcase'
}) {
  if (!item.jerseyVisual) {
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

  const pixelJersey = item.jerseyVisual.pixelPreset
    ? { preset: item.jerseyVisual.pixelPreset }
    : null

  const pixelBoost = Boolean(pixelJersey)

  return (
    <div
      className={cn(
        'flex items-center justify-center',
        size === 'showcase' ? SHOWCASE_FRAME : pixelBoost ? 'h-40 w-36' : 'h-28 w-24',
      )}
    >
      <CharacterAvatarSvg
        look={DEFAULT_CHARACTER_LOOK}
        jerseyOverride={{
          primary: item.jerseyVisual.primary,
          secondary: item.jerseyVisual.secondary,
          pattern: item.jerseyVisual.pattern,
          stripeLight: item.jerseyVisual.stripeLight,
        }}
        supporterColors={null}
        variant="front"
        pixelJersey={pixelJersey}
        className={
          size === 'showcase'
            ? SHOWCASE_AVATAR
            : pixelBoost
              ? 'max-h-[10rem] max-w-[7.75rem]'
              : undefined
        }
      />
    </div>
  )
}
