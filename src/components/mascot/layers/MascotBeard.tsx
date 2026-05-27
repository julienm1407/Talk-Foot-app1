import type { BeardStyle } from '../../../types/profile'
import { getBeardDefinition } from '../anchors/beardPlacements'
import { resolvePlacement } from '../anchors/headAnchors'
import { AnchoredDotsLayer, AnchoredPathLayer, AnchoredStrokeLayer } from '../anchors/AnchoredLayer'
import { beardClipUrl } from '../anchors/clipIds'

type Props = {
  uid: string
  beard: BeardStyle
  fill: string
  strokeColor: string
}

export function MascotBeard({ uid, beard, fill, strokeColor }: Props) {
  const def = getBeardDefinition(beard)
  if (!def) return null

  const { width, height } = resolvePlacement(def.placement)
  const clip = beardClipUrl(uid, def.clip)

  return (
    <g aria-label="barbe">
      {def.dots && def.dots.length > 0 ? (
        <AnchoredDotsLayer placement={def.placement} dots={def.dots} fill={strokeColor} clipPath={clip} />
      ) : null}

      {def.buildPaths(width, height).map((pathD, i) =>
        beard === 'light' ? (
          <AnchoredStrokeLayer
            key={i}
            placement={def.placement}
            pathD={pathD}
            strokeColor={strokeColor}
            strokeWidth={1.6}
            clipPath={clip}
          />
        ) : (
          <AnchoredPathLayer
            key={i}
            placement={def.placement}
            pathD={pathD}
            fill={fill}
            edgeColor={strokeColor}
            clipPath={clip}
          />
        ),
      )}

      {def.secondaryPlacement && def.secondaryPaths ? (
        <AnchoredPathLayer
          placement={def.secondaryPlacement}
          pathD={def.secondaryPaths(
            resolvePlacement(def.secondaryPlacement).width,
            resolvePlacement(def.secondaryPlacement).height,
          ).join(' ')}
          fill={fill}
          edgeColor={strokeColor}
          clipPath={beardClipUrl(uid, 'beardMouth')}
        />
      ) : null}
    </g>
  )
}
