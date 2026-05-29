import type { AvatarItem } from '../types/profile'
import { viteBasePath } from '../seo/basePath'

/** Import Vite direct — indépendant du parsing `avatarAssetMap`. */
const SHOE_PNG_MODULES = import.meta.glob<string>('/assets/shoes/*.png', {
  eager: true,
  import: 'default',
})

const ITEM_FILE: Record<string, string> = {
  'shoes-sneaker-white': 'shoes_base.png',
  'shoes-sneaker-neon': 'shoes_bleu.png',
  'shoes-retro-gum': 'shoes_rouge.png',
  'shoes-sneaker-jaune': 'shoes_jaune.png',
  'shoes-sneaker-vert': 'shoes_vert.png',
}

function viteShoeSrc(fileName: string): string | undefined {
  const needle = `/shoes/${fileName}`.toLowerCase()
  for (const [path, src] of Object.entries(SHOE_PNG_MODULES)) {
    if (path.replace(/\\/g, '/').toLowerCase().endsWith(needle)) {
      return src
    }
  }
  return undefined
}

function publicShoeSrc(fileName: string): string {
  const base = viteBasePath()
  return base ? `${base}/shoes/${fileName}` : `/shoes/${fileName}`
}

/** URL affichable pour l’aperçu boutique chaussures. */
export function resolveBoutiqueShoeSrc(item: AvatarItem): string | null {
  const existing = item.shoesVisual?.imageUrl?.trim()
  if (existing && !existing.startsWith('/assets/shoes/')) {
    return existing
  }

  const file = ITEM_FILE[item.id]
  if (!file) return null

  return viteShoeSrc(file) ?? publicShoeSrc(file)
}

export function boutiqueShoeImageUrl(itemId: string): string {
  const file = ITEM_FILE[itemId]
  if (!file) return ''
  return viteShoeSrc(file) ?? publicShoeSrc(file)
}
