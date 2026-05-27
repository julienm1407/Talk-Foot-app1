import React from 'react'
import type { AvatarCharacterLook, EyeShape, FaceExpression } from '../../../types/profile'
import { getHeadAnchors } from '../anchors/headAnchors'
import { mixHex } from '../mascotColors'

const EXPR: Record<FaceExpression, { browOffsetY: number; smileLift: number }> = {
  neutral: { browOffsetY: -5, smileLift: 0 },
  happy: { browOffsetY: -6, smileLift: 1.2 },
  hyped: { browOffsetY: -7, smileLift: 2.4 },
  serious: { browOffsetY: -4, smileLift: -0.5 },
}

function eyeOffset(shape: EyeShape): { dx: number; scale: number } {
  switch (shape) {
    case 'wide':
      return { dx: 10.5, scale: 1.12 }
    case 'almond':
      return { dx: 9.8, scale: 0.95 }
    case 'narrow':
      return { dx: 9.2, scale: 0.88 }
    case 'round':
    default:
      return { dx: 9.5, scale: 1 }
  }
}

function MascotEye({ cx, cy, scale, eyeColor }: { cx: number; cy: number; scale: number; eyeColor: string }) {
  const r = 3.1 * scale
  return (
    <g>
      <ellipse cx={cx} cy={cy + 0.4} rx={r + 0.6} ry={r * 0.55} fill="#ffffff" stroke="rgba(15,23,42,0.12)" strokeWidth={0.2} />
      <circle cx={cx} cy={cy} r={r * 0.72} fill={eyeColor} />
      <circle cx={cx} cy={cy} r={r * 0.38} fill="#0f172a" />
      <circle cx={cx - r * 0.22} cy={cy - r * 0.2} r={r * 0.16} fill="#ffffff" opacity={0.95} />
    </g>
  )
}

function MascotMouth({ cx, cy, expr }: { cx: number; cy: number; expr: FaceExpression }) {
  const lip = mixHex('#c2410c', '#fb923c', 0.35)
  const lift = EXPR[expr].smileLift
  if (expr === 'serious') {
    return <path d={`M ${cx - 4} ${cy + 2 + lift} L ${cx + 4} ${cy + 2 + lift}`} fill="none" stroke={lip} strokeWidth={0.9} strokeLinecap="round" />
  }
  if (expr === 'hyped') {
    return (
      <path
        d={`M ${cx - 6} ${cy + 1 + lift} Q ${cx} ${cy + 6 + lift} ${cx + 6} ${cy + 1 + lift}`}
        fill="#fff7ed"
        stroke={lip}
        strokeWidth={0.85}
        strokeLinecap="round"
      />
    )
  }
  return (
    <path
      d={`M ${cx - 5} ${cy + 2} Q ${cx} ${cy + 4.5 + lift} ${cx + 5} ${cy + 2}`}
      fill="none"
      stroke={lip}
      strokeWidth={1}
      strokeLinecap="round"
    />
  )
}

type Props = Pick<AvatarCharacterLook, 'eyeColor' | 'eyeShape' | 'faceExpression' | 'skinTone' | 'hairColor'>

export function MascotFace({ eyeColor, eyeShape, faceExpression, skinTone, hairColor }: Props) {
  const anchors = getHeadAnchors()
  const expr = faceExpression ?? 'happy'
  const e = EXPR[expr]
  const { dx, scale } = eyeOffset(eyeShape)
  const eyeY = anchors.EYE_LINE.y
  const mouth = anchors.MOUTH_LINE
  const nose = anchors.NOSE_LINE
  const browY = anchors.FOREHEAD.y + e.browOffsetY

  return (
    <g aria-label="visage">
      {expr === 'happy' || expr === 'hyped' ? (
        <g opacity={expr === 'hyped' ? 0.28 : 0.18} pointerEvents="none">
          <ellipse cx={anchors.EYE_LINE.x - 13} cy={eyeY + 7} rx={5.5} ry={3.2} fill="#fda4af" />
          <ellipse cx={anchors.EYE_LINE.x + 13} cy={eyeY + 7} rx={5.5} ry={3.2} fill="#fda4af" />
        </g>
      ) : null}

      <MascotEye cx={anchors.EYE_LINE.x - dx} cy={eyeY} scale={scale} eyeColor={eyeColor} />
      <MascotEye cx={anchors.EYE_LINE.x + dx} cy={eyeY} scale={scale} eyeColor={eyeColor} />

      <g fill="none" stroke={mixHex(hairColor, '#1c1917', 0.15)} strokeWidth={0.85} strokeLinecap="round" opacity={0.85}>
        <path d={`M ${anchors.LEFT_TEMPLE.x + 4} ${browY} Q ${anchors.FOREHEAD.x - 8} ${browY - 1.2} ${anchors.FOREHEAD.x - 4} ${browY}`} />
        <path d={`M ${anchors.RIGHT_TEMPLE.x - 4} ${browY} Q ${anchors.FOREHEAD.x + 8} ${browY - 1.2} ${anchors.FOREHEAD.x + 4} ${browY}`} />
      </g>

      <MascotMouth cx={mouth.x} cy={mouth.y} expr={expr} />
      <circle cx={nose.x} cy={nose.y} r={1.1} fill={mixHex(skinTone, '#0f172a', 0.08)} opacity={0.35} />
    </g>
  )
}
