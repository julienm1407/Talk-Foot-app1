import type { EyeShape, HairStyle } from '../../types/profile'
import { HEAD_ANCHOR_MAP } from './avatarHeadAnchorMap'

/** Coordonnées fixes du crâne (viewBox 100×140) — alignées sur l’ellipse tête SVG. */
export const AVATAR_HEAD = {
  cx: 50,
  cy: 48,
  faceY: 48,
  headTop: 18,
  /** Contour crâne (peau) */
  skullRx: 25.5,
  skullRy: 23.5,
  /** Zone visage protégée (yeux, nez, bouche) — légèrement plus petite que le crâne */
  faceSafeRx: 20.8,
  faceSafeRy: 19.2,
  /** Anneau cheveux : entre crâne et zone visage */
  hairOuterRx: 25.2,
  hairOuterRy: 23.2,
  hairInnerRx: 21.4,
  hairInnerRy: 20.2,
  /** Limite basse cheveux latéraux (au-dessus de la mâchoire) */
  hairSideMaxY: 61.5,
} as const

const { cx, cy } = AVATAR_HEAD

function ellipsePath(cx0: number, cy0: number, rx: number, ry: number, sweep: 0 | 1): string {
  const top = cy0 - ry
  return `M ${cx0} ${top} A ${rx} ${ry} 0 1 ${sweep} ${cx0} ${cy0 + ry} A ${rx} ${ry} 0 1 ${sweep} ${cx0} ${top} Z`
}

/** Anneau crânien : cheveux uniquement sur le pourtour du crâne, jamais sur le visage. */
export function hairAreaClipPathD(): string {
  const o = AVATAR_HEAD
  const outer = ellipsePath(cx, cy - 2, o.hairOuterRx, o.hairOuterRy, 1)
  const inner = ellipsePath(cx, cy - 1, o.hairInnerRx, o.hairInnerRy, 0)
  return `${outer} ${inner}`
}

/** Barbe : menton / mâchoire basse (+ moustache au-dessus de la lèvre). */
export function beardAreaClipPathD(): string {
  const yTop = cy + 9.2
  const yBottom = cy + 28.5
  const halfW = 17.2
  return `M ${cx - halfW} ${yTop} L ${cx + halfW} ${yTop} L ${cx + halfW - 1.5} ${yBottom} L ${cx - halfW + 1.5} ${yBottom} Z`
}

/** Nuque / arrière : longues mèches, queue (jusqu’aux épaules ~y112). */
export function hairBackAreaClipPathD(): string {
  const yTop = cy - 22
  const yShoulder = cy + 64
  return `M ${cx + 6} ${yTop}
    L 100 ${yTop - 8}
    L 100 140
    L ${cx - 2} ${yShoulder}
    Q ${cx - 20} ${cy + 18} ${cx - 20} ${yTop}
    Z`
}

/** Dégradé cheveux calé sur le contour extérieur de l’anneau crânien. */
export function hairRingGradientCoords(): {
  cx: number
  cy: number
  innerRx: number
  innerRy: number
  outerRx: number
  outerRy: number
} {
  const o = AVATAR_HEAD
  return {
    cx,
    cy: cy - 1,
    innerRx: o.hairInnerRx,
    innerRy: o.hairInnerRy,
    outerRx: o.hairOuterRx,
    outerRy: o.hairOuterRy,
  }
}

export function hairStyleUsesBackLayer(style: HairStyle): boolean {
  return style === 'ponytail' || style === 'long' || style === 'mohawk'
}

/** Points de contrôle pour tests — ancrés au crâne. */
export function hairStyleProbePoints(style: HairStyle): { x: number; y: number }[] {
  const a = HEAD_ANCHOR_MAP
  switch (style) {
    case 'ponytail':
      return [a.topHead, a.backHead, { x: a.backHead.x, y: a.neckBack.y + 14 }]
    case 'long':
      return [a.topHead, a.leftTemple, { x: a.backHead.x + 10, y: a.neckBack.y + 12 }]
    default:
      return [a.topHead, a.leftTemple, a.rightTemple]
  }
}

export function eyeShapeProbePoints(_shape: EyeShape): { x: number; y: number }[] {
  const f = AVATAR_HEAD.faceY
  return [
    { x: cx - 8.5, y: f - 2 },
    { x: cx + 8.5, y: f - 2 },
    { x: cx, y: f + 12 },
  ]
}

/** Point dans l’ellipse visage protégée ? */
export function isInFaceSafeZone(x: number, y: number): boolean {
  const o = AVATAR_HEAD
  const dx = (x - cx) / o.faceSafeRx
  const dy = (y - (cy - 1)) / o.faceSafeRy
  return dx * dx + dy * dy <= 1.02
}

export function isInHairAreaRing(x: number, y: number): boolean {
  const o = AVATAR_HEAD
  const dxO = (x - cx) / o.hairOuterRx
  const dyO = (y - (cy - 2)) / o.hairOuterRy
  const inOuter = dxO * dxO + dyO * dyO <= 1.02
  const dxI = (x - cx) / o.hairInnerRx
  const dyI = (y - (cy - 1)) / o.hairInnerRy
  const inInner = dxI * dxI + dyI * dyI <= 0.98
  return inOuter && !inInner
}

export function isInBeardArea(x: number, y: number): boolean {
  const yTop = cy + 9.2
  const yBottom = cy + 28.5
  const halfW = 17.2
  return y >= yTop && y <= yBottom && x >= cx - halfW && x <= cx + halfW
}
