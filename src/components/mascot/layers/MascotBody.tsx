import { MASCOT } from '../mascotGeometry'
import { strokeSubtle } from '../mascotColors'

type Props = {
  skin: string
  shortsFill: string
  pantsItemId: string
  shoesItemId: string
  /** Peau tête (sous le visage) */
  showHead?: boolean
}

export function MascotBody({ skin, shortsFill, pantsItemId, shoesItemId, showHead = true }: Props) {
  const { cx, head, shorts, leg, legY, shoeH } = MASCOT
  const pants = pantsItemId || 'pants-kit'
  const shoes = shoesItemId || 'shoes-studs'
  const showKitShorts = pants === 'pants-kit'

  const pantsFill =
    pants === 'pants-jeans'
      ? '#3d4f6f'
      : pants === 'pants-jogger'
        ? '#2a3038'
        : pants === 'pants-chino'
          ? '#c9b896'
          : pants === 'pants-cargo'
            ? '#4a5d46'
            : '#1e293b'

  const shoeTop =
    shoes === 'shoes-sneaker-white' || shoes === 'shoes-sneaker-neon'
      ? '#f8fafc'
      : shoes === 'shoes-retro-gum'
        ? '#fde68a'
        : '#0f172a'

  const leftX = cx - leg.w - leg.gap / 2
  const rightX = cx + leg.gap / 2
  const legH = showKitShorts ? leg.h : leg.h + 4
  const legStart = showKitShorts ? legY : legY - 4

  return (
    <g aria-label="corps">
      {!showKitShorts ? (
        <path d={`M ${shorts.x} ${shorts.y - 6} L ${shorts.x + shorts.w} ${shorts.y - 6} L ${shorts.x + shorts.w - 1} ${shorts.y} L ${shorts.x + 1} ${shorts.y} Z`} fill={pantsFill} stroke="rgba(15,23,42,0.12)" strokeWidth={0.3} />
      ) : null}

      {showKitShorts ? (
        <rect x={shorts.x} y={shorts.y} width={shorts.w} height={shorts.h} rx={2.2} fill={shortsFill} opacity={0.9} stroke="rgba(15,23,42,.12)" strokeWidth={0.32} />
      ) : null}

      <rect x={leftX} y={legStart} width={leg.w} height={legH} rx={2.8} fill={showKitShorts ? skin : pantsFill} stroke="rgba(15,23,42,0.12)" strokeWidth={0.28} />
      <rect x={rightX} y={legStart} width={leg.w} height={legH} rx={2.8} fill={showKitShorts ? skin : pantsFill} stroke="rgba(15,23,42,0.12)" strokeWidth={0.28} />

      <rect x={leftX - 0.5} y={legStart + legH - shoeH} width={leg.w + 1} height={shoeH} rx={1.4} fill={shoeTop} stroke="rgba(15,23,42,0.18)" strokeWidth={0.25} />
      <rect x={rightX - 0.5} y={legStart + legH - shoeH} width={leg.w + 1} height={shoeH} rx={1.4} fill={shoeTop} stroke="rgba(15,23,42,0.18)" strokeWidth={0.25} />

      <path
        d={`M ${cx - 9} ${MASCOT.neck.topY} Q ${cx} ${MASCOT.neck.topY - 1.5} ${cx + 9} ${MASCOT.neck.topY} L ${cx + 7} ${MASCOT.neck.bottomY} Q ${cx} ${MASCOT.neck.bottomY + 1} ${cx - 7} ${MASCOT.neck.bottomY} Z`}
        fill={skin}
        stroke={strokeSubtle(skin)}
        strokeWidth={0.24}
      />

      {showHead ? (
        <ellipse
          cx={head.cx}
          cy={head.cy}
          rx={head.rx}
          ry={head.ry}
          fill={skin}
          stroke={strokeSubtle(skin)}
          strokeWidth={0.32}
        />
      ) : null}
    </g>
  )
}
