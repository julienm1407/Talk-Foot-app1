import type { AvatarItem } from '../../types/profile'
import { DEFAULT_CHARACTER_LOOK } from '../../data/characterPresets'
import { CharacterAvatarSvg } from '../profile/CharacterAvatarSvg'

export function JerseyPreviewThumb({ item }: { item: AvatarItem }) {
  if (!item.jerseyVisual) {
    return <span className="text-4xl">{item.emoji}</span>
  }
  return (
    <div className="flex h-28 w-24 items-center justify-center">
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
      />
    </div>
  )
}
