import type { AvatarCharacterLook, BeardStyle, HairStyle } from '../../../types/profile'
import { getHairAssembly } from '../hair/hairAssemblies'
import { isInsideHeadMask, isInBehindOnlyZone } from '../hair/headMask'
import { worldProbesFromLocal } from './headAnchors'
import { getBeardDefinition } from './beardPlacements'
import {
  isInsideEyeZone,
  isInsideHeadSafeArea,
  isInsideMouthZone,
  isValidHairPoint,
} from './headSafeArea'

export type CollisionIssue = {
  kind: 'hair' | 'beard'
  style: string
  point: { x: number; y: number }
  reason: string
}

function validateHairAssembly(style: HairStyle): CollisionIssue[] {
  const asm = getHairAssembly(style)
  const issues: CollisionIssue[] = []

  for (const part of asm.parts) {
    for (const [x, y] of part.probes) {
      if (isInsideEyeZone(x, y)) {
        issues.push({ kind: 'hair', style, point: { x, y }, reason: 'cheveu sur les yeux' })
        continue
      }
      if (isInsideMouthZone(x, y)) {
        issues.push({ kind: 'hair', style, point: { x, y }, reason: 'cheveu sur la bouche' })
        continue
      }
      if (isInsideHeadSafeArea(x, y) && part.stack === 'front') {
        issues.push({ kind: 'hair', style, point: { x, y }, reason: 'cheveu sur le visage' })
        continue
      }
      if (!isInsideHeadMask(x, y) && part.stack !== 'back') {
        issues.push({ kind: 'hair', style, point: { x, y }, reason: 'cheveu hors HEAD_MASK' })
        continue
      }
      if (part.stack === 'back' && !isInBehindOnlyZone(x, y)) {
        issues.push({ kind: 'hair', style, point: { x, y }, reason: 'mèche arrière devant le visage' })
        continue
      }
      if (part.stack === 'front' && !isValidHairPoint(x, y) && isInsideHeadMask(x, y)) {
        /* dans le masque mais hors anneau : toléré pour SIDE sur les tempes */
      }
    }
  }
  return issues
}

function validateBeardProbes(beard: BeardStyle): CollisionIssue[] {
  const def = getBeardDefinition(beard)
  if (!def) return []

  const issues: CollisionIssue[] = []
  const mouthY = 38 + 26 * 0.38

  const checkSet = (
    placement: typeof def.placement,
    probes: ReadonlyArray<readonly [number, number]>,
    allowMouthBand: boolean,
  ) => {
    const world = worldProbesFromLocal(placement, probes)
    for (const p of world) {
      if (isInsideEyeZone(p.x, p.y)) {
        issues.push({ kind: 'beard', style: beard, point: p, reason: 'barbe sur les yeux' })
        continue
      }
      if (beard === 'moustache' || allowMouthBand) continue
      if (isInsideMouthZone(p.x, p.y)) {
        issues.push({ kind: 'beard', style: beard, point: p, reason: 'barbe sur la bouche' })
      }
      if (isInsideHeadSafeArea(p.x, p.y) && p.y < mouthY) {
        issues.push({ kind: 'beard', style: beard, point: p, reason: 'barbe sur le visage' })
      }
    }
  }

  checkSet(def.placement, def.probes, beard === 'moustache')
  if (def.secondaryPlacement && def.secondaryProbes) {
    checkSet(def.secondaryPlacement, def.secondaryProbes, true)
  }
  if (def.dots) {
    checkSet(def.placement, def.dots.map(([x, y]) => [x, y] as const), false)
  }

  return issues
}

export function validateHairStyle(style: HairStyle): CollisionIssue[] {
  return validateHairAssembly(style)
}

export function validateBeardStyle(beard: BeardStyle): CollisionIssue[] {
  return validateBeardProbes(beard)
}

export function validateCharacterLook(look: Pick<AvatarCharacterLook, 'hairStyle' | 'beard'>): CollisionIssue[] {
  return [...validateHairAssembly(look.hairStyle), ...validateBeardProbes(look.beard)]
}

export function assertLookValid(look: Pick<AvatarCharacterLook, 'hairStyle' | 'beard'>): void {
  const issues = validateCharacterLook(look)
  if (issues.length > 0) {
    const msg = issues.map((i) => `${i.kind}/${i.style}: ${i.reason} @(${i.point.x.toFixed(1)},${i.point.y.toFixed(1)})`).join('; ')
    throw new Error(msg)
  }
}
