import type { AvatarCharacterLook } from '../../types/profile'
import {
  HEAD_ANCHOR_MAP,
  longHairBackStrandD,
  ponytailStrandD,
  skullCapArcD,
  skullTopMassD,
  templeFadeBandD,
  type HeadAnchorMap,
} from './avatarHeadAnchorMap'
import { AVATAR_HEAD } from './avatarHeadZones'

function mixHex(a: string, colorB: string, t: number): string {
  const parse = (h: string) => {
    const s = h.replace('#', '').trim()
    if (s.length !== 6) return null
    const n = parseInt(s, 16)
    if (Number.isNaN(n)) return null
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
  }
  const A = parse(a)
  const B = parse(colorB)
  if (!A || !B) return a
  const r = Math.round(A.r + (B.r - A.r) * t)
  const g = Math.round(A.g + (B.g - A.g) * t)
  const b = Math.round(A.b + (B.b - A.b) * t)
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

const A = HEAD_ANCHOR_MAP
const { topHead, leftTemple, rightTemple, backHead } = A

function HairCrownArc({
  fill,
  edgeColor,
  strokeWidth = 0.35,
}: {
  fill: string
  edgeColor: string
  strokeWidth?: number
}) {
  return (
    <path
      d={skullCapArcD(A)}
      fill={fill}
      stroke={edgeColor}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  )
}

function TempleFadeBands({ shaved }: { shaved: string }) {
  return (
    <g>
      <path d={templeFadeBandD('left', A)} fill={shaved} opacity={0.82} />
      <path d={templeFadeBandD('right', A)} fill={shaved} opacity={0.82} />
    </g>
  )
}

function WavyTopMass({ fill, edgeColor }: { fill: string; edgeColor: string }) {
  const bumps: HeadAnchorMap['topHead'][] = [
    { x: leftTemple.x + 8, y: topHead.y + 2 },
    { x: topHead.x - 6, y: topHead.y - 5 },
    { x: topHead.x + 6, y: topHead.y - 6 },
    { x: rightTemple.x - 8, y: topHead.y + 2 },
  ]
  return (
    <g>
      <path d={skullTopMassD(A, { peakY: topHead.y - 2, widthScale: 1.1 })} fill={fill} stroke={edgeColor} strokeWidth={0.32} strokeLinejoin="round" />
      {bumps.map((p, i) => (
        <ellipse key={i} cx={p.x} cy={p.y} rx={5.5} ry={7} fill={fill} stroke={edgeColor} strokeWidth={0.26} />
      ))}
    </g>
  )
}

function CurlyTopMass({ fill, edgeColor }: { fill: string; edgeColor: string }) {
  const curls: { cx: number; cy: number; r: number }[] = [
    { cx: topHead.x, cy: topHead.y - 6, r: 7.5 },
    { cx: leftTemple.x + 10, cy: topHead.y + 1, r: 6.5 },
    { cx: rightTemple.x - 10, cy: topHead.y + 1, r: 6.5 },
    { cx: topHead.x - 8, cy: topHead.y + 4, r: 5.5 },
    { cx: topHead.x + 8, cy: topHead.y + 4, r: 5.5 },
  ]
  return (
    <g>
      {curls.map((c, i) => (
        <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill={fill} stroke={edgeColor} strokeWidth={0.28} />
      ))}
    </g>
  )
}

/** Cheveux de face — ancrés au crâne, clip HairArea. */
export function HairFrontPath({
  style,
  fill,
  edgeColor,
}: {
  style: AvatarCharacterLook['hairStyle']
  fill: string
  edgeColor: string
}) {
  const stroke = { stroke: edgeColor, strokeWidth: 0.35 as const, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
  const shaved = mixHex(edgeColor, '#f8fafc', 0.38)

  switch (style) {
    case 'buzz':
      return (
        <g>
          <TempleFadeBands shaved={shaved} />
          <ellipse cx={topHead.x} cy={topHead.y + 3} rx={10} ry={3.8} fill={fill} {...stroke} strokeWidth={0.26} />
        </g>
      )

    case 'faded':
      return (
        <g>
          <TempleFadeBands shaved={shaved} />
          <path d={skullCapArcD(A)} fill={fill} opacity={0.35} stroke="none" />
          <ellipse cx={topHead.x} cy={topHead.y - 2} rx={14} ry={11} fill={fill} {...stroke} />
          <ellipse cx={topHead.x} cy={topHead.y - 5} rx={8} ry={5} fill={mixHex(fill, '#ffffff', 0.14)} opacity={0.9} />
        </g>
      )

    case 'short':
      return (
        <g>
          <path d={skullTopMassD(A, { peakY: topHead.y - 6, widthScale: 1.15 })} fill={fill} {...stroke} />
          <path
            d={`M ${leftTemple.x + 2} ${leftTemple.y - 1} L ${rightTemple.x - 2} ${rightTemple.y - 1}`}
            fill="none"
            stroke={mixHex(fill, '#ffffff', 0.2)}
            strokeWidth={0.5}
            strokeLinecap="round"
            opacity={0.85}
          />
        </g>
      )

    case 'wavy':
      return <WavyTopMass fill={fill} edgeColor={edgeColor} />

    case 'long':
      return <HairCrownArc fill={fill} edgeColor={edgeColor} strokeWidth={0.32} />

    case 'curly':
      return <CurlyTopMass fill={fill} edgeColor={edgeColor} />

    case 'sidepart':
      return (
        <g>
          <path d={templeFadeBandD('left', A)} fill={shaved} opacity={0.75} />
          <path
            d={`M ${topHead.x - 1} ${topHead.y - 4}
              C ${rightTemple.x - 6} ${topHead.y - 6}, ${rightTemple.x} ${rightTemple.y - 4}, ${rightTemple.x - 2} ${rightTemple.y}
              A ${AVATAR_HEAD.hairOuterRx * 0.9} ${AVATAR_HEAD.hairOuterRy * 0.85} 0 0 0 ${topHead.x - 1} ${topHead.y - 4}
              Z`}
            fill={fill}
            {...stroke}
          />
          <path
            d={`M ${topHead.x - 1} ${topHead.y - 4} L ${topHead.x + 2} ${leftTemple.y + 2}`}
            fill="none"
            stroke={edgeColor}
            strokeWidth={0.42}
            strokeLinecap="round"
          />
        </g>
      )

    case 'undercut':
      return (
        <g>
          <TempleFadeBands shaved={shaved} />
          <path
            d={`M ${topHead.x - 2} ${topHead.y - 2}
              C ${rightTemple.x - 4} ${topHead.y - 8}, ${rightTemple.x - 2} ${rightTemple.y - 6}, ${topHead.x + 4} ${leftTemple.y}
              A ${AVATAR_HEAD.hairOuterRx * 0.75} ${AVATAR_HEAD.hairOuterRy * 0.7} 0 0 0 ${topHead.x - 2} ${topHead.y - 2}
              Z`}
            fill={fill}
            {...stroke}
          />
        </g>
      )

    case 'ponytail':
      return (
        <g>
          <HairCrownArc fill={fill} edgeColor={edgeColor} strokeWidth={0.3} />
          <path
            d={`M ${topHead.x} ${topHead.y + 4} L ${topHead.x} ${leftTemple.y + 6}`}
            fill="none"
            stroke={edgeColor}
            strokeWidth={0.32}
            strokeLinecap="round"
            opacity={0.55}
          />
        </g>
      )

    case 'mohawk':
      return (
        <g>
          <TempleFadeBands shaved={shaved} />
          <path
            d={`M ${topHead.x - 8} ${topHead.y + 6}
              L ${topHead.x - 6} ${topHead.y - 18}
              C ${topHead.x - 3} ${topHead.y - 24}, ${topHead.x + 3} ${topHead.y - 24}, ${topHead.x + 6} ${topHead.y - 18}
              L ${topHead.x + 8} ${topHead.y + 6}
              Z`}
            fill={fill}
            {...stroke}
            strokeWidth={0.38}
          />
        </g>
      )

    case 'afro':
      return (
        <g>
          <ellipse cx={topHead.x} cy={topHead.y + 2} rx={26} ry={22} fill={fill} {...stroke} />
          <ellipse cx={topHead.x - 12} cy={topHead.y} rx={7} ry={6} fill={mixHex(fill, '#ffffff', 0.1)} opacity={0.45} />
        </g>
      )

    default:
      return null
  }
}

/** Volume arrière — queue sur backHead uniquement. */
export function HairBackPath({
  style,
  fill,
  edgeColor,
}: {
  style: AvatarCharacterLook['hairStyle']
  fill: string
  edgeColor: string
}) {
  const stroke = { stroke: edgeColor, strokeWidth: 0.35 as const, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }

  switch (style) {
    case 'long':
      return (
        <g>
          <path d={longHairBackStrandD('left', A)} fill={fill} {...stroke} />
          <path d={longHairBackStrandD('right', A)} fill={fill} {...stroke} />
          <path
            d={`M ${backHead.x - 8} ${backHead.y}
              C ${backHead.x} ${A.neckBack.y}, ${backHead.x + 8} ${backHead.y}, ${backHead.x} ${A.neckBack.y + 10}
              Z`}
            fill={fill}
            opacity={0.95}
            {...stroke}
          />
        </g>
      )

    case 'ponytail':
      return (
        <g>
          <ellipse cx={backHead.x} cy={backHead.y} rx={6.5} ry={4.5} fill={fill} {...stroke} strokeWidth={0.3} />
          <path d={ponytailStrandD(A)} fill={fill} {...stroke} />
          <ellipse cx={backHead.x} cy={A.neckBack.y + 16} rx={5.5} ry={6.5} fill={fill} {...stroke} strokeWidth={0.28} />
        </g>
      )

    case 'mohawk':
      return (
        <path
          d={`M ${topHead.x - 7} ${topHead.y + 4}
            L ${topHead.x - 5} ${topHead.y - 20}
            C ${topHead.x - 2} ${topHead.y - 26}, ${topHead.x + 2} ${topHead.y - 26}, ${topHead.x + 5} ${topHead.y - 20}
            L ${topHead.x + 7} ${topHead.y + 4}
            Z`}
          fill={fill}
          {...stroke}
          strokeWidth={0.38}
        />
      )

    default:
      return null
  }
}

/** Vue dos — silhouettes ancrées. */
export function HairBackViewPath({
  style,
  fill,
  edgeColor,
}: {
  style: AvatarCharacterLook['hairStyle']
  fill: string
  edgeColor: string
}) {
  const stroke = { stroke: edgeColor, strokeWidth: 0.35 as const, strokeLinejoin: 'round' as const }
  const shaved = mixHex(edgeColor, '#f8fafc', 0.38)

  switch (style) {
    case 'buzz':
      return <ellipse cx={topHead.x} cy={topHead.y + 10} rx={22} ry={20} fill={fill} {...stroke} strokeWidth={0.28} />
    case 'faded':
      return (
        <g>
          <ellipse cx={topHead.x} cy={topHead.y + 12} rx={23} ry={20} fill={fill} opacity={0.45} {...stroke} />
          <ellipse cx={topHead.x} cy={topHead.y - 2} rx={14} ry={11} fill={fill} {...stroke} />
        </g>
      )
    case 'short':
      return <path d={skullTopMassD(A, { peakY: topHead.y - 4 })} fill={fill} {...stroke} />
    case 'wavy':
      return <WavyTopMass fill={fill} edgeColor={edgeColor} />
    case 'curly':
      return <CurlyTopMass fill={fill} edgeColor={edgeColor} />
    case 'long':
      return (
        <g>
          <path d={skullCapArcD(A)} fill={fill} {...stroke} />
          <path d={longHairBackStrandD('left', A)} fill={fill} {...stroke} />
          <path d={longHairBackStrandD('right', A)} fill={fill} {...stroke} />
        </g>
      )
    case 'ponytail':
      return (
        <g>
          <path d={skullCapArcD(A)} fill={fill} {...stroke} strokeWidth={0.3} />
          <ellipse cx={backHead.x} cy={backHead.y} rx={6} ry={4.5} fill={fill} {...stroke} strokeWidth={0.28} />
          <path d={ponytailStrandD(A)} fill={fill} {...stroke} />
          <ellipse cx={backHead.x} cy={A.neckBack.y + 16} rx={5.5} ry={6.5} fill={fill} {...stroke} strokeWidth={0.28} />
        </g>
      )
    case 'mohawk':
      return (
        <path
          d={`M ${topHead.x - 8} ${topHead.y + 8}
            L ${topHead.x - 6} ${topHead.y - 22}
            C ${topHead.x - 3} ${topHead.y - 28}, ${topHead.x + 3} ${topHead.y - 28}, ${topHead.x + 6} ${topHead.y - 22}
            L ${topHead.x + 8} ${topHead.y + 8}
            Z`}
          fill={fill}
          {...stroke}
          strokeWidth={0.4}
        />
      )
    case 'afro':
      return <ellipse cx={topHead.x} cy={topHead.y + 4} rx={27} ry={25} fill={fill} {...stroke} />
    case 'sidepart':
      return (
        <path
          d={`M ${leftTemple.x} ${leftTemple.y}
            C ${topHead.x - 4} ${topHead.y - 8}, ${rightTemple.x} ${rightTemple.y - 6}, ${rightTemple.x - 2} ${A.neckBack.y - 18}
            L ${leftTemple.x + 4} ${leftTemple.y + 6}
            Z`}
          fill={fill}
          {...stroke}
        />
      )
    case 'undercut':
      return (
        <g>
          <ellipse cx={topHead.x} cy={A.neckBack.y - 14} rx={21} ry={16} fill={shaved} opacity={0.55} />
          <path d={skullTopMassD(A, { peakY: topHead.y - 4, widthScale: 0.95 })} fill={fill} {...stroke} />
        </g>
      )
    default:
      return <path d={skullCapArcD(A)} fill={fill} {...stroke} />
  }
}
