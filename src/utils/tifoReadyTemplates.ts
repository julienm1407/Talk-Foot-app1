import { TIFO_BOARD_H, TIFO_BOARD_W } from '../constants/tifoPixelBoard'

/** Masque « chevron » (sans logo club). */
export function tifoChevronMask(w = TIFO_BOARD_W, h = TIFO_BOARD_H): boolean[] {
  const out = new Array(w * h).fill(false)
  const midY = Math.floor(h / 2)
  for (let y = 2; y < h - 2; y++) {
    const spread = Math.abs(y - midY)
    const left = Math.floor(w / 2) - 2 - spread
    const right = Math.floor(w / 2) + 1 + spread
    for (let x = Math.max(2, left); x <= Math.min(w - 3, right); x++) {
      if (x === left || x === left + 1 || x === right || x === right - 1) out[y * w + x] = true
    }
  }
  return out
}

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
