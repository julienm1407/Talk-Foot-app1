export function parseHex(h: string): { r: number; g: number; b: number } | null {
  const s = h.replace('#', '').trim()
  if (s.length !== 6) return null
  const n = parseInt(s, 16)
  if (Number.isNaN(n)) return null
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function mixHex(a: string, colorB: string, t: number): string {
  const A = parseHex(a)
  const B = parseHex(colorB)
  if (!A || !B) return a
  const r = Math.round(A.r + (B.r - A.r) * t)
  const gCh = Math.round(A.g + (B.g - A.g) * t)
  const bCh = Math.round(A.b + (B.b - A.b) * t)
  return `#${[r, gCh, bCh].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

export function strokeSubtle(color: string): string {
  return mixHex(color, '#0f172a', 0.22)
}
