import type { JerseyPattern } from '../../../types/profile'
import { PIXEL_JERSEY_PRESETS, type PixelJerseyPresetId } from '../../../data/pixelJerseyPresets'
import { PixelJerseyPixelGroup } from '../../kit/PixelJerseySvg'
import { MASCOT } from '../mascotGeometry'

export type TorsoColors = {
  primary: string
  secondary: string
  pattern: JerseyPattern
  stripeLight?: string
}

const TORSO_W_REF = 0.44
const TORSO_H_REF = 0.36

function shirtPathD(x: number, y: number, w: number, h: number, pad = MASCOT.shoulderPad) {
  const cx = x + w / 2
  const neck = w * 0.19
  const neckY = y + 3.5
  const hemY = y + h - 0.5
  const hemHalf = (w * 0.36) / (2 * 0.44)
  return `M ${x - pad - 1} ${y + 11}
    Q ${x - pad * 0.55} ${y + 6.5}, ${x - pad * 0.3} ${y + 2.5}
    L ${cx - neck / 2} ${neckY}
    L ${cx + neck / 2} ${neckY}
    L ${x + w + pad * 0.3} ${y + 2.5}
    Q ${x + w + pad * 0.55} ${y + 6.5}, ${x + w + pad + 1} ${y + 11}
    L ${cx + hemHalf} ${hemY}
    L ${cx - hemHalf} ${hemY}
    Z`
}

function patternLayerInsideBbox(
  bbox: { x0: number; y0: number; x1: number; y1: number },
  colors: TorsoColors,
) {
  const { primary, secondary, pattern } = colors
  const light = colors.stripeLight ?? '#f8fafc'
  const bw = bbox.x1 - bbox.x0
  const bh = bbox.y1 - bbox.y0
  const x0 = bbox.x0
  const y0 = bbox.y0
  const fw = (u: number) => (u / TORSO_W_REF) * bw
  const fh = (u: number) => (u / TORSO_H_REF) * bh
  const yFromLocal = (yl: number) => y0 + ((yl + TORSO_H_REF / 2) / TORSO_H_REF) * bh
  const xFromLocal = (xl: number) => x0 + ((xl + TORSO_W_REF / 2) / TORSO_W_REF) * bw

  if (pattern === 'solid') return <rect x={x0} y={y0} width={bw} height={bh} fill={primary} />

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
          <rect key={`h${i}`} x={xBarKm} y={yFromLocal(yl) - hb / 2} width={fw(0.32)} height={hb} fill={secondary} opacity={0.88} />
        ))}
        {vXs.map((xl, i) => (
          <rect key={`v${i}`} x={xFromLocal(xl) - vb / 2} y={yFromLocal(0) - fh(vHeights[i]) / 2} width={vb} height={fh(vHeights[i])} fill={secondary} opacity={0.88} />
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
        <rect x={x0 + (bw - vw) / 2} y={y0 + (bh - vh) / 2} width={vw} height={vh} fill={secondary} />
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
          <rect key={i} x={xBar} y={yFromLocal(yl) - hb / 2} width={bwBar} height={hb} fill={secondary} />
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
        <rect x={cxm - rw / 2} y={cym - rh / 2} width={rw} height={rh} fill={secondary} opacity={0.93} transform={`rotate(${deg.toFixed(2)} ${cxm} ${cym})`} />
      </g>
    )
  }

  const hb = fh(0.03)
  const bwBar = fw(0.34)
  const xBar = x0 + (bw - bwBar) / 2
  const centers = [0.11, 0.04, -0.04, -0.11]
  return (
    <g>
      <rect x={x0} y={y0} width={bw} height={bh} fill={primary} />
      {centers.map((yl, i) => (
        <rect key={i} x={xBar} y={yFromLocal(yl) - hb / 2} width={bwBar} height={hb} fill={secondary} opacity={0.95} />
      ))}
    </g>
  )
}

type Props = {
  uid: string
  colors: TorsoColors
  variant: 'front' | 'back'
  flocage?: { name: string; number: string }
  pixelJersey?: { preset: PixelJerseyPresetId } | null
}

export function MascotJersey({ uid, colors, variant, flocage, pixelJersey }: Props) {
  const { x, y, w, h } = MASCOT.jersey
  const pathD = shirtPathD(x, y, w, h)
  const pad = MASCOT.shoulderPad
  const cxBox = x + w / 2
  const hemHalf = (w * 0.36) / (2 * 0.44)
  const bbox = {
    x0: Math.min(x - pad - 1, cxBox - hemHalf) - 0.3,
    y0: y + 2,
    x1: Math.max(x + w + pad + 1, cxBox + hemHalf) + 0.3,
    y1: y + h - 1,
  }
  const bw = bbox.x1 - bbox.x0
  const bh = bbox.y1 - bbox.y0
  const light = colors.stripeLight ?? '#f8fafc'
  const cx = x + w / 2
  const neck = w * 0.19
  const hasPixel = Boolean(pixelJersey?.preset)
  const presetDef = pixelJersey?.preset != null ? PIXEL_JERSEY_PRESETS[pixelJersey.preset] : null
  const pixelScale = 1.48
  const pxW = bw * pixelScale
  const pxH = bh * pixelScale
  const pxX = bbox.x0 - (pxW - bw) / 2
  const pxY = bbox.y0 - (pxH - bh) / 2 - 1.2

  return (
    <g aria-label="maillot">
      <defs>
        <clipPath id={`${uid}-shirt`}>
          <path d={pathD} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid}-shirt)`}>
        {hasPixel && pixelJersey?.preset && presetDef ? (
          <svg x={pxX} y={pxY} width={pxW} height={pxH} viewBox={`0 0 ${presetDef.cols} ${presetDef.rows.length}`} preserveAspectRatio="none" shapeRendering="crispEdges">
            <PixelJerseyPixelGroup preset={pixelJersey.preset} />
          </svg>
        ) : (
          patternLayerInsideBbox(bbox, colors)
        )}
      </g>
      <path d={pathD} fill="none" stroke="rgba(15,23,42,.14)" strokeWidth={0.35} strokeLinejoin="round" />
      <path d={`M ${cx - neck / 2} ${y + 3.5} Q ${cx} ${y + 1.8} ${cx + neck / 2} ${y + 3.5}`} fill="none" stroke="rgba(15,23,42,.32)" strokeWidth={0.55} strokeLinecap="round" />
      <g>
        <rect x={x - 3} y={y + 14} width={11} height={3.5} rx={0.6} fill={light} />
        <rect x={x - 3} y={y + 17} width={11} height={1.4} rx={0.3} fill={colors.secondary} opacity={0.95} />
        <rect x={x + w - 8} y={y + 14} width={11} height={3.5} rx={0.6} fill={light} />
        <rect x={x + w - 8} y={y + 17} width={11} height={1.4} rx={0.3} fill={colors.secondary} opacity={0.95} />
      </g>
      {variant === 'back' && flocage ? (
        <g clipPath={`url(#${uid}-shirt)`} pointerEvents="none">
          <text x={cx} y={y + h * 0.5} textAnchor="middle" fontSize={16} fontWeight={800} fill="rgba(15,23,42,.9)" fontFamily="system-ui,sans-serif">
            {flocage.number.slice(0, 2)}
          </text>
          <text x={cx} y={y + h * 0.68} textAnchor="middle" fontSize={6.2} fontWeight={700} fill="rgba(51,65,85,.92)" fontFamily="system-ui,sans-serif" letterSpacing={0.35}>
            {flocage.name.slice(0, 10)}
          </text>
        </g>
      ) : null}
    </g>
  )
}

/** Bras courts visibles sous les manches du maillot. */
export function MascotArms({ skin }: { skin: string }) {
  const { x, y, w } = MASCOT.jersey
  const stroke = { stroke: 'rgba(15,23,42,0.14)', strokeWidth: 0.28 as const, strokeLinejoin: 'round' as const }
  return (
    <g aria-hidden>
      <path
        d={`M ${x + 3} ${y + 8} C ${x - 2} ${y + 11}, ${x - 5} ${y + 18}, ${x - 6} ${y + 26} C ${x - 6.5} ${y + 32}, ${x - 4} ${y + 35}, ${x - 1} ${y + 33} C ${x + 1} ${y + 28}, ${x + 2} ${y + 16}, ${x + 3} ${y + 8} Z`}
        fill={skin}
        {...stroke}
      />
      <path
        d={`M ${x + w - 3} ${y + 8} C ${x + w + 2} ${y + 11}, ${x + w + 5} ${y + 18}, ${x + w + 6} ${y + 26} C ${x + w + 6.5} ${y + 32}, ${x + w + 4} ${y + 35}, ${x + w + 1} ${y + 33} C ${x + w - 1} ${y + 28}, ${x + w - 2} ${y + 16}, ${x + w - 3} ${y + 8} Z`}
        fill={skin}
        {...stroke}
      />
    </g>
  )
}

export { shirtPathD }
