import type { AnchorPlacement } from './placementTypes'
import { placementTransform, resolvePlacement } from './headAnchors'
import { strokeSubtle } from '../mascotColors'

type PathLayerProps = {
  placement: AnchorPlacement
  pathD: string
  fill: string
  edgeColor: string
  clipPath?: string
  opacity?: number
}

export function AnchoredPathLayer({ placement, pathD, fill, edgeColor, clipPath, opacity }: PathLayerProps) {
  const resolved = resolvePlacement(placement)
  const inner = (
    <g transform={placementTransform(resolved)}>
      <path
        d={pathD}
        fill={fill}
        stroke={strokeSubtle(edgeColor)}
        strokeWidth={0.22}
        strokeLinejoin="round"
        opacity={opacity}
      />
    </g>
  )
  if (!clipPath) return inner
  return <g clipPath={clipPath}>{inner}</g>
}

type MultiPathProps = {
  placement: AnchorPlacement
  paths: string[]
  fill: string
  edgeColor: string
  clipPath?: string
}

export function AnchoredPathsLayer({ placement, paths, fill, edgeColor, clipPath }: MultiPathProps) {
  const resolved = resolvePlacement(placement)
  const d = paths.join(' ')
  return (
    <AnchoredPathLayer
      placement={{ ...placement, width: resolved.width, height: resolved.height }}
      pathD={d}
      fill={fill}
      edgeColor={edgeColor}
      clipPath={clipPath}
    />
  )
}

type DotsProps = {
  placement: AnchorPlacement
  dots: ReadonlyArray<readonly [number, number, number]>
  fill: string
  clipPath?: string
}

export function AnchoredDotsLayer({ placement, dots, fill, clipPath }: DotsProps) {
  const resolved = resolvePlacement(placement)
  const inner = (
    <g transform={placementTransform(resolved)} opacity={0.55}>
      {dots.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={fill} />
      ))}
    </g>
  )
  if (!clipPath) return inner
  return <g clipPath={clipPath}>{inner}</g>
}

type StrokePathProps = {
  placement: AnchorPlacement
  pathD: string
  strokeColor: string
  strokeWidth?: number
  clipPath?: string
}

export function AnchoredStrokeLayer({
  placement,
  pathD,
  strokeColor,
  strokeWidth = 1.5,
  clipPath,
}: StrokePathProps) {
  const resolved = resolvePlacement(placement)
  const inner = (
    <g transform={placementTransform(resolved)}>
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" opacity={0.8} />
    </g>
  )
  if (!clipPath) return inner
  return <g clipPath={clipPath}>{inner}</g>
}
