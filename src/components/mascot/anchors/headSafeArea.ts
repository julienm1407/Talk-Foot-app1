import { MASCOT } from '../mascotGeometry'

const { cx, cy, rx, ry } = MASCOT.head

/**
 * Zone protégée : yeux, nez, bouche.
 * Aucun cheveu (front) ni barbe (sauf moustache) ne doit y pénétrer.
 */
export const HEAD_SAFE_AREA = {
  cx,
  cy: cy + ry * 0.08,
  rx: rx * 0.52,
  ry: ry * 0.48,
} as const

/** Contour crâne (peau) — limite extérieure cheveux. */
export const HEAD_SKULL = {
  cx,
  cy,
  rx,
  ry,
} as const

/** Mèches longues autorisées sur les côtés (contournent le visage). */
export const HAIR_SIDE_LOCK_ZONES = [
  { x0: cx - rx - 4, x1: cx - HEAD_SAFE_AREA.rx - 2, y0: cy - ry * 0.55, y1: cy + ry * 1.15 },
  { x0: cx + HEAD_SAFE_AREA.rx + 2, x1: cx + rx + 4, y0: cy - ry * 0.55, y1: cy + ry * 1.15 },
] as const

/** Sommet du crâne (cheveux courts / buzz au-dessus de HEAD_TOP). */
export function isOnSkullCrownPeak(x: number, y: number): boolean {
  return y <= cy - ry + 6 && Math.abs(x - cx) <= rx * 0.5
}

/** Nuque / arrière (queue, mèches arrière). */
export function isInHairBackZone(x: number, y: number): boolean {
  return x >= cx + rx * 0.2 && y >= cy - ry * 0.35 && y <= cy + ry + 42
}

export function ellipseContains(
  px: number,
  py: number,
  e: { cx: number; cy: number; rx: number; ry: number },
): boolean {
  const dx = (px - e.cx) / e.rx
  const dy = (py - e.cy) / e.ry
  return dx * dx + dy * dy <= 1
}

export function isInsideHeadSafeArea(x: number, y: number): boolean {
  return ellipseContains(x, y, HEAD_SAFE_AREA)
}

export const isInsideFaceSafeZone = isInsideHeadSafeArea

export function isInHairAreaRing(x: number, y: number): boolean {
  const dxO = (x - cx) / HEAD_SKULL.rx
  const dyO = (y - (cy - 1)) / HEAD_SKULL.ry
  const dxI = (x - cx) / HEAD_SAFE_AREA.rx
  const dyI = (y - HEAD_SAFE_AREA.cy) / HEAD_SAFE_AREA.ry
  return dxO * dxO + dyO * dyO <= 1 && dxI * dxI + dyI * dyI >= 1
}

export function isInBeardArea(x: number, y: number): boolean {
  const mouthY = cy + ry * 0.32
  return x >= cx - rx + 2 && x <= cx + rx - 2 && y >= mouthY && y <= cy + ry + 4
}

export function isInsideSkull(x: number, y: number): boolean {
  return ellipseContains(x, y, HEAD_SKULL)
}

export function isInHairSideLock(x: number, y: number): boolean {
  return HAIR_SIDE_LOCK_ZONES.some((z) => x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1)
}

/** Cheveux : autorisé sur couronne crânienne ou mèches latérales. */
export function isValidHairPoint(x: number, y: number): boolean {
  if (isInsideHeadSafeArea(x, y)) return false
  if (isOnSkullCrownPeak(x, y)) return true
  if (isInsideSkull(x, y)) return true
  if (isInHairSideLock(x, y)) return true
  return isInHairBackZone(x, y)
}

/** Zone yeux (plus stricte que safe area pour tests). */
export function isInsideEyeZone(x: number, y: number): boolean {
  const eyeY = cy - ry * 0.1
  const eyeRx = 11
  const eyeRy = 5.5
  const left = ellipseContains(x, y, { cx: cx - 9.5, cy: eyeY, rx: eyeRx, ry: eyeRy })
  const right = ellipseContains(x, y, { cx: cx + 9.5, cy: eyeY, rx: eyeRx, ry: eyeRy })
  return left || right
}

/** Zone bouche */
export function isInsideMouthZone(x: number, y: number): boolean {
  const mouthY = cy + ry * 0.38
  return ellipseContains(x, y, { cx, cy: mouthY + 4, rx: 9, ry: 5 })
}

function ellipsePathD(e: { cx: number; cy: number; rx: number; ry: number }, sweep: 0 | 1): string {
  const top = e.cy - e.ry
  return `M ${e.cx} ${top} A ${e.rx} ${e.ry} 0 1 ${sweep} ${e.cx} ${e.cy + e.ry} A ${e.rx} ${e.ry} 0 1 ${sweep} ${e.cx} ${top} Z`
}

/** Anneau : crâne extérieur moins zone visage (cheveux courts). */
export function hairRingClipPathD(): string {
  const outer = ellipsePathD(HEAD_SKULL, 1)
  const inner = ellipsePathD(HEAD_SAFE_AREA, 0)
  return `${outer} ${inner}`
}

/** Côtés + couronne : exclut le visage au centre. */
export function hairSidesClipPathD(): string {
  const s = HEAD_SAFE_AREA
  const k = HEAD_SKULL
  return `M 0 0 L 100 0 L 100 140 L 0 140 Z
    M ${s.cx - s.rx} ${s.cy - s.ry}
    A ${s.rx} ${s.ry} 0 1 1 ${s.cx + s.rx} ${s.cy - s.ry}
    A ${s.rx} ${s.ry} 0 1 1 ${s.cx - s.rx} ${s.cy - s.ry} Z
    M ${k.cx - k.rx} ${k.cy - k.ry}
    A ${k.rx} ${k.ry} 0 1 0 ${k.cx + k.rx} ${k.cy - k.ry}
    A ${k.rx} ${k.ry} 0 1 0 ${k.cx - k.rx} ${k.cy - k.ry} Z`
}

export function hairBackClipPathD(): string {
  const k = HEAD_SKULL
  return `M ${k.cx + 4} ${k.cy - k.ry}
    L 100 ${k.cy - k.ry - 6}
    L 100 140
    L ${k.cx} ${k.cy + k.ry + 38}
    Q ${k.cx - k.rx} ${k.cy + 8} ${k.cx - k.rx + 2} ${k.cy - k.ry}
    Z`
}

export function beardJawClipPathD(): string {
  const s = HEAD_SAFE_AREA
  const mouthY = cy + ry * 0.32
  return `M ${cx - rx} ${mouthY}
    L ${cx + rx} ${mouthY}
    L ${cx + rx - 2} ${cy + ry + 4}
    L ${cx - rx + 2} ${cy + ry + 4} Z
    M ${s.cx - s.rx} ${s.cy - s.ry}
    A ${s.rx} ${s.ry} 0 1 1 ${s.cx + s.rx} ${s.cy - s.ry}
    A ${s.rx} ${s.ry} 0 1 1 ${s.cx - s.rx} ${s.cy - s.ry} Z`
}

export function beardMouthClipPathD(): string {
  const y0 = cy + ry * 0.22
  const y1 = cy + ry * 0.48
  return `M ${cx - 16} ${y0} L ${cx + 16} ${y0} L ${cx + 16} ${y1} L ${cx - 16} ${y1} Z`
}

export function beardChinClipPathD(): string {
  const y0 = cy + ry * 0.42
  return `M ${cx - 14} ${y0} L ${cx + 14} ${y0} L ${cx + 12} ${cy + ry + 2} L ${cx - 12} ${cy + ry + 2} Z`
}
