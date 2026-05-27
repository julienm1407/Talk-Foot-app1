import { MASCOT } from '../mascotGeometry'
import { strokeSubtle } from '../mascotColors'

type Props = { skin: string }

export function MascotHead({ skin }: Props) {
  const { cx, cy, rx, ry } = MASCOT.head
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill={skin}
      stroke={strokeSubtle(skin)}
      strokeWidth={0.32}
      aria-label="tete"
    />
  )
}
