import { describe, expect, it } from 'vitest'
import { extractDominantColorsFromImageData } from './extractLogoColors'

function paintRect(
  data: Uint8ClampedArray,
  w: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number,
  g: number,
  b: number,
) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = 255
    }
  }
}

describe('extractDominantColorsFromImageData', () => {
  it('extrait bleu + rouge d’un faux logo bicolore', () => {
    const w = 16
    const h = 16
    const data = new Uint8ClampedArray(w * h * 4)
    paintRect(data, w, 0, 0, 8, 16, 30, 64, 175) // bleu
    paintRect(data, w, 8, 0, 16, 16, 200, 40, 40) // rouge
    const colors = extractDominantColorsFromImageData(data)
    expect(colors).not.toBeNull()
    expect(colors!.primary).toMatch(/^#[0-9a-f]{6}$/i)
    expect(colors!.secondary).toMatch(/^#[0-9a-f]{6}$/i)
    expect(colors!.primary.toLowerCase()).not.toBe(colors!.secondary.toLowerCase())
  })
})
