import type { HairStyle } from '../../../types/profile'
import { getHairAssembly } from '../hair/hairAssemblies'
import type { HairPartClip, HairStack } from '../hair/hairAssemblyTypes'
import {
  hairBehindClipUrl,
  headMaskClipUrl,
  headMaskRingClipUrl,
} from '../hair/headMask'
import { strokeSubtle } from '../mascotColors'

type Props = {
  uid: string
  style: HairStyle
  fill: string
  edgeColor: string
}

function clipFor(uid: string, clip: HairPartClip): string {
  switch (clip) {
    case 'headMask':
      return headMaskClipUrl(uid)
    case 'headMaskRing':
      return headMaskRingClipUrl(uid)
    case 'behindOnly':
      return hairBehindClipUrl(uid)
  }
}

function HairStackGroup({
  uid,
  style,
  fill,
  edgeColor,
  stack,
  label,
}: Props & { stack: HairStack; label: string }) {
  const asm = getHairAssembly(style)
  const parts = asm.parts.filter((p) => p.stack === stack)
  if (parts.length === 0) return null

  return (
    <g aria-label={label}>
      {parts.map((p, i) => (
        <g key={`${p.kind}-${i}`} clipPath={clipFor(uid, p.clip)}>
          <path
            d={p.pathD}
            fill={fill}
            stroke={strokeSubtle(edgeColor)}
            strokeWidth={0.2}
            strokeLinejoin="round"
          />
        </g>
      ))}
    </g>
  )
}

/** BACK_HAIR — derrière la tête (queue, nuque, longueurs). */
export function MascotHairBack(props: Props) {
  return <HairStackGroup {...props} stack="back" label="cheveux-arriere" />
}

/** TOP_HAIR + SIDE_HAIR + FRONT_HAIR — au-dessus de la barbe. */
export function MascotHairFront(props: Props) {
  return <HairStackGroup {...props} stack="front" label="cheveux-avant" />
}
