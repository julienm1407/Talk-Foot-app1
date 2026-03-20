import type { AvatarItem, TokenPack } from '../types/profile'
import { inspiredJerseyItems } from './inspiredJerseys'

/** Écharpes, casquettes, maillots emoji — sans la collection « inspirée » */
export const baseAvatarItems: AvatarItem[] = [
  { id: 'scarf-1', name: 'Écharpe bleue', slot: 'scarf', emoji: '🔵', cost: 50, rarity: 'common', description: 'Écharpe aux couleurs du club' },
  { id: 'scarf-2', name: 'Écharpe rouge', slot: 'scarf', emoji: '🔴', cost: 50, rarity: 'common', description: 'Écharpe passion' },
  { id: 'scarf-3', name: 'Écharpe rayée', slot: 'scarf', emoji: '🌈', cost: 120, rarity: 'rare', description: 'Écharpe arc-en-ciel légendaire' },
  { id: 'scarf-4', name: 'Écharpe dorée', slot: 'scarf', emoji: '⭐', cost: 300, rarity: 'epic', description: 'Écharpe champion' },
  { id: 'hat-1', name: 'Casquette club', slot: 'hat', emoji: '🧢', cost: 80, rarity: 'common', description: 'Casquette officielle' },
  { id: 'hat-2', name: 'Béret supporteur', slot: 'hat', emoji: '🎩', cost: 100, rarity: 'common', description: 'Style stade' },
  { id: 'hat-3', name: 'Bonnet hiver', slot: 'hat', emoji: '🧶', cost: 150, rarity: 'rare', description: 'Bonnet pour les matchs soirs de décembre' },
  { id: 'hat-4', name: 'Couronne buteur', slot: 'hat', emoji: '👑', cost: 400, rarity: 'legendary', description: 'Pour les vrais rois du stade' },
  {
    id: 'jersey-1',
    name: 'Maillot domicile',
    slot: 'jersey',
    emoji: '👕',
    cost: 100,
    rarity: 'common',
    description: 'Marine, bande centrale & parements — rendu type maillot pro.',
    jerseyVisual: {
      primary: '#0f2744',
      secondary: '#c8102e',
      pattern: 'hechter',
      stripeLight: '#f8fafc',
    },
  },
  {
    id: 'jersey-2',
    name: 'Maillot extérieur',
    slot: 'jersey',
    emoji: '💪',
    cost: 100,
    rarity: 'common',
    description: 'Blanc cassé & bandes horizontales.',
    jerseyVisual: {
      primary: '#f8fafc',
      secondary: '#0ea5e9',
      pattern: 'horizontal',
      stripeLight: '#e2e8f0',
    },
  },
  {
    id: 'jersey-3',
    name: 'Maillot third',
    slot: 'jersey',
    emoji: '🦁',
    cost: 200,
    rarity: 'rare',
    description: 'Noir mesh technique, accents néon.',
    jerseyVisual: {
      primary: '#0f172a',
      secondary: '#22d3ee',
      pattern: 'kit_mesh',
      stripeLight: '#e2e8f0',
    },
  },
  {
    id: 'jersey-4',
    name: 'Maillot collector',
    slot: 'jersey',
    emoji: '🏆',
    cost: 500,
    rarity: 'legendary',
    description: 'Rayures verticales premium or & minuit.',
    jerseyVisual: {
      primary: '#0f172a',
      secondary: '#d4a574',
      pattern: 'vertical',
      stripeLight: '#fef3c7',
    },
  },
  { id: 'acc-1', name: 'Sifflet', slot: 'accessory', emoji: '📣', cost: 30, rarity: 'common', description: 'Pour encourager l\'équipe' },
  { id: 'acc-2', name: 'Drapeau', slot: 'accessory', emoji: '🚩', cost: 60, rarity: 'common', description: 'Petit drapeau de poche' },
  { id: 'acc-3', name: 'Megaphone', slot: 'accessory', emoji: '📢', cost: 180, rarity: 'rare', description: 'Se faire entendre dans le stade' },
  { id: 'acc-4', name: 'Fumigène virtuel', slot: 'accessory', emoji: '💨', cost: 350, rarity: 'epic', description: 'Ambiance ultime' },
]

/** Équipement classique + maillots inspirés (personnalisables à l’achat) */
export const avatarItems: AvatarItem[] = [...baseAvatarItems, ...inspiredJerseyItems]

export const tokenPacks: TokenPack[] = [
  { id: 'pack-starter', name: 'Starter', tokens: 100, priceDisplay: 'Gratuit', description: 'Pour commencer', bonus: 10, free: true },
  { id: 'pack-50', name: 'Petit boost', tokens: 50, priceDisplay: 'Quotidien', description: 'Récompense de connexion quotidienne', free: true },
  { id: 'pack-150', name: 'Supporteur', tokens: 150, priceDisplay: 'Offre', bonus: 25, description: '+25 jetons bonus', popular: true },
  { id: 'pack-500', name: 'Ultra fan', tokens: 500, priceDisplay: 'Meilleure valeur', bonus: 100, description: '+100 jetons bonus' },
  { id: 'pack-1000', name: 'Légende', tokens: 1000, priceDisplay: 'Prestige', bonus: 250, description: '+250 jetons bonus • Badge exclusif' },
]

export const xpPerLevel = (level: number): number => {
  if (level <= 1) return 0
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

export const levelFromXp = (xp: number): number => {
  let level = 1
  let total = 0
  while (total + xpPerLevel(level + 1) <= xp) {
    total += xpPerLevel(level + 1)
    level += 1
  }
  return level
}

export const levelTiers: Record<number, { tier: import('../types/profile').LevelTier; label: string }> = {
  1: { tier: 'bronze', label: 'Rookie' },
  5: { tier: 'bronze', label: 'Supporter' },
  10: { tier: 'silver', label: 'Fan' },
  15: { tier: 'silver', label: 'Ultra' },
  20: { tier: 'gold', label: 'Légende' },
  30: { tier: 'platinum', label: 'Champion' },
  40: { tier: 'diamond', label: 'Légende Talk Foot' },
}

export function getLevelTier(level: number): { tier: import('../types/profile').LevelTier; label: string } {
  const thresholds = Object.keys(levelTiers).map(Number).sort((a, b) => b - a)
  for (const t of thresholds) {
    if (level >= t) return levelTiers[t]
  }
  return { tier: 'bronze', label: 'Rookie' }
}
