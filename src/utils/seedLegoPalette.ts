import { PRESET_HAIR, PRESET_SKIN } from '../data/characterPresets'
import type { User } from '../types/chat'

const ACCENT_JERSEY: Record<User['accent'], { primary: string; secondary: string }> = {
  violet: { primary: '#4c1d95', secondary: '#c4b5fd' },
  emerald: { primary: '#065f46', secondary: '#6ee7b7' },
  rose: { primary: '#9f1239', secondary: '#fda4af' },
  amber: { primary: '#b45309', secondary: '#fde68a' },
}

function hashInt(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Couleurs déterministes pour un supporter sans `characterLook` complet (chat). */
export function seedToLegoPalette(seed: string, accent: User['accent']) {
  const h = hashInt(seed.trim() || 'fan')
  const jersey = ACCENT_JERSEY[accent] ?? ACCENT_JERSEY.violet
  return {
    skinTone: PRESET_SKIN[h % PRESET_SKIN.length],
    hairColor: PRESET_HAIR[(h >> 4) % PRESET_HAIR.length],
    outfitPrimary: jersey.primary,
    outfitSecondary: jersey.secondary,
  }
}
