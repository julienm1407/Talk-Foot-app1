import { useId } from 'react'
import type { AvatarCharacterLook, FaceExpression, JerseyPattern } from '../../types/profile'
import { PIXEL_JERSEY_PRESETS, type PixelJerseyPresetId } from '../../data/pixelJerseyPresets'
import { PixelJerseyPixelGroup } from '../kit/PixelJerseySvg'
import { cn } from '../../utils/cn'
import { HairBackPath, HairBackViewPath, HairFrontPath } from './avatarHairPaths'
import {
  AVATAR_HEAD,
  beardAreaClipPathD,
  hairAreaClipPathD,
  hairBackAreaClipPathD,
  hairRingGradientCoords,
  hairStyleUsesBackLayer,
} from './avatarHeadZones'

function parseHex(h: string): { r: number; g: number; b: number } | null {
  const s = h.replace('#', '').trim()
  if (s.length !== 6) return null
  const n = parseInt(s, 16)
  if (Number.isNaN(n)) return null
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function mixHex(a: string, colorB: string, t: number): string {
  const A = parseHex(a)
  const B = parseHex(colorB)
  if (!A || !B) return a
  const r = Math.round(A.r + (B.r - A.r) * t)
  const gCh = Math.round(A.g + (B.g - A.g) * t)
  const bCh = Math.round(A.b + (B.b - A.b) * t)
  return `#${[r, gCh, bCh].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

const EXPR: Record<
  FaceExpression,
  { browOuterY: number; browInnerY: number; eyeScale: number; cheekBlush: number }
> = {
  neutral: { browOuterY: -10, browInnerY: -9.5, eyeScale: 1, cheekBlush: 0.22 },
  happy: { browOuterY: -10.5, browInnerY: -10.2, eyeScale: 1.02, cheekBlush: 0.35 },
  hyped: { browOuterY: -11.5, browInnerY: -11, eyeScale: 1.1, cheekBlush: 0.45 },
  serious: { browOuterY: -9.2, browInnerY: -8.4, eyeScale: 0.98, cheekBlush: 0.12 },
}

export type TorsoColors = {
  primary: string
  secondary: string
  pattern: JerseyPattern
  stripeLight?: string
}

function resolveTorso(
  look: AvatarCharacterLook,
  jerseyOverride: TorsoColors | null,
  supporterColors: [string, string] | null,
): TorsoColors {
  if (jerseyOverride) return jerseyOverride
  if (look.supporterTint && supporterColors) {
    return {
      primary: supporterColors[0],
      secondary: supporterColors[1],
      pattern: look.outfitPattern,
      stripeLight: '#f8fafc',
    }
  }
  return {
    primary: look.outfitPrimary,
    secondary: look.outfitSecondary,
    pattern: look.outfitPattern,
    stripeLight: '#f8fafc',
  }
}

/** Bras courts (peau) — silhouette fine type manche courte, courbes légères. */
function ShortSleeveArms({
  skin,
  x,
  y,
  w,
}: {
  skin: string
  x: number
  y: number
  w: number
}) {
  const stroke = { stroke: 'rgba(15,23,42,0.16)', strokeWidth: 0.32 as const, strokeLinejoin: 'round' as const }
  return (
    <g aria-hidden>
      <path
        d={`M ${x + 4} ${y + 7}
          C ${x} ${y + 9}, ${x - 4} ${y + 15}, ${x - 6.5} ${y + 24}
          C ${x - 8} ${y + 30}, ${x - 7.5} ${y + 36}, ${x - 4} ${y + 38.5}
          C ${x - 1} ${y + 40}, ${x + 2} ${y + 37}, ${x + 3.5} ${y + 31}
          C ${x + 4.5} ${y + 22}, ${x + 5} ${y + 13}, ${x + 4} ${y + 7}
          Z`}
        fill={skin}
        {...stroke}
      />
      <path
        d={`M ${x + w - 4} ${y + 7}
          C ${x + w} ${y + 9}, ${x + w + 4} ${y + 15}, ${x + w + 6.5} ${y + 24}
          C ${x + w + 8} ${y + 30}, ${x + w + 7.5} ${y + 36}, ${x + w + 4} ${y + 38.5}
          C ${x + w + 1} ${y + 40}, ${x + w - 2} ${y + 37}, ${x + w - 3.5} ${y + 31}
          C ${x + w - 4.5} ${y + 22}, ${x + w - 5} ${y + 13}, ${x + w - 4} ${y + 7}
          Z`}
        fill={skin}
        {...stroke}
      />
    </g>
  )
}

/**
 * Silhouette maillot — épaules couvertes ; base plus étroite (trapèze) calée sur
 * `TorsoBlock` 0.44 vs `LegsBlock` 0.38 en 3D : hém ≈ w×0.38/0.44 pour ne pas « flotter » au-dessus du short.
 */
/** Écart épaules / col — plus bas = silhouette plus près du corps. */
const JERSEY_SHOULDER_PAD = 5.1

function shirtPathD(x: number, y: number, w: number, h: number, pad = JERSEY_SHOULDER_PAD) {
  const cx = x + w / 2
  const neck = w * 0.2
  const neckY = y + 4
  const hemY = y + h - 0.5
  /** Demi-largeur bas maillot : même ratio que jambes / torse POP (0.38 / 0.44). */
  const hemHalf = (w * 0.38) / (2 * 0.44)
  /* Courbes d’épaule : évite l’angle vif du « L » qui trahissait un trait net au contour. */
  return `M ${x - pad - 1.5} ${y + 12}
    Q ${x - pad * 0.62} ${y + 7.2}, ${x - pad * 0.35} ${y + 3}
    L ${cx - neck / 2 - 0.5} ${neckY}
    L ${cx + neck / 2 + 0.5} ${neckY}
    L ${x + w + pad * 0.35} ${y + 3}
    Q ${x + w + pad * 0.62} ${y + 7.2}, ${x + w + pad + 1.5} ${y + 12}
    L ${cx + hemHalf} ${hemY}
    L ${cx - hemHalf} ${hemY}
    Z`
}

/** Position / taille maillot 2D (avant ~28×44 @ y=72, h=48). */
const AVATAR_KIT = { x: 31, y: 73, w: 38, h: 42 } as const

/** Réf. torse 3D `PopCharacter` `TorsoBlock` (RoundedBox) — aligner les bandes SVG boutique / chat. */
const TORSO_W_REF = 0.44
const TORSO_H_REF = 0.36

function patternLayerInsideBbox(
  bbox: { x0: number; y0: number; x1: number; y1: number },
  colors: TorsoColors,
) {
  const { primary, secondary, pattern } = colors
  const light = colors.stripeLight ?? '#f1f5f9'
  const bw = bbox.x1 - bbox.x0
  const bh = bbox.y1 - bbox.y0
  const x0 = bbox.x0
  const y0 = bbox.y0
  const fw = (u: number) => (u / TORSO_W_REF) * bw
  const fh = (u: number) => (u / TORSO_H_REF) * bh
  /** Coordonnée Y locale torse [-0.18 haut, +0.18 bas] → SVG */
  const yFromLocal = (yl: number) => y0 + ((yl + TORSO_H_REF / 2) / TORSO_H_REF) * bh
  /** Coordonnée X locale [-0.22 gauche, +0.22 droite] → SVG */
  const xFromLocal = (xl: number) => x0 + ((xl + TORSO_W_REF / 2) / TORSO_W_REF) * bw

  if (pattern === 'solid') {
    return <rect x={x0} y={y0} width={bw} height={bh} fill={primary} />
  }

  if (pattern === 'kit_mesh') {
    const hb = fh(0.02)
    const vb = fw(0.02)
    const hYs = [0.1, 0.02, -0.08]
    const vXs = [-0.1, 0, 0.1]
    const vHeights = [0.22, 0.24, 0.22]
    const xBarKm = x0 + (bw - fw(0.32)) / 2
    return (
      <g>
        <rect x={x0} y={y0} width={bw} height={bh} fill={primary} />
        {hYs.map((yl, i) => (
          <rect
            key={`h${i}`}
            x={xBarKm}
            y={yFromLocal(yl) - hb / 2}
            width={fw(0.32)}
            height={hb}
            fill={secondary}
            opacity={0.88}
          />
        ))}
        {vXs.map((xl, i) => (
          <rect
            key={`v${i}`}
            x={xFromLocal(xl) - vb / 2}
            y={yFromLocal(0) - fh(vHeights[i]) / 2}
            width={vb}
            height={fh(vHeights[i])}
            fill={secondary}
            opacity={0.88}
          />
        ))}
      </g>
    )
  }

  if (pattern === 'hechter') {
    const parts: { wu: number; fill: string }[] = [
      { wu: 0.109, fill: primary },
      { wu: 0.022, fill: light },
      { wu: 0.044, fill: primary },
      { wu: 0.09, fill: secondary },
      { wu: 0.044, fill: primary },
      { wu: 0.022, fill: light },
      { wu: 0.109, fill: primary },
    ]
    let cx = x0
    return (
      <g>
        {parts.map((p, i) => {
          const w = fw(p.wu)
          const el = <rect key={i} x={cx} y={y0} width={w} height={bh} fill={p.fill} />
          cx += w
          return el
        })}
      </g>
    )
  }

  if (pattern === 'vertical') {
    const vw = fw(0.1)
    const vh = fh(0.28)
    return (
      <g>
        <rect x={x0} y={y0} width={bw} height={bh} fill={primary} />
        <rect
          x={x0 + (bw - vw) / 2}
          y={y0 + (bh - vh) / 2}
          width={vw}
          height={vh}
          fill={secondary}
        />
      </g>
    )
  }

  if (pattern === 'horizontal') {
    const hb = fh(0.042)
    const bwBar = fw(0.32)
    const xBar = x0 + (bw - bwBar) / 2
    return (
      <g>
        <rect x={x0} y={y0} width={bw} height={bh} fill={primary} />
        {[0.1, 0, -0.1].map((yl, i) => (
          <rect
            key={i}
            x={xBar}
            y={yFromLocal(yl) - hb / 2}
            width={bwBar}
            height={hb}
            fill={secondary}
          />
        ))}
      </g>
    )
  }

  if (pattern === 'sash') {
    const cxm = x0 + bw / 2
    const cym = y0 + bh / 2
    const deg = (0.52 * 180) / Math.PI
    const rw = fw(0.12) * 2.2
    const rh = fh(0.35) * 1.08
    return (
      <g>
        <rect x={x0} y={y0} width={bw} height={bh} fill={primary} />
        <rect
          x={cxm - rw / 2}
          y={cym - rh / 2}
          width={rw}
          height={rh}
          fill={secondary}
          opacity={0.93}
          transform={`rotate(${deg.toFixed(2)} ${cxm} ${cym})`}
        />
      </g>
    )
  }

  /* hoops — bandes secondaires sur base primaire (comme 3D) */
  const hb = fh(0.03)
  const bwBar = fw(0.34)
  const xBar = x0 + (bw - bwBar) / 2
  const centers = [0.11, 0.04, -0.04, -0.11]
  return (
    <g>
      <rect x={x0} y={y0} width={bw} height={bh} fill={primary} />
      {centers.map((yl, i) => (
        <rect
          key={i}
          x={xBar}
          y={yFromLocal(yl) - hb / 2}
          width={bwBar}
          height={hb}
          fill={secondary}
          opacity={0.95}
        />
      ))}
    </g>
  )
}

function JerseyKit({
  uid,
  x,
  y,
  w,
  h,
  colors,
  variant,
  flocage,
  pixelJersey,
}: {
  uid: string
  x: number
  y: number
  w: number
  h: number
  colors: TorsoColors
  variant: 'front' | 'back'
  flocage?: { name: string; number: string }
  pixelJersey?: { preset: PixelJerseyPresetId } | null
}) {
  const pathD = shirtPathD(x, y, w, h)
  const pad = JERSEY_SHOULDER_PAD
  const cxBox = x + w / 2
  const hemHalf = (w * 0.38) / (2 * 0.44)
  const bbox = {
    x0: Math.min(x - pad - 1.5, cxBox - hemHalf) - 0.35,
    y0: y + 2,
    x1: Math.max(x + w + pad + 1.5, cxBox + hemHalf) + 0.35,
    y1: y + h - 1,
  }
  const bw = bbox.x1 - bbox.x0
  const bh = bbox.y1 - bbox.y0
  const light = colors.stripeLight ?? '#f1f5f9'
  const cx = x + w / 2
  const neck = w * 0.2
  const hasPixel = Boolean(pixelJersey?.preset)
  const presetDef =
    pixelJersey?.preset != null ? PIXEL_JERSEY_PRESETS[pixelJersey.preset] : null

  /** Maillot pixel : texture zoomée et remontée pour remplir la silhouette (clip chemise). */
  const pixelScale = 1.52
  const pxW = bw * pixelScale
  const pxH = bh * pixelScale
  const pxX = bbox.x0 - (pxW - bw) / 2
  const pxY = bbox.y0 - (pxH - bh) / 2 - 1.6

  return (
    <g>
      <defs>
        <clipPath id={`${uid}-shirt`}>
          <path d={pathD} />
        </clipPath>
        <linearGradient id={`${uid}-jer3d`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.16} />
          <stop offset="40%" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="100%" stopColor="#0f172a" stopOpacity={0.14} />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${uid}-shirt)`}>
        {hasPixel && pixelJersey?.preset && presetDef ? (
          <svg
            x={pxX}
            y={pxY}
            width={pxW}
            height={pxH}
            viewBox={`0 0 ${presetDef.cols} ${presetDef.rows.length}`}
            preserveAspectRatio="none"
            shapeRendering="crispEdges"
          >
            <PixelJerseyPixelGroup preset={pixelJersey.preset} />
          </svg>
        ) : null}
        {!hasPixel ? (
          <>
            {patternLayerInsideBbox(bbox, colors)}
            <rect
              x={bbox.x0}
              y={bbox.y0}
              width={bw}
              height={bh}
              fill={`url(#${uid}-jer3d)`}
            />
          </>
        ) : null}
      </g>

      <path
        d={pathD}
        fill="none"
        stroke="rgba(15,23,42,.12)"
        strokeWidth={0.38}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Encolure côtelée (alignée sur le haut du maillot) */}
      <path
        d={`M ${cx - neck / 2 - 0.5} ${y + 4} Q ${cx} ${y + 2.2} ${cx + neck / 2 + 0.5} ${y + 4}`}
        fill="none"
        stroke="rgba(15,23,42,.35)"
        strokeWidth={0.65}
        strokeLinecap="round"
      />

      {/* Parements manches (blanc + liseré) — visibles aussi en maillot pixel + zoom chat */}
      <g>
        <rect x={x - 4} y={y + 15} width={12} height={4} rx={0.7} fill={light} opacity={0.98} />
        <rect x={x - 4} y={y + 18} width={12} height={1.6} rx={0.35} fill={colors.secondary} opacity={0.96} />
        <rect x={x + w - 8} y={y + 15} width={12} height={4} rx={0.7} fill={light} opacity={0.98} />
        <rect x={x + w - 8} y={y + 18} width={12} height={1.6} rx={0.35} fill={colors.secondary} opacity={0.96} />
      </g>

      {variant === 'back' && flocage && (
        <g clipPath={`url(#${uid}-shirt)`} pointerEvents="none">
          <text
            x={cx}
            y={y + h * 0.52}
            textAnchor="middle"
            fontSize={17}
            fontWeight={800}
            fill="rgba(15,23,42,.92)"
            fontFamily="system-ui, sans-serif"
          >
            {flocage.number.slice(0, 2)}
          </text>
          <text
            x={cx}
            y={y + h * 0.72}
            textAnchor="middle"
            fontSize={6.8}
            fontWeight={700}
            fill="rgba(51,65,85,.95)"
            fontFamily="system-ui, sans-serif"
            letterSpacing={0.4}
          >
            {flocage.name.slice(0, 10)}
          </text>
        </g>
      )}
    </g>
  )
}


function BeardPath({
  beard,
  fill,
  strokeColor,
  cx,
  cy,
}: {
  beard: AvatarCharacterLook['beard']
  /** Dégradé ou couleur */
  fill: string
  strokeColor: string
  cx: number
  cy: number
}) {
  /*
   * `cy` = centre tête ; lèvre haute ~ cy+12, bouche ~ cy+12…16.
   * Moustache : uniquement au-dessus de la bouche. Barbe (light, stubble, goatee, full, bouc vanDyke) : sous la bouche.
   */
  if (beard === 'none') return null
  if (beard === 'light') {
    return (
      <path
        d={`M ${cx - 11} ${cy + 16.2} Q ${cx} ${cy + 22} ${cx + 11} ${cy + 16.2}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2.2}
        strokeLinecap="round"
        opacity={0.92}
      />
    )
  }
  if (beard === 'stubble') {
    const pts = [
      [-13, 16.5],
      [-9.5, 18],
      [-6, 19.2],
      [-2.5, 19.8],
      [0, 20.5],
      [2.5, 19.8],
      [6, 19.2],
      [9.5, 18],
      [13, 16.5],
      [-10, 15.5],
      [-5, 16],
      [0, 16.5],
      [5, 16],
      [10, 15.5],
      [-8.5, 23.5],
      [-4, 25.2],
      [0, 26],
      [4, 25.2],
      [8.5, 23.5],
    ] as const
    return (
      <g opacity={0.56}>
        {pts.map(([dx, dy], i) => (
          <circle key={i} cx={cx + dx} cy={cy + dy} r={0.9} fill={strokeColor} />
        ))}
        <ellipse cx={cx} cy={cy + 20.5} rx={14.5} ry={7.2} fill={fill} opacity={0.12} />
      </g>
    )
  }
  if (beard === 'moustache') {
    return (
      <path
        d={`M ${cx - 14.5} ${cy + 11}
          C ${cx - 11} ${cy + 9.4}, ${cx - 4} ${cy + 9.6}, ${cx} ${cy + 10.2}
          C ${cx + 4} ${cy + 9.6}, ${cx + 11} ${cy + 9.4}, ${cx + 14.5} ${cy + 11}
          C ${cx + 10} ${cy + 12.4}, ${cx + 4} ${cy + 12}, ${cx} ${cy + 11.8}
          C ${cx - 4} ${cy + 12}, ${cx - 10} ${cy + 12.4}, ${cx - 14.5} ${cy + 11}
          Z`}
        fill={fill}
        stroke={mixHex(strokeColor, '#0f172a', 0.25)}
        strokeWidth={0.2}
        opacity={0.96}
      />
    )
  }
  if (beard === 'goatee') {
    return (
      <ellipse
        cx={cx}
        cy={cy + 23}
        rx={6}
        ry={7}
        fill={fill}
        stroke={mixHex(strokeColor, '#0f172a', 0.2)}
        strokeWidth={0.2}
        opacity={0.94}
      />
    )
  }
  if (beard === 'vanDyke') {
    return (
      <g>
        <path
          d={`M ${cx - 9.5} ${cy + 10.2} Q ${cx} ${cy + 11.6} ${cx + 9.5} ${cy + 10.2}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={1.85}
          strokeLinecap="round"
          opacity={0.95}
        />
        <ellipse
          cx={cx}
          cy={cy + 23}
          rx={5.2}
          ry={6.8}
          fill={fill}
          stroke={mixHex(strokeColor, '#0f172a', 0.22)}
          strokeWidth={0.18}
          opacity={0.94}
        />
      </g>
    )
  }
  /* Barbe complète : bord haut sous la bouche (pas de masse sur la lèvre / philtrum). */
  return (
    <path
      d={`M ${cx - 17} ${cy + 15.2}
        C ${cx - 18.5} ${cy + 19}, ${cx - 11} ${cy + 23.8}, ${cx} ${cy + 25.2}
        C ${cx + 11} ${cy + 23.8}, ${cx + 18.5} ${cy + 19}, ${cx + 17} ${cy + 15.2}
        C ${cx + 10.5} ${cy + 16.4}, ${cx - 10.5} ${cy + 16.4}, ${cx - 17} ${cy + 15.2}
        Z`}
      fill={fill}
      stroke={mixHex(strokeColor, '#0f172a', 0.2)}
      strokeWidth={0.24}
      strokeLinejoin="round"
      opacity={0.94}
    />
  )
}

function ExpressiveMouth({ cx, faceY, expr }: { cx: number; faceY: number; expr: FaceExpression }) {
  const lip = mixHex('#9a3412', '#ea580c', 0.35)
  switch (expr) {
    case 'neutral':
      return (
        <path
          d={`M ${cx - 4.5} ${faceY + 13.5} Q ${cx} ${faceY + 15.2} ${cx + 4.5} ${faceY + 13.5}`}
          fill="none"
          stroke={lip}
          strokeWidth={1}
          strokeLinecap="round"
        />
      )
    case 'happy':
      return (
        <path
          d={`M ${cx - 7.5} ${faceY + 13} Q ${cx} ${faceY + 17.8} ${cx + 7.5} ${faceY + 13}`}
          fill="none"
          stroke={lip}
          strokeWidth={1.15}
          strokeLinecap="round"
        />
      )
    case 'hyped':
      return (
        <g>
          <path
            d={`M ${cx - 8.5} ${faceY + 12} Q ${cx} ${faceY + 19} ${cx + 8.5} ${faceY + 12}`}
            fill="none"
            stroke={lip}
            strokeWidth={1.2}
            strokeLinecap="round"
          />
          <path
            d={`M ${cx - 5} ${faceY + 14.2} h 1.6 l 0.9 1.6 h 1.7 l 0.9 -1.6 h 1.7 l 0.9 1.6 h 1.6`}
            fill="#fffbeb"
            stroke="rgba(120,53,15,.28)"
            strokeWidth={0.18}
            strokeLinejoin="round"
          />
        </g>
      )
    case 'serious':
    default:
      return (
        <path
          d={`M ${cx - 5.2} ${faceY + 14.2} L ${cx + 5.2} ${faceY + 14.2}`}
          fill="none"
          stroke={lip}
          strokeWidth={0.95}
          strokeLinecap="round"
          opacity={0.92}
        />
      )
  }
}

function Eyebrows({
  cx,
  faceY,
  hairColor,
  expr,
}: {
  cx: number
  faceY: number
  hairColor: string
  expr: FaceExpression
}) {
  const e = EXPR[expr]
  const outerL = faceY + e.browOuterY
  const innerL = faceY + e.browInnerY
  const outerR = faceY + e.browOuterY
  const innerR = faceY + e.browInnerY
  const serious = expr === 'serious'
  const w = serious ? 1.35 : 0.95
  const tip = mixHex(hairColor, '#f5f5f4', 0.12)
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.94}>
      <path
        d={`M ${cx - 19.5} ${outerL} Q ${cx - 10} ${innerL - 1.4} ${cx - 3.2} ${innerL + (serious ? 1.4 : 0.2)}`}
        stroke={hairColor}
        strokeWidth={w}
      />
      <path
        d={`M ${cx + 19.5} ${outerR} Q ${cx + 10} ${innerR - 1.4} ${cx + 3.2} ${innerR + (serious ? 1.4 : 0.2)}`}
        stroke={hairColor}
        strokeWidth={w}
      />
      <path
        d={`M ${cx - 18} ${outerL + 0.2} Q ${cx - 10} ${innerL - 1.1} ${cx - 4} ${innerL + (serious ? 1.1 : 0.1)}`}
        stroke={tip}
        strokeWidth={w * 0.38}
        opacity={0.55}
      />
      <path
        d={`M ${cx + 18} ${outerR + 0.2} Q ${cx + 10} ${innerR - 1.1} ${cx + 4} ${innerR + (serious ? 1.1 : 0.1)}`}
        stroke={tip}
        strokeWidth={w * 0.38}
        opacity={0.55}
      />
    </g>
  )
}

function EyeLashArc({ rx, ry, dramatic }: { rx: number; ry: number; dramatic: boolean }) {
  const n = dramatic ? 8 : 5
  const strokeW = dramatic ? 0.2 : 0.14
  const reach = dramatic ? 0.62 : 0.42
  return (
    <g
      fill="none"
      stroke="#0f172a"
      strokeWidth={strokeW}
      strokeLinecap="round"
      opacity={dramatic ? 0.82 : 0.58}
    >
      {Array.from({ length: n }, (_, i) => {
        const u = (i - (n - 1) / 2) / ((n - 1) / 2 || 1)
        const x0 = u * rx * 0.88
        const y0 = -ry * 0.42
        const x1 = x0 + u * rx * 0.06
        const y1 = y0 - reach
        return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} />
      })}
    </g>
  )
}

function EyeGroup({
  uid,
  cx,
  cy,
  rx,
  ry,
  skinTone,
  scale,
  eyelashStyle,
}: {
  uid: string
  cx: number
  cy: number
  rx: number
  ry: number
  skinTone: string
  scale: number
  eyelashStyle: AvatarCharacterLook['eyelashStyle']
}) {
  const irisR = Math.min(rx, ry) * 0.55
  const lid = mixHex(skinTone, '#1c1917', 0.18)
  const lashes = eyelashStyle === 'natural' || eyelashStyle === 'dramatic'
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
      <ellipse rx={rx} ry={ry} fill="#e9eef4" stroke="rgba(100,116,139,0.32)" strokeWidth={0.2} />
      <ellipse rx={rx * 0.92} ry={ry * 0.88} fill={`url(#sclera-${uid})`} opacity={0.55} />
      <circle r={irisR} fill={`url(#iris-${uid})`} />
      <circle r={irisR} fill="none" stroke="rgba(15,23,42,0.28)" strokeWidth={0.14} />
      <circle r={irisR * 0.4} fill="#070b12" />
      <circle cx={-irisR * 0.36} cy={-irisR * 0.34} r={irisR * 0.22} fill="#ffffff" opacity={0.92} />
      <circle cx={irisR * 0.14} cy={irisR * 0.2} r={irisR * 0.08} fill="#ffffff" opacity={0.5} />
      <path
        d={`M ${-rx * 0.94} ${-ry * 0.26} Q 0 ${-ry * 0.58} ${rx * 0.94} ${-ry * 0.26}`}
        fill="none"
        stroke={mixHex(lid, '#0f172a', 0.35)}
        strokeWidth={0.52}
        strokeLinecap="round"
        opacity={0.42}
      />
      <path
        d={`M ${-rx * 0.94} ${-ry * 0.26} Q 0 ${-ry * 0.48} ${rx * 0.94} ${-ry * 0.26}`}
        fill="none"
        stroke={lid}
        strokeWidth={0.22}
        strokeLinecap="round"
        opacity={0.55}
      />
      {lashes ? <EyeLashArc rx={rx} ry={ry} dramatic={eyelashStyle === 'dramatic'} /> : null}
    </g>
  )
}

function resolveEyeDims(shape: AvatarCharacterLook['eyeShape']): { rx: number; ry: number } {
  switch (shape) {
    case 'almond':
      return { rx: 5, ry: 3.5 }
    case 'narrow':
      return { rx: 4.1, ry: 3.15 }
    case 'wide':
      return { rx: 5.7, ry: 4.55 }
    case 'round':
    default:
      return { rx: 4.5, ry: 4.5 }
  }
}

function CheekBlush({ cx, faceY, expr }: { cx: number; faceY: number; expr: FaceExpression }) {
  const strength = EXPR[expr].cheekBlush * 0.32
  if (strength < 0.05) return null
  return (
    <g opacity={strength} pointerEvents="none">
      <ellipse cx={cx - 14} cy={faceY + 8} rx={7} ry={4.8} fill="#fda4af" />
      <ellipse cx={cx + 14} cy={faceY + 8} rx={7} ry={4.8} fill="#fda4af" />
    </g>
  )
}

function NoseHint({ cx, faceY, skinTone }: { cx: number; faceY: number; skinTone: string }) {
  const shade = mixHex(skinTone, '#0f172a', 0.1)
  return (
    <g pointerEvents="none" opacity={0.88}>
      <ellipse cx={cx + 0.5} cy={faceY + 6.8} rx={2.8} ry={4.2} fill={shade} opacity={0.16} />
      <path
        d={`M ${cx} ${faceY + 2} Q ${cx - 0.8} ${faceY + 5.5} ${cx - 1} ${faceY + 8.2}`}
        fill="none"
        stroke={mixHex(skinTone, '#1c1917', 0.1)}
        strokeWidth={0.32}
        strokeLinecap="round"
        opacity={0.28}
      />
    </g>
  )
}

function Glasses({ style, cx, cy }: { style: AvatarCharacterLook['glasses']; cx: number; cy: number }) {
  if (style === 'none') return null
  if (style === 'round') {
    return (
      <g fill="none" stroke="#1e293b" strokeWidth={1.4}>
        <circle cx={cx - 8.5} cy={cy} r={7} />
        <circle cx={cx + 8.5} cy={cy} r={7} />
        <path d={`M ${cx - 2} ${cy} L ${cx + 2} ${cy}`} />
      </g>
    )
  }
  return (
    <rect
      x={cx - 18}
      y={cy - 5}
      width={36}
      height={12}
      rx={3}
      fill="rgba(30,58,138,.25)"
      stroke="#1e293b"
      strokeWidth={1}
    />
  )
}

/** Bas + pieds : calques indépendants (ids boutique `pants-*` / `shoes-*`). */
function LowerBodyFeetLayer({
  pantsItemId,
  shoesItemId,
  shortsFill,
  skin,
}: {
  pantsItemId: string
  shoesItemId: string
  shortsFill: string
  skin: string
}) {
  const pants = pantsItemId || 'pants-kit'
  const shoes = shoesItemId || 'shoes-studs'

  const denim = '#3d4f6f'
  const jogger = '#2a3038'
  const chino = '#c9b896'
  const cargo = '#4a5d46'

  const pantsLegFill =
    pants === 'pants-jeans'
      ? denim
      : pants === 'pants-jogger'
        ? jogger
        : pants === 'pants-chino'
          ? chino
          : pants === 'pants-cargo'
            ? cargo
            : '#1e293b'

  const showKitShorts = pants === 'pants-kit'

  const shoeTop =
    shoes === 'shoes-sneaker-white' || shoes === 'shoes-sneaker-neon'
      ? '#f8fafc'
      : shoes === 'shoes-retro-gum'
        ? '#fde68a'
        : '#0f172a'

  const shoeAccent =
    shoes === 'shoes-sneaker-neon' ? '#22d3ee' : shoes === 'shoes-retro-gum' ? '#92400e' : '#334155'

  const legY = showKitShorts ? 118 : 114
  const legH = showKitShorts ? 20 : 24
  const legW = 11
  const legRx = 3
  const leftX = 33
  const rightX = 56

  const legFill =
    showKitShorts && (shoes === 'shoes-studs' || shoes === 'shoes-retro-gum')
      ? pantsLegFill
      : !showKitShorts
        ? pantsLegFill
        : skin

  const drawSneakerSole = shoes === 'shoes-sneaker-white' || shoes === 'shoes-sneaker-neon'
  const sneakerBodyH = 7

  return (
    <g aria-hidden>
      {!showKitShorts ? (
        <path
          d="M 31 108 L 69 108 L 68 118 L 32 118 Z"
          fill={pantsLegFill}
          stroke="rgba(15,23,42,0.12)"
          strokeWidth={0.35}
        />
      ) : null}

      {showKitShorts ? (
        <rect
          x={31}
          y={115}
          width={38}
          height={7}
          rx={2.5}
          fill={shortsFill}
          opacity={0.88}
          stroke="rgba(15,23,42,.15)"
          strokeWidth={0.4}
        />
      ) : null}

      <rect x={leftX} y={legY} width={legW} height={legH} rx={legRx} fill={legFill} stroke="rgba(15,23,42,0.14)" strokeWidth={0.35} />
      <rect x={rightX} y={legY} width={legW} height={legH} rx={legRx} fill={legFill} stroke="rgba(15,23,42,0.14)" strokeWidth={0.35} />

      {drawSneakerSole ? (
        <g>
          <rect
            x={leftX - 0.5}
            y={legY + legH - sneakerBodyH}
            width={legW + 1}
            height={sneakerBodyH}
            rx={2}
            fill={shoeTop}
            stroke="rgba(15,23,42,0.2)"
            strokeWidth={0.3}
          />
          <rect
            x={rightX - 0.5}
            y={legY + legH - sneakerBodyH}
            width={legW + 1}
            height={sneakerBodyH}
            rx={2}
            fill={shoeTop}
            stroke="rgba(15,23,42,0.2)"
            strokeWidth={0.3}
          />
          <rect x={leftX} y={legY + legH - 2} width={legW} height={2} rx={0.5} fill={shoeAccent} opacity={0.85} />
          <rect x={rightX} y={legY + legH - 2} width={legW} height={2} rx={0.5} fill={shoeAccent} opacity={0.85} />
          {shoes === 'shoes-sneaker-neon' ? (
            <>
              <rect x={leftX + 2} y={legY + legH - 5} width={3} height={2} rx={0.5} fill="#22d3ee" opacity={0.95} />
              <rect x={rightX + 2} y={legY + legH - 5} width={3} height={2} rx={0.5} fill="#22d3ee" opacity={0.95} />
            </>
          ) : null}
        </g>
      ) : (
        <g>
          <rect
            x={leftX + 1}
            y={legY + legH - 5}
            width={legW - 2}
            height={5}
            rx={1.2}
            fill={shoeTop}
            opacity={0.95}
          />
          <rect
            x={rightX + 1}
            y={legY + legH - 5}
            width={legW - 2}
            height={5}
            rx={1.2}
            fill={shoeTop}
            opacity={0.95}
          />
          {shoes === 'shoes-retro-gum' ? (
            <>
              <rect x={leftX} y={legY + legH - 1.5} width={legW} height={1.5} rx={0.4} fill="#b45309" opacity={0.9} />
              <rect x={rightX} y={legY + legH - 1.5} width={legW} height={1.5} rx={0.4} fill="#b45309" opacity={0.9} />
            </>
          ) : null}
        </g>
      )}
    </g>
  )
}

function BaseHeadwear({
  style,
  cx,
  headTop,
}: {
  style: AvatarCharacterLook['headwear']
  cx: number
  headTop: number
}) {
  if (style === 'none') return null
  if (style === 'beanie') {
    return (
      <path
        d={`M ${cx - 26} ${headTop + 8} Q ${cx} ${headTop - 14} ${cx + 26} ${headTop + 8} L ${cx + 24} ${headTop + 18} L ${cx - 24} ${headTop + 18} Z`}
        fill="#1e293b"
      />
    )
  }
  return (
    <g>
      <ellipse cx={cx} cy={headTop + 4} rx={28} ry={10} fill="#0f172a" />
      <path
        d={`M ${cx - 8} ${headTop + 8} L ${cx + 34} ${headTop + 14} L ${cx + 30} ${headTop + 18} Z`}
        fill="#1e293b"
      />
    </g>
  )
}

export function CharacterAvatarSvg({
  look,
  jerseyOverride,
  supporterColors,
  variant,
  flocage,
  suppressBaseHeadwear,
  className,
  pixelJersey,
  pantsItemId,
  shoesItemId,
}: {
  look: AvatarCharacterLook
  jerseyOverride: TorsoColors | null
  supporterColors: [string, string] | null
  variant: 'front' | 'back'
  flocage?: { name: string; number: string }
  suppressBaseHeadwear?: boolean
  className?: string
  pixelJersey?: { preset: PixelJerseyPresetId } | null
  pantsItemId?: string | null
  shoesItemId?: string | null
}) {
  const uid = useId().replace(/:/g, '')
  const torso = resolveTorso(look, jerseyOverride, supporterColors)
  const cx = AVATAR_HEAD.cx
  const faceY = AVATAR_HEAD.faceY
  const headTop = AVATAR_HEAD.headTop
  const hairGrad = hairRingGradientCoords()

  const { rx: eyeRx, ry: eyeRy } = resolveEyeDims(look.eyeShape)
  const expr: FaceExpression = look.faceExpression ?? 'happy'
  const eyeScale = EXPR[expr].eyeScale

  const shortsFill = torso.primary
  const pid = pantsItemId ?? 'pants-kit'
  const sid = shoesItemId ?? 'shoes-studs'

  return (
    <svg
      viewBox="0 0 100 140"
      className={cn('h-full w-full max-h-[140px] max-w-[100px]', className)}
      shapeRendering="geometricPrecision"
      aria-hidden
    >
      <defs>
        <linearGradient id={`neck-${uid}`} gradientUnits="userSpaceOnUse" x1="50" y1="60" x2="50" y2="77.5">
          <stop offset="0%" stopColor={mixHex(look.skinTone, '#0f172a', 0.14)} />
          <stop offset="38%" stopColor={look.skinTone} />
          <stop offset="100%" stopColor={mixHex(look.skinTone, '#57534e', 0.08)} />
        </linearGradient>
        <clipPath id={`hairArea-${uid}`} clipPathUnits="userSpaceOnUse">
          <path fillRule="evenodd" d={hairAreaClipPathD()} />
        </clipPath>
        <clipPath id={`beardArea-${uid}`} clipPathUnits="userSpaceOnUse">
          <path d={beardAreaClipPathD()} />
        </clipPath>
        <clipPath id={`hairBackArea-${uid}`} clipPathUnits="userSpaceOnUse">
          <path d={hairBackAreaClipPathD()} />
        </clipPath>
        <radialGradient id={`faceSkin-${uid}`} cx="40%" cy="28%" r="78%">
          <stop offset="0%" stopColor={mixHex(look.skinTone, '#ffffff', 0.11)} />
          <stop offset="32%" stopColor={look.skinTone} />
          <stop offset="72%" stopColor={mixHex(look.skinTone, '#78716c', 0.1)} />
          <stop offset="100%" stopColor={mixHex(look.skinTone, '#1c1917', 0.18)} />
        </radialGradient>
        <radialGradient id={`sclera-${uid}`} cx="35%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#e8edf3" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </radialGradient>
        <radialGradient id={`iris-${uid}`} cx="40%" cy="38%" r="68%">
          <stop offset="0%" stopColor={mixHex(look.eyeColor, '#f8fafc', 0.35)} />
          <stop offset="38%" stopColor={look.eyeColor} />
          <stop offset="72%" stopColor={mixHex(look.eyeColor, '#0f172a', 0.22)} />
          <stop offset="100%" stopColor={mixHex(look.eyeColor, '#020617', 0.55)} />
        </radialGradient>
        <radialGradient
          id={`hairVol-${uid}`}
          gradientUnits="userSpaceOnUse"
          cx={hairGrad.cx}
          cy={hairGrad.cy - hairGrad.outerRy * 0.55}
          r={hairGrad.outerRy * 1.15}
        >
          <stop offset="0%" stopColor={mixHex(look.hairColor, '#ffffff', 0.22)} />
          <stop offset="42%" stopColor={look.hairColor} />
          <stop offset="100%" stopColor={mixHex(look.hairColor, '#0a0806', 0.52)} />
        </radialGradient>
        <linearGradient id={`beardVol-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={mixHex(look.beardColor ?? look.hairColor, '#ffffff', 0.09)} />
          <stop offset="52%" stopColor={look.beardColor ?? look.hairColor} />
          <stop offset="100%" stopColor={mixHex(look.beardColor ?? look.hairColor, '#020617', 0.42)} />
        </linearGradient>
        {variant === 'back' ? (
          <radialGradient id={`hairBack-${uid}`} cx="38%" cy="28%" r="80%">
            <stop offset="0%" stopColor={mixHex(look.hairColor, '#ffffff', 0.16)} />
            <stop offset="45%" stopColor={look.hairColor} />
            <stop offset="100%" stopColor={mixHex(look.hairColor, '#0a0806', 0.5)} />
          </radialGradient>
        ) : null}
      </defs>

      <LowerBodyFeetLayer pantsItemId={pid} shoesItemId={sid} shortsFill={shortsFill} skin={look.skinTone} />

      {/* Bras sous le maillot : le torse + clip recouvrent la peau au centre, seuls les côtés restent visibles */}
      {variant === 'front' ? (
        <ShortSleeveArms skin={look.skinTone} x={AVATAR_KIT.x} y={AVATAR_KIT.y} w={AVATAR_KIT.w} />
      ) : null}

      <JerseyKit
        uid={uid}
        x={AVATAR_KIT.x}
        y={AVATAR_KIT.y}
        w={AVATAR_KIT.w}
        h={AVATAR_KIT.h}
        colors={torso}
        variant={variant}
        flocage={variant === 'back' ? flocage : undefined}
        pixelJersey={pixelJersey}
      />

      <path
        d={`M 43.4 62.2 Q 50 60.2 56.6 62.2 L 57.6 ${AVATAR_KIT.y + 1.2} Q 50 ${AVATAR_KIT.y + 2.6} 42.4 ${AVATAR_KIT.y + 1.2} Z`}
        fill={`url(#neck-${uid})`}
        stroke={mixHex(look.skinTone, '#1c1917', 0.1)}
        strokeWidth={0.26}
      />
      {/* Relief encolure : uniquement sous le cou (pas d’arc pleine largeur → évite la « barre » sur les épaules). */}
      <path
        d={`M ${cx - 10} ${AVATAR_KIT.y - 0.5} Q ${cx} ${AVATAR_KIT.y - 2} ${cx + 10} ${AVATAR_KIT.y - 0.5}`}
        fill="none"
        stroke={mixHex(look.skinTone, '#0f172a', 0.1)}
        strokeWidth={0.22}
        strokeLinecap="round"
        opacity={0.55}
      />

      {variant === 'front' && hairStyleUsesBackLayer(look.hairStyle) ? (
        <g clipPath={`url(#hairBackArea-${uid})`}>
          <HairBackPath
            style={look.hairStyle}
            fill={`url(#hairVol-${uid})`}
            edgeColor={mixHex(look.hairColor, '#0f172a', 0.28)}
          />
        </g>
      ) : null}

      {/* Tête : un peu plus large que haute, comme la sphère tête 3D (scale ~1.15×1.2). */}
      <ellipse
        cx={cx}
        cy={faceY}
        rx={AVATAR_HEAD.skullRx}
        ry={AVATAR_HEAD.skullRy}
        fill={`url(#faceSkin-${uid})`}
        stroke={mixHex(look.skinTone, '#1c1917', 0.14)}
        strokeWidth={0.38}
      />

      {variant === 'front' && (
        <>
          <CheekBlush cx={cx} faceY={faceY} expr={expr} />
          <NoseHint cx={cx} faceY={faceY} skinTone={look.skinTone} />
          <EyeGroup
            uid={uid}
            cx={cx - 8.5}
            cy={faceY - 2}
            rx={eyeRx}
            ry={eyeRy}
            skinTone={look.skinTone}
            scale={eyeScale}
            eyelashStyle={look.eyelashStyle ?? 'none'}
          />
          <EyeGroup
            uid={uid}
            cx={cx + 8.5}
            cy={faceY - 2}
            rx={eyeRx}
            ry={eyeRy}
            skinTone={look.skinTone}
            scale={eyeScale}
            eyelashStyle={look.eyelashStyle ?? 'none'}
          />
          <Eyebrows cx={cx} faceY={faceY} hairColor={look.hairColor} expr={expr} />
          <ExpressiveMouth cx={cx} faceY={faceY} expr={expr} />
          <Glasses style={look.glasses} cx={cx} cy={faceY - 2.2} />
          <g clipPath={`url(#beardArea-${uid})`}>
            <BeardPath
              beard={look.beard}
              fill={`url(#beardVol-${uid})`}
              strokeColor={look.beardColor ?? look.hairColor}
              cx={cx}
              cy={faceY}
            />
          </g>
          <g clipPath={`url(#hairArea-${uid})`}>
            <HairFrontPath
              style={look.hairStyle}
              fill={`url(#hairVol-${uid})`}
              edgeColor={mixHex(look.hairColor, '#0f172a', 0.28)}
            />
          </g>
          {!suppressBaseHeadwear && <BaseHeadwear style={look.headwear} cx={cx} headTop={headTop} />}
        </>
      )}

      {variant === 'back' && (
        <HairBackViewPath
          style={look.hairStyle}
          fill={`url(#hairBack-${uid})`}
          edgeColor={mixHex(look.hairColor, '#0f172a', 0.28)}
        />
      )}
    </svg>
  )
}
