/**
 * Avatars illustrés simples via [DiceBear](https://www.dicebear.com/) (SVG, pas de paquet npm).
 * Défaut : « micah » (visage propre). Variantes optionnelles pour varier les silhouettes (ex. liste live).
 */
const STYLES_DEFAULT = 'micah' as const
const STYLES_ROTATE = ['micah', 'lorelei', 'notionists'] as const

/** Pastels discrets. */
const BG = 'e0e7ff,c7d2fe,fef9c3,d1fae5,fce7f3'

export function dicebearAvatarUrl(seed: string, size = 128, rotateStyleIndex?: number): string {
  const style =
    rotateStyleIndex == null
      ? STYLES_DEFAULT
      : STYLES_ROTATE[rotateStyleIndex % STYLES_ROTATE.length] ?? STYLES_DEFAULT
  const params = new URLSearchParams({
    seed: seed || 'talk-foot',
    size: String(size),
    backgroundColor: BG,
    radius: '50',
  })
  return `https://api.dicebear.com/9.x/${style}/svg?${params.toString()}`
}
