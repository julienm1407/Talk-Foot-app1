import React, { useId } from 'react'
import type { AvatarCharacterLook } from '../../types/profile'
import type { PixelJerseyPresetId } from '../../data/pixelJerseyPresets'
import { cn } from '../../utils/cn'
import { MASCOT_VIEW } from './mascotGeometry'
import { mixHex } from './mascotColors'
import { MascotBody } from './layers/MascotBody'
import { MascotHead } from './layers/MascotHead'
import { MascotJersey, MascotArms, type TorsoColors } from './layers/MascotJersey'
import { MascotFace } from './layers/MascotFace'
import { MascotBeard } from './layers/MascotBeard'
import { MascotHairBack, MascotHairFront } from './layers/MascotHair'
import { MascotAccessories } from './layers/MascotAccessories'
import { HairClipDefs } from './hair/HairClipDefs'
import { MascotAnchorClipDefs } from './anchors/clipIds'

export type { TorsoColors }

function resolveTorso(
  look: AvatarCharacterLook,
  jerseyOverride: TorsoColors | null,
  supporterColors: [string, string] | null,
): TorsoColors {
  if (jerseyOverride) return jerseyOverride
  if (look.supporterTint && supporterColors) {
    return {
      primary: supporterColors[0],
      secondary: supporterColors[1],
      pattern: look.outfitPattern,
      stripeLight: '#f8fafc',
    }
  }
  return {
    primary: look.outfitPrimary,
    secondary: look.outfitSecondary,
    pattern: look.outfitPattern,
    stripeLight: '#f8fafc',
  }
}

export type MascotAvatarProps = {
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
}

/**
 * Hiérarchie stricte :
 * corps → maillot → BACK_HAIR → HEAD → FACE → BEARD → FRONT_HAIR → accessoires
 */
export function MascotAvatar({
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
}: MascotAvatarProps) {
  const uid = useId().replace(/:/g, '')
  const torso = resolveTorso(look, jerseyOverride, supporterColors)
  const hairFill = look.hairColor
  const beardFill = look.beardColor ?? look.hairColor
  const hairEdge = mixHex(hairFill, '#0f172a', 0.28)
  const pid = pantsItemId ?? 'pants-kit'
  const sid = shoesItemId ?? 'shoes-studs'

  const hairProps = { uid, style: look.hairStyle, fill: hairFill, edgeColor: hairEdge }

  return (
    <svg
      viewBox={`0 0 ${MASCOT_VIEW.w} ${MASCOT_VIEW.h}`}
      className={cn('h-full w-full max-h-[140px] max-w-[100px]', className)}
      shapeRendering="geometricPrecision"
      aria-hidden
    >
      <defs>
        <HairClipDefs uid={uid} />
        <MascotAnchorClipDefs uid={uid} />
      </defs>

      <MascotBody skin={look.skinTone} shortsFill={torso.primary} pantsItemId={pid} shoesItemId={sid} showHead={false} />

      {variant === 'front' ? <MascotArms skin={look.skinTone} /> : null}

      <MascotJersey
        uid={uid}
        colors={torso}
        variant={variant}
        flocage={variant === 'back' ? flocage : undefined}
        pixelJersey={pixelJersey}
      />

      {variant === 'front' ? (
        <>
          <MascotHairBack {...hairProps} />
          <MascotHead skin={look.skinTone} />
          <MascotFace
            eyeColor={look.eyeColor}
            eyeShape={look.eyeShape}
            faceExpression={look.faceExpression}
            skinTone={look.skinTone}
            hairColor={look.hairColor}
          />
          <MascotBeard uid={uid} beard={look.beard} fill={beardFill} strokeColor={beardFill} />
          <MascotHairFront {...hairProps} />
          <MascotAccessories glasses={look.glasses} headwear={look.headwear} suppressHeadwear={suppressBaseHeadwear} />
        </>
      ) : (
        <>
          <MascotHairBack {...hairProps} />
          <MascotHead skin={look.skinTone} />
        </>
      )}
    </svg>
  )
}
