import { MASCOT } from '../mascotGeometry'

const HEAD_SKULL = MASCOT.head
export const HEAD_SAFE_AREA = {
  cx: HEAD_SKULL.cx,
  cy: HEAD_SKULL.cy + HEAD_SKULL.ry * 0.08,
  rx: HEAD_SKULL.rx * 0.52,
  ry: HEAD_SKULL.ry * 0.48,
} as const

const { cx, cy, rx, ry } = MASCOT.head

export const HEAD_WIDTH = rx * 2
export const HEAD_HEIGHT = ry * 2
export const MAX_HAIR_WIDTH = HEAD_WIDTH * 1.1
export const MAX_HAIR_HEIGHT = HEAD_HEIGHT * 1.25

/** Enveloppe maximale — aucun cheveu ne dépasse. */
export const HEAD_MASK = {
  cx,
  cy,
  rx: MAX_HAIR_WIDTH / 2,
  ry: MAX_HAIR_HEIGHT / 2,
} as const

function ellipseD(e: { cx: number; cy: number; rx: number; ry: number }, sweep: 0 | 1): string {
  const t = e.cy - e.ry
  return `M ${e.cx} ${t} A ${e.rx} ${e.ry} 0 1 ${sweep} ${e.cx} ${e.cy + e.ry} A ${e.rx} ${e.ry} 0 1 ${sweep} ${e.cx} ${t} Z`
}

export function headMaskPathD(): string {
  return ellipseD(HEAD_MASK, 1)
}

/** Couronne uniquement (masque − visage). */
export function headMaskRingPathD(): string {
  return `${ellipseD(HEAD_MASK, 1)} ${ellipseD(HEAD_SAFE_AREA, 0)}`
}

/** Demi-arrière : queue / nuque — jamais devant les yeux. */
export function hairBehindOnlyClipPathD(): string {
  const k = HEAD_SKULL
  return `M ${cx - 2} ${k.cy - k.ry - 2}
    L 100 ${k.cy - k.ry - 4}
    L 100 140
    L ${cx - 6} ${k.cy + k.ry + 36}
    Q ${k.cx - k.rx} ${k.cy + 6} ${k.cx - k.rx + 2} ${k.cy - k.ry}
    Z`
}

export function headMaskClipUrl(uid: string): string {
  return `url(#${uid}-head-mask)`
}

export function headMaskRingClipUrl(uid: string): string {
  return `url(#${uid}-head-mask-ring)`
}

export function hairBehindClipUrl(uid: string): string {
  return `url(#${uid}-hair-behind)`
}

export function isInsideHeadMask(x: number, y: number): boolean {
  const dx = (x - HEAD_MASK.cx) / HEAD_MASK.rx
  const dy = (y - HEAD_MASK.cy) / HEAD_MASK.ry
  return dx * dx + dy * dy <= 1.06
}

export function isInBehindOnlyZone(x: number, y: number): boolean {
  return x >= cx - 2 && y >= cy - ry * 0.5
}
