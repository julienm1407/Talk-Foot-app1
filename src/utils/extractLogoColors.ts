import type { SideColors } from './matchSideColors'

const SAMPLE = 48
const memoryCache = new Map<string, SideColors | null>()

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

function relativeLuma(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

function saturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b) / 255
  const min = Math.min(r, g, b) / 255
  if (max === 0) return 0
  return (max - min) / max
}

function mixToward(hex: string, toward: 'light' | 'dark', amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return toward === 'light' ? '#f8fafc' : '#0f172a'
  const n = parseInt(m[1]!, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const t = toward === 'light' ? 255 : 0
  return rgbToHex(r + (t - r) * amount, g + (t - g) * amount, b + (t - b) * amount)
}

type Bucket = { r: number; g: number; b: number; w: number; sat: number }

function quantizeKey(r: number, g: number, b: number): number {
  return ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
}

/**
 * Extrait 2 couleurs depuis un logo (même logique visuelle que les nations CDM).
 * Ignore transparence, blanc/noir/gris plats ; privilégie les teintes saturées.
 */
export function extractDominantColorsFromImageData(
  data: Uint8ClampedArray,
): SideColors | null {
  const buckets = new Map<number, Bucket>()

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]!
    if (a < 140) continue
    const r = data[i]!
    const g = data[i + 1]!
    const b = data[i + 2]!
    const luma = relativeLuma(r, g, b)
    if (luma > 0.92 || luma < 0.08) continue
    const sat = saturation(r, g, b)
    if (sat < 0.12 && luma > 0.18 && luma < 0.82) continue

    const key = quantizeKey(r, g, b)
    const prev = buckets.get(key)
    const weight = 1 + sat * 2.4
    if (prev) {
      prev.r += r * weight
      prev.g += g * weight
      prev.b += b * weight
      prev.w += weight
      prev.sat = Math.max(prev.sat, sat)
    } else {
      buckets.set(key, { r: r * weight, g: g * weight, b: b * weight, w: weight, sat })
    }
  }

  if (buckets.size === 0) return null

  const ranked = [...buckets.values()]
    .map((bucket) => {
      const r = bucket.r / bucket.w
      const g = bucket.g / bucket.w
      const b = bucket.b / bucket.w
      return {
        hex: rgbToHex(r, g, b),
        score: bucket.w * (0.55 + saturation(r, g, b)),
        sat: saturation(r, g, b),
        luma: relativeLuma(r, g, b),
      }
    })
    .sort((a, b) => b.score - a.score)

  const primary = ranked[0]
  if (!primary) return null

  let secondary =
    ranked.find((c) => {
      if (c.hex === primary.hex) return false
      const dist =
        Math.abs(parseInt(c.hex.slice(1, 3), 16) - parseInt(primary.hex.slice(1, 3), 16)) +
        Math.abs(parseInt(c.hex.slice(3, 5), 16) - parseInt(primary.hex.slice(3, 5), 16)) +
        Math.abs(parseInt(c.hex.slice(5, 7), 16) - parseInt(primary.hex.slice(5, 7), 16))
      return dist > 70
    }) ?? null

  if (!secondary) {
    secondary = {
      hex: primary.luma > 0.55 ? mixToward(primary.hex, 'dark', 0.45) : mixToward(primary.hex, 'light', 0.42),
      score: 0,
      sat: primary.sat,
      luma: primary.luma > 0.55 ? primary.luma * 0.55 : Math.min(0.9, primary.luma + 0.35),
    }
  }

  return { primary: primary.hex, secondary: secondary.hex }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`logo load failed: ${url}`))
    const isRemote = /^https?:\/\//i.test(url)
    if (isRemote) img.crossOrigin = 'anonymous'
    img.src = url
  })
}

/**
 * Lit les 2 couleurs dominantes d’un logo (cache mémoire).
 * Retourne `null` si CORS / image invalide / pas de couleur utilisable.
 */
export async function extractLogoSideColors(logoUrl: string): Promise<SideColors | null> {
  const key = logoUrl.trim()
  if (!key) return null
  if (memoryCache.has(key)) return memoryCache.get(key) ?? null

  try {
    const img = await loadImage(key)
    const canvas = document.createElement('canvas')
    canvas.width = SAMPLE
    canvas.height = SAMPLE
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      memoryCache.set(key, null)
      return null
    }
    ctx.clearRect(0, 0, SAMPLE, SAMPLE)
    ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE)
    let data: ImageData
    try {
      data = ctx.getImageData(0, 0, SAMPLE, SAMPLE)
    } catch {
      memoryCache.set(key, null)
      return null
    }
    const colors = extractDominantColorsFromImageData(data.data)
    memoryCache.set(key, colors)
    return colors
  } catch {
    memoryCache.set(key, null)
    return null
  }
}
