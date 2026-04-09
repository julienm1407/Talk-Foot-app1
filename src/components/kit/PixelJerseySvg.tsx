import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'
import {
  PIXEL_JERSEY_PRESETS,
  PIXEL_PALETTE,
  type PixelJerseyPresetId,
} from '../../data/pixelJerseyPresets'

function renderPixelCells(preset: PixelJerseyPresetId) {
  const def = PIXEL_JERSEY_PRESETS[preset]
  const h = def.rows.length
  const els: ReactNode[] = []
  let k = 0
  for (let ri = 0; ri < h; ri++) {
    const row = def.rows[ri] ?? ''
    for (let ci = 0; ci < def.cols; ci++) {
      const ch = row[ci] ?? '.'
      const fill = PIXEL_PALETTE[ch]
      if (!fill || fill === 'transparent') continue
      els.push(<rect key={k++} x={ci} y={ri} width={1} height={1} fill={fill} />)
    }
  }
  return els
}

/** Grille pixel seule (pour inclusion dans un autre `<svg>`). */
export function PixelJerseyPixelGroup({ preset }: { preset: PixelJerseyPresetId }) {
  return <g shapeRendering="crispEdges">{renderPixelCells(preset)}</g>
}

export function PixelJerseySvg({
  preset,
  className,
  title,
}: {
  preset: PixelJerseyPresetId
  className?: string
  title?: string
}) {
  const def = PIXEL_JERSEY_PRESETS[preset]
  const w = def.cols
  const h = def.rows.length
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn('h-auto w-full max-w-full', className)}
      shapeRendering="crispEdges"
      role="img"
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {renderPixelCells(preset)}
    </svg>
  )
}
