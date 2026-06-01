/**
 * Chaussures vendues dans la boutique (visuel PNG seul).
 */

import type { AvatarItem } from '../types/profile'
import { boutiqueShoeImageUrl } from '../utils/boutiqueShoeAssets'
import { STANDARD_SHOES_MEDALS } from './boutiqueEconomy'

const SHOE_VARIANTS = [
  { id: 'shoes-sneaker-white', name: 'Crampons blancs', emoji: '👟', free: true },
  { id: 'shoes-sneaker-neon', name: 'Crampons bleus', emoji: '💠', free: false },
  { id: 'shoes-retro-gum', name: 'Crampons rouges', emoji: '🔴', free: false },
  { id: 'shoes-sneaker-jaune', name: 'Crampons jaunes', emoji: '🟡', free: false },
  { id: 'shoes-sneaker-vert', name: 'Crampons verts', emoji: '🟢', free: false },
] as const

export const boutiqueShoeItems: AvatarItem[] = SHOE_VARIANTS.map((v) => ({
  id: v.id,
  name: v.name,
  slot: 'shoes' as const,
  emoji: v.emoji,
  cost: v.free ? 0 : STANDARD_SHOES_MEDALS,
  rarity: 'common' as const,
  description: v.free
    ? 'Crampons blancs — offerts à tous les joueurs.'
    : 'Chaussures standards — collection stade.',
  collection: 'standard' as const,
  shoesVisual: {
    imageUrl: boutiqueShoeImageUrl(v.id),
  },
}))
