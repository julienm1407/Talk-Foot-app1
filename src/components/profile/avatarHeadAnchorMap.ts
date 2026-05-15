import { AVATAR_HEAD } from './avatarHeadZones'

export type HeadAnchorPoint = { x: number; y: number }

/** Points d’ancrage fixes sur le crâne (viewBox 100×140). */
export type HeadAnchorMap = {
  topHead: HeadAnchorPoint
  leftTemple: HeadAnchorPoint
  rightTemple: HeadAnchorPoint
  backHead: HeadAnchorPoint
  neckBack: HeadAnchorPoint
}

const { cx, cy, hairOuterRx, hairOuterRy } = AVATAR_HEAD
const ringCy = cy - 2

/** Point sur l’anneau crânien ; 0° = sommet, sens horaire. */
export function pointOnSkullRing(degFromTop: number): HeadAnchorPoint {
  const rad = ((degFromTop - 90) * Math.PI) / 180
  return {
    x: cx + hairOuterRx * Math.cos(rad),
    y: ringCy + hairOuterRy * Math.sin(rad),
  }
}

/** Carte d’ancrage unique — toutes les coiffures s’y rattachent. */
export function buildHeadAnchorMap(): HeadAnchorMap {
  const topHead = pointOnSkullRing(0)
  const leftTemple = pointOnSkullRing(252)
  const rightTemple = pointOnSkullRing(108)
  return {
    topHead,
    leftTemple,
    rightTemple,
    /** Derrière le crâne (queue, longueur arrière) — hors zone visage, côté nuque haute */
    backHead: {
      x: cx + 8,
      y: topHead.y + 4,
    },
    neckBack: {
      x: cx,
      y: cy + 22.5,
    },
  }
}

export const HEAD_ANCHOR_MAP: HeadAnchorMap = buildHeadAnchorMap()

/** Arc supérieur du crâne (temple gauche → sommet → temple droit). */
export function skullCapArcD(a: HeadAnchorMap = HEAD_ANCHOR_MAP): string {
  const { leftTemple, rightTemple } = a
  return `M ${leftTemple.x} ${leftTemple.y}
    A ${hairOuterRx} ${hairOuterRy} 0 1 1 ${rightTemple.x} ${rightTemple.y}`
}

/** Bande rasée au niveau de l’oreille (pas sur la joue). */
export function templeFadeBandD(side: 'left' | 'right', a: HeadAnchorMap = HEAD_ANCHOR_MAP): string {
  const t = side === 'left' ? a.leftTemple : a.rightTemple
  const inward = side === 'left' ? 1 : -1
  const earY = t.y
  const maxCheekY = cy + 5
  const yBot = Math.min(earY + 4, maxCheekY)
  return `M ${t.x} ${t.y}
    Q ${t.x + inward * 3} ${t.y - 7} ${t.x + inward * 8} ${t.y - 5}
    L ${t.x + inward * 7} ${yBot}
    Q ${t.x + inward * 2} ${yBot - 2} ${t.x} ${t.y}
    Z`
}

/** Masse capillaire sur le dessus du crâne (ondulé, court, etc.). */
export function skullTopMassD(
  a: HeadAnchorMap,
  opts: { peakY?: number; widthScale?: number } = {},
): string {
  const peakY = opts.peakY ?? a.topHead.y - 4
  const w = (opts.widthScale ?? 1) * 10
  const { leftTemple, topHead, rightTemple } = a
  return `M ${leftTemple.x + 3} ${leftTemple.y - 2}
    C ${leftTemple.x + w} ${peakY + 6}, ${topHead.x - w * 0.4} ${peakY}, ${topHead.x} ${peakY}
    C ${topHead.x + w * 0.4} ${peakY}, ${rightTemple.x - w} ${peakY + 6}, ${rightTemple.x - 3} ${rightTemple.y - 2}
    A ${hairOuterRx * 0.92} ${hairOuterRy * 0.88} 0 0 0 ${leftTemple.x + 3} ${leftTemple.y - 2}
    Z`
}

/** Queue : uniquement depuis backHead vers le bas (derrière la tête). */
export function ponytailStrandD(a: HeadAnchorMap = HEAD_ANCHOR_MAP): string {
  const { backHead, neckBack } = a
  const tipY = neckBack.y + 18
  return `M ${backHead.x - 3} ${backHead.y}
    C ${backHead.x - 4} ${neckBack.y - 4}, ${backHead.x - 2} ${neckBack.y + 6}, ${backHead.x} ${tipY}
    C ${backHead.x + 2} ${neckBack.y + 6}, ${backHead.x + 4} ${neckBack.y - 4}, ${backHead.x + 3} ${backHead.y}
    Z`
}

/** Long : mèches derrière, des tempes vers neckBack / bas. */
export function longHairBackStrandD(side: 'left' | 'right', a: HeadAnchorMap = HEAD_ANCHOR_MAP): string {
  const temple = side === 'left' ? a.leftTemple : a.rightTemple
  const { backHead, neckBack } = a
  const outward = side === 'left' ? -1 : 1
  const tipY = neckBack.y + 14
  return `M ${temple.x} ${temple.y}
    C ${temple.x + outward * 6} ${a.topHead.y + 18}, ${backHead.x + outward * 10} ${neckBack.y - 6}, ${backHead.x + outward * 12} ${tipY}
    C ${backHead.x + outward * 4} ${neckBack.y + 2}, ${temple.x + outward * 2} ${neckBack.y - 8}, ${temple.x} ${temple.y}
    Z`
}

export function anchorInFaceSafeZone(p: HeadAnchorPoint): boolean {
  const o = AVATAR_HEAD
  const dx = (p.x - cx) / o.faceSafeRx
  const dy = (p.y - (cy - 1)) / o.faceSafeRy
  return dx * dx + dy * dy <= 1
}
