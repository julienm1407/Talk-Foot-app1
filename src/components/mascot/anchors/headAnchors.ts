import { MASCOT } from '../mascotGeometry'
import type { AnchorPlacement, AnchorPoint, HeadAnchorId, ResolvedPlacement } from './placementTypes'

const { cx, cy, rx, ry } = MASCOT.head

/** Carte d’ancres — dérivée uniquement de l’ellipse crânienne. */
export function buildHeadAnchorMap(): Record<HeadAnchorId, AnchorPoint> {
  return {
    HEAD_CENTER: { x: cx, y: cy },
    HEAD_TOP: { x: cx, y: cy - ry },
    FOREHEAD: { x: cx, y: cy - ry * 0.52 },
    EYE_LINE: { x: cx, y: cy - ry * 0.1 },
    NOSE_LINE: { x: cx, y: cy + ry * 0.18 },
    MOUTH_LINE: { x: cx, y: cy + ry * 0.38 },
    CHIN: { x: cx, y: cy + ry * 0.75 },
    JAW: { x: cx, y: cy + ry * 0.58 },
    LEFT_TEMPLE: { x: cx - rx * 0.9, y: cy - ry * 0.18 },
    RIGHT_TEMPLE: { x: cx + rx * 0.9, y: cy - ry * 0.18 },
    HEAD_BACK: { x: cx + rx * 0.42, y: cy - ry * 0.08 },
  }
}

let _cache: Record<HeadAnchorId, AnchorPoint> | null = null

export function getHeadAnchors(): Record<HeadAnchorId, AnchorPoint> {
  if (!_cache) _cache = buildHeadAnchorMap()
  return _cache
}

export function getAnchorPoint(id: HeadAnchorId): AnchorPoint {
  return getHeadAnchors()[id]
}

const DEFAULT_W = rx * 2
const DEFAULT_H = ry * 0.9

/** Résout placement → position monde + dimensions. */
export function resolvePlacement(placement: AnchorPlacement): ResolvedPlacement {
  const base = getAnchorPoint(placement.anchor)
  const scale = placement.scale ?? 1
  return {
    x: base.x + (placement.offsetX ?? 0),
    y: base.y + (placement.offsetY ?? 0),
    scale,
    width: (placement.width ?? DEFAULT_W) * scale,
    height: (placement.height ?? DEFAULT_H) * scale,
  }
}

/** Transform SVG : ancre + offset, échelle depuis l’ancre. */
export function placementTransform(p: ResolvedPlacement): string {
  return `translate(${p.x}, ${p.y}) scale(${p.scale})`
}

/** Point local → monde */
export function localToWorld(
  placement: AnchorPlacement,
  localX: number,
  localY: number,
): AnchorPoint {
  const r = resolvePlacement(placement)
  return {
    x: r.x + localX * r.scale,
    y: r.y + localY * r.scale,
  }
}

export function worldProbesFromLocal(
  placement: AnchorPlacement,
  locals: ReadonlyArray<readonly [number, number]>,
): AnchorPoint[] {
  return locals.map(([lx, ly]) => localToWorld(placement, lx, ly))
}
