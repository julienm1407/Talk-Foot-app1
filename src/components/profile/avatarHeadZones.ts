import type { EyeShape, HairStyle } from '../../types/profile'
import { getHairAssembly, hairStyleUsesBackLayer } from '../mascot/hair/hairAssemblies'
import {
  HEAD_SAFE_AREA,
  HEAD_SKULL,
  beardChinClipPathD,
  hairBackClipPathD,
  hairRingClipPathD,
  isInsideFaceSafeZone,
  isInHairAreaRing,
  isInBeardArea,
} from '../mascot/anchors/headSafeArea'
import { headMaskRingPathD } from '../mascot/hair/headMask'

export const AVATAR_HEAD = {
  cx: HEAD_SKULL.cx,
  cy: HEAD_SKULL.cy,
  faceY: HEAD_SKULL.cy,
  headTop: HEAD_SKULL.cy - HEAD_SKULL.ry,
  skullRx: HEAD_SKULL.rx,
  skullRy: HEAD_SKULL.ry,
  faceSafeRx: HEAD_SAFE_AREA.rx,
  faceSafeRy: HEAD_SAFE_AREA.ry,
  hairOuterRx: HEAD_SKULL.rx - 0.5,
  hairOuterRy: HEAD_SKULL.ry - 0.5,
  hairInnerRx: HEAD_SAFE_AREA.rx + 1,
  hairInnerRy: HEAD_SAFE_AREA.ry + 1,
  hairSideMaxY: HEAD_SKULL.cy + HEAD_SKULL.ry * 0.85,
} as const

export { hairStyleUsesBackLayer }

export function hairAreaClipPathD(): string {
  return hairRingClipPathD()
}

export function beardAreaClipPathD(): string {
  return beardChinClipPathD()
}

export function hairBackAreaClipPathD(): string {
  return hairBackClipPathD()
}

export function hairRingGradientCoords() {
  const o = AVATAR_HEAD
  return { cx: o.cx, cy: o.cy - 1, innerRx: o.hairInnerRx, innerRy: o.hairInnerRy, outerRx: o.hairOuterRx, outerRy: o.hairOuterRy }
}

export function hairStyleProbePoints(style: HairStyle): { x: number; y: number }[] {
  return getHairAssembly(style).parts.flatMap((p) => p.probes.map(([x, y]) => ({ x, y })))
}

export function eyeShapeProbePoints(_shape: EyeShape): { x: number; y: number }[] {
  const eyeY = HEAD_SKULL.cy - HEAD_SKULL.ry * 0.1
  return [
    { x: HEAD_SKULL.cx - 9.5, y: eyeY },
    { x: HEAD_SKULL.cx + 9.5, y: eyeY },
  ]
}

export { isInsideFaceSafeZone as isInFaceSafeZone, isInHairAreaRing, isInBeardArea }

export function anchorInFaceSafeZone(p: { x: number; y: number }): boolean {
  return isInsideFaceSafeZone(p.x, p.y)
}

export function headMaskRingClipPathD(): string {
  return headMaskRingPathD()
}
