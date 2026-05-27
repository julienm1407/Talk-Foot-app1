/**
 * Rendu avatar TalkFoot — délègue au système mascotte modulaire (SVG chibi maillot-first).
 */
import type { AvatarCharacterLook } from '../../types/profile'
import type { PixelJerseyPresetId } from '../../data/pixelJerseyPresets'
import { MascotAvatar, type TorsoColors } from '../mascot/MascotAvatar'

export type { TorsoColors }

export function CharacterAvatarSvg({
  look,
  jerseyOverride,
  supporterColors,
  variant,
  flocage,
  suppressBaseHeadwear,
  className,
  pixelJersey,
  pantsItemId,
  shoesItemId,
}: {
  look: AvatarCharacterLook
  jerseyOverride: TorsoColors | null
  supporterColors: [string, string] | null
  variant: 'front' | 'back'
  flocage?: { name: string; number: string }
  suppressBaseHeadwear?: boolean
  className?: string
  pixelJersey?: { preset: PixelJerseyPresetId } | null
  pantsItemId?: string | null
  shoesItemId?: string | null
}) {
  return (
    <MascotAvatar
      look={look}
      jerseyOverride={jerseyOverride}
      supporterColors={supporterColors}
      variant={variant}
      flocage={flocage}
      suppressBaseHeadwear={suppressBaseHeadwear}
      className={className}
      pixelJersey={pixelJersey}
      pantsItemId={pantsItemId}
      shoesItemId={shoesItemId}
    />
  )
}
