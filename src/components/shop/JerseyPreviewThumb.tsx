import type { AvatarItem } from '../../types/profile'
import { DEFAULT_CHARACTER_LOOK } from '../../data/characterPresets'
import { CharacterAvatarSvg } from '../profile/CharacterAvatarSvg'
import { cn } from '../../utils/cn'

export function JerseyPreviewThumb({
  item,
  /** `showcase` : cartes boutique / modal — maillot plus lisible */
  size = 'default',
}: {
  item: AvatarItem
  size?: 'default' | 'showcase'
}) {
  if (!item.jerseyVisual) {
    return (
      <span className={cn('drop-shadow-md', size === 'showcase' ? 'text-6xl sm:text-7xl' : 'text-4xl')}>
        {item.emoji}
      </span>
    )
  }

  const pixelJersey = item.jerseyVisual.pixelPreset
    ? { preset: item.jerseyVisual.pixelPreset }
    : null

  const pixelBoost = Boolean(pixelJersey)

  return (
    <div
      className={cn(
        'flex items-center justify-center',
        size === 'showcase'
          ? pixelBoost
            ? 'min-h-[14rem] w-full max-w-[15rem] py-1 sm:min-h-[15.5rem] sm:max-w-[16rem]'
            : 'min-h-[10.5rem] w-full max-w-[11rem] py-1 sm:min-h-[12rem] sm:max-w-[12.5rem]'
          : pixelBoost
            ? 'h-40 w-36'
            : 'h-28 w-24',
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
            ? pixelBoost
              ? 'max-h-[min(340px,72vw)] max-w-[min(246px,56vw)] sm:max-h-[360px] sm:max-w-[258px]'
              : 'max-h-[min(220px,52vw)] max-w-[min(158px,38vw)] sm:max-h-[240px] sm:max-w-[172px]'
            : pixelBoost
              ? 'max-h-[10rem] max-w-[7.75rem]'
              : undefined
        }
      />
    </div>
  )
}
