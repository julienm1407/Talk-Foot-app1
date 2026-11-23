import { TIFO_BOARD_H, TIFO_BOARD_W } from '../constants/tifoPixelBoard'

export type TifoTemplateId = 'v' | 'bandes' | 'coeur'

function emptyMask(w: number, h: number): boolean[] {
  return new Array(w * h).fill(false)
}

function setCell(out: boolean[], w: number, h: number, x: number, y: number): void {
  if (x < 0 || y < 0 || x >= w || y >= h) return
  out[y * w + x] = true
}

/** Grand V de tribune, épais, pointe vers le bas. */
export function tifoChevronMask(w = TIFO_BOARD_W, h = TIFO_BOARD_H): boolean[] {
  const out = emptyMask(w, h)
  const cx = (w - 1) / 2
  const top = 2
  const bot = h - 3
  const thickness = 6
  for (let y = top; y <= bot; y++) {
    const t = (y - top) / Math.max(1, bot - top)
    const half = 4 + t * (w / 2 - 6)
    for (let d = 0; d < thickness; d++) {
      setCell(out, w, h, Math.round(cx - half) + d, y)
      setCell(out, w, h, Math.round(cx + half) - d, y)
    }
  }
  return out
}

/** Trois bandes horizontales. */
export function tifoStripesMask(w = TIFO_BOARD_W, h = TIFO_BOARD_H): boolean[] {
  const out = emptyMask(w, h)
  const rows = [Math.floor(h * 0.22), Math.floor(h * 0.5), Math.floor(h * 0.78)]
  for (const cy of rows) {
    for (let y = cy - 1; y <= cy + 1; y++) {
      for (let x = 2; x < w - 2; x++) setCell(out, w, h, x, y)
    }
  }
  return out
}

/** Cœur pixel. */
export function tifoHeartMask(w = TIFO_BOARD_W, h = TIFO_BOARD_H): boolean[] {
  const out = emptyMask(w, h)
  const cx = Math.floor(w / 2)
  const cy = Math.floor(h / 2) - 1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x - cx) / (w * 0.24)
      const ny = (cy - y) / (h * 0.3)
      const heart = nx * nx + (ny - Math.sqrt(Math.abs(nx))) ** 2
      if (heart < 1.05) setCell(out, w, h, x, y)
    }
  }
  return out
}

export const TIFO_TEMPLATES: { id: TifoTemplateId; label: string; hint: string; mask: () => boolean[] }[] = [
  { id: 'bandes', label: 'Bandes', hint: 'Trois lignes horizontales', mask: () => tifoStripesMask() },
  { id: 'v', label: 'Grand V', hint: 'V de tribune, pointe en bas', mask: () => tifoChevronMask() },
  { id: 'coeur', label: 'Cœur', hint: 'Cœur au centre de la grille', mask: () => tifoHeartMask() },
]

export function tifoMaskProgress(mask: boolean[], pixels: Record<string, string>): { filled: number; total: number } {
  let filled = 0
  let total = 0
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue
    total += 1
    const x = i % TIFO_BOARD_W
    const y = (i / TIFO_BOARD_W) | 0
    if (pixels[`${x},${y}`]) filled += 1
  }
  return { filled, total }
}
