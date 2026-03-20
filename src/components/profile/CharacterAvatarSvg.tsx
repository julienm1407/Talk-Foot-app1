import { useId, type ReactNode } from 'react'
import type { AvatarCharacterLook, JerseyPattern } from '../../types/profile'
import { cn } from '../../utils/cn'

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

/** Silhouette maillot Manches courtes + encolure (style pro, sans logo) */
function shirtPathD(x: number, y: number, w: number, h: number, pad = 6.5) {
  const cx = x + w / 2
  const neck = w * 0.2
  return `M ${x - pad} ${y + 15}
    L ${cx - neck / 2} ${y + 5}
    L ${cx + neck / 2} ${y + 5}
    L ${x + w + pad} ${y + 15}
    L ${x + w + pad * 0.4} ${y + h - 0.5}
    L ${x - pad * 0.4} ${y + h - 0.5}
    Z`
}

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

  if (pattern === 'solid') {
    return <rect x={x0} y={y0} width={bw} height={bh} fill={primary} />
  }

  if (pattern === 'kit_mesh') {
    const lines: ReactNode[] = []
    for (let i = 1; i < 10; i++) {
      const yy = y0 + (i / 10) * bh
      lines.push(
        <line
          key={`h${i}`}
          x1={x0}
          y1={yy}
          x2={x0 + bw}
          y2={yy}
          stroke="rgba(0,0,0,.07)"
          strokeWidth={0.35}
        />,
      )
    }
    for (let i = 1; i < 12; i++) {
      const xx = x0 + (i / 12) * bw
      lines.push(
        <line
          key={`v${i}`}
          x1={xx}
          y1={y0}
          x2={xx}
          y2={y0 + bh}
          stroke="rgba(0,0,0,.05)"
          strokeWidth={0.35}
        />,
      )
    }
    return (
      <g>
        <rect x={x0} y={y0} width={bw} height={bh} fill={primary} />
        {lines}
      </g>
    )
  }

  if (pattern === 'hechter') {
    return (
      <g>
        <rect x={x0} y={y0} width={bw * 0.36} height={bh} fill={primary} />
        <rect x={x0 + bw * 0.36} y={y0} width={bw * 0.045} height={bh} fill={light} />
        <rect x={x0 + bw * 0.405} y={y0} width={bw * 0.19} height={bh} fill={secondary} />
        <rect x={x0 + bw * 0.595} y={y0} width={bw * 0.045} height={bh} fill={light} />
        <rect x={x0 + bw * 0.64} y={y0} width={bw * 0.36} height={bh} fill={primary} />
      </g>
    )
  }

  if (pattern === 'vertical') {
    const n = 7
    return (
      <g>
        {Array.from({ length: n }).map((_, i) => (
          <rect
            key={i}
            x={x0 + (bw / n) * i}
            y={y0}
            width={bw / n + 0.3}
            height={bh}
            fill={i % 2 === 0 ? primary : secondary}
          />
        ))}
      </g>
    )
  }

  if (pattern === 'horizontal') {
    const n = 5
    return (
      <g>
        {Array.from({ length: n }).map((_, i) => (
          <rect
            key={i}
            x={x0}
            y={y0 + (bh / n) * i}
            width={bw}
            height={bh / n + 0.2}
            fill={i % 2 === 0 ? primary : secondary}
          />
        ))}
      </g>
    )
  }

  if (pattern === 'sash') {
    return (
      <g>
        <rect x={x0} y={y0} width={bw} height={bh} fill={primary} />
        <polygon
          points={`${x0},${y0 + bh} ${x0 + bw * 0.12},${y0} ${x0 + bw * 0.52},${y0} ${x0 + bw * 0.02},${y0 + bh}`}
          fill={secondary}
          opacity={0.94}
        />
      </g>
    )
  }

  /* hoops */
  return (
    <g>
      <rect x={x0} y={y0} width={bw} height={bh} fill={secondary} />
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={x0}
          y={y0 + (i * bh) / 4 + bh * 0.04}
          width={bw}
          height={bh / 5.5}
          fill={primary}
          opacity={0.92}
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
}: {
  uid: string
  x: number
  y: number
  w: number
  h: number
  colors: TorsoColors
  variant: 'front' | 'back'
  flocage?: { name: string; number: string }
}) {
  const pathD = shirtPathD(x, y, w, h)
  const pad = 6.5
  const bbox = {
    x0: x - pad * 0.35,
    y0: y + 6,
    x1: x + w + pad * 0.35,
    y1: y + h - 1,
  }
  const light = colors.stripeLight ?? '#f1f5f9'
  const cx = x + w / 2
  const neck = w * 0.2

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
        {patternLayerInsideBbox(bbox, colors)}
        <rect
          x={bbox.x0}
          y={bbox.y0}
          width={bbox.x1 - bbox.x0}
          height={bbox.y1 - bbox.y0}
          fill={`url(#${uid}-jer3d)`}
        />
      </g>

      <path d={pathD} fill="none" stroke="rgba(15,23,42,.22)" strokeWidth={0.55} />

      {/* Encolure côtelée */}
      <path
        d={`M ${cx - neck / 2} ${y + 5} Q ${cx} ${y + 3.2} ${cx + neck / 2} ${y + 5}`}
        fill="none"
        stroke="rgba(15,23,42,.35)"
        strokeWidth={0.65}
        strokeLinecap="round"
      />

      {/* Parements manches (blanc + liseré couleur secondaire) */}
      <g>
        <rect x={x - 3} y={y + 17} width={11} height={3.2} rx={0.6} fill={light} opacity={0.98} />
        <rect x={x - 3} y={y + 19.5} width={11} height={1.4} rx={0.3} fill={colors.secondary} opacity={0.95} />
        <rect x={x + w - 8} y={y + 17} width={11} height={3.2} rx={0.6} fill={light} opacity={0.98} />
        <rect x={x + w - 8} y={y + 19.5} width={11} height={1.4} rx={0.3} fill={colors.secondary} opacity={0.95} />
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

function HairPath({
  style,
  color,
  cx,
  cy,
}: {
  style: AvatarCharacterLook['hairStyle']
  color: string
  cx: number
  cy: number
}) {
  const common = { fill: color }
  switch (style) {
    case 'buzz':
      return <ellipse cx={cx} cy={cy - 18} rx={22} ry={10} {...common} />
    case 'short':
      return (
        <path
          d={`M ${cx - 24} ${cy - 8} Q ${cx} ${cy - 38} ${cx + 24} ${cy - 8} Q ${cx + 26} ${cy - 22} ${cx + 22} ${cy - 18} Q ${cx} ${cy - 28} ${cx - 22} ${cy - 18} Z`}
          {...common}
        />
      )
    case 'wavy':
      return (
        <path
          d={`M ${cx - 26} ${cy - 6} Q ${cx - 18} ${cy - 32} ${cx - 6} ${cy - 14} Q ${cx} ${cy - 36} ${cx + 6} ${cy - 14} Q ${cx + 18} ${cy - 32} ${cx + 26} ${cy - 6} L ${cx + 24} ${cy - 2} Q ${cx} ${cy - 12} ${cx - 24} ${cy - 2} Z`}
          {...common}
        />
      )
    case 'long':
      return (
        <path
          d={`M ${cx - 24} ${cy - 4} Q ${cx} ${cy - 40} ${cx + 24} ${cy - 4} L ${cx + 28} ${cy + 28} Q ${cx + 10} ${cy + 8} ${cx} ${cy + 18} Q ${cx - 10} ${cy + 8} ${cx - 28} ${cy + 28} Z`}
          {...common}
        />
      )
    case 'curly':
      return (
        <g {...common}>
          <circle cx={cx - 14} cy={cy - 22} r={9} />
          <circle cx={cx} cy={cy - 28} r={10} />
          <circle cx={cx + 14} cy={cy - 22} r={9} />
          <ellipse cx={cx} cy={cy - 8} rx={26} ry={12} />
        </g>
      )
    default:
      return null
  }
}

function BeardPath({
  beard,
  color,
  cx,
  cy,
}: {
  beard: AvatarCharacterLook['beard']
  color: string
  cx: number
  cy: number
}) {
  if (beard === 'none') return null
  const fill = color
  if (beard === 'light') {
    return (
      <path
        d={`M ${cx - 12} ${cy + 4} Q ${cx} ${cy + 14} ${cx + 12} ${cy + 4}`}
        fill="none"
        stroke={fill}
        strokeWidth={3}
        strokeLinecap="round"
      />
    )
  }
  if (beard === 'goatee') {
    return <ellipse cx={cx} cy={cy + 10} rx={8} ry={12} fill={fill} opacity={0.9} />
  }
  return (
    <path
      d={`M ${cx - 20} ${cy - 2} Q ${cx - 22} ${cy + 22} ${cx} ${cy + 26} Q ${cx + 22} ${cy + 22} ${cx + 20} ${cy - 2} Q ${cx} ${cy + 8} ${cx - 20} ${cy - 2}`}
      fill={fill}
      opacity={0.92}
    />
  )
}

function Glasses({ style, cx, cy }: { style: AvatarCharacterLook['glasses']; cx: number; cy: number }) {
  if (style === 'none') return null
  if (style === 'round') {
    return (
      <g fill="none" stroke="#1e293b" strokeWidth={1.4}>
        <circle cx={cx - 9} cy={cy} r={7} />
        <circle cx={cx + 9} cy={cy} r={7} />
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
}: {
  look: AvatarCharacterLook
  jerseyOverride: TorsoColors | null
  supporterColors: [string, string] | null
  variant: 'front' | 'back'
  flocage?: { name: string; number: string }
  suppressBaseHeadwear?: boolean
  className?: string
}) {
  const uid = useId().replace(/:/g, '')
  const torso = resolveTorso(look, jerseyOverride, supporterColors)
  const cx = 50
  const faceY = 48
  const headTop = 18

  const eyeRx = look.eyeShape === 'almond' ? 5 : 4.5
  const eyeRy = look.eyeShape === 'almond' ? 3.5 : 4.5

  const shortsFill = torso.primary

  return (
    <svg
      viewBox="0 0 100 140"
      className={cn('h-full w-full max-h-[140px] max-w-[100px]', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={`neck-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={look.skinTone} />
          <stop offset="100%" stopColor={look.skinTone} stopOpacity={0.85} />
        </linearGradient>
      </defs>

      <rect x={36} y={118} width={10} height={20} rx={3} fill="#1e293b" />
      <rect x={54} y={118} width={10} height={20} rx={3} fill="#1e293b" />

      <JerseyKit
        uid={uid}
        x={28}
        y={72}
        w={44}
        h={48}
        colors={torso}
        variant={variant}
        flocage={variant === 'back' ? flocage : undefined}
      />

      <rect
        x={38}
        y={115}
        width={24}
        height={7}
        rx={2.5}
        fill={shortsFill}
        opacity={0.88}
        stroke="rgba(15,23,42,.15)"
        strokeWidth={0.4}
      />

      <rect x={42} y={64} width={16} height={14} fill={`url(#neck-${uid})`} />

      <ellipse cx={cx} cy={faceY} rx={24} ry={26} fill={look.skinTone} stroke="rgba(0,0,0,.08)" strokeWidth={0.6} />

      {variant === 'front' && (
        <>
          <ellipse cx={cx - 9} cy={faceY - 2} rx={eyeRx} ry={eyeRy} fill="#fff" />
          <ellipse cx={cx + 9} cy={faceY - 2} rx={eyeRx} ry={eyeRy} fill="#fff" />
          <circle cx={cx - 9} cy={faceY - 2} r={2.2} fill={look.eyeColor} />
          <circle cx={cx + 9} cy={faceY - 2} r={2.2} fill={look.eyeColor} />
          <path
            d={`M ${cx - 6} ${faceY + 12} Q ${cx} ${faceY + 16} ${cx + 6} ${faceY + 12}`}
            fill="none"
            stroke="#9a3412"
            strokeWidth={1.2}
            strokeLinecap="round"
          />
          <Glasses style={look.glasses} cx={cx} cy={faceY - 2} />
        </>
      )}

      {variant === 'back' && (
        <ellipse cx={cx} cy={faceY - 4} rx={22} ry={24} fill={look.hairColor} opacity={0.95} />
      )}

      {variant === 'front' && (
        <>
          <BeardPath beard={look.beard} color={look.hairColor} cx={cx} cy={faceY} />
          <HairPath style={look.hairStyle} color={look.hairColor} cx={cx} cy={faceY} />
          {!suppressBaseHeadwear && <BaseHeadwear style={look.headwear} cx={cx} headTop={headTop} />}
        </>
      )}
    </svg>
  )
}
