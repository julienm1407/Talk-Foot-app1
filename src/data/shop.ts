import type { AvatarItem, MedalPack } from '../types/profile'
import { inspiredJerseyItems } from './inspiredJerseys'

/** Référence boutique : équivalent jetons pour un prix en médailles (hors promos). */
export const TOKENS_PER_MEDAL = 200

/** Écharpes, casquettes, maillots emoji, accessoires — sans la collection « inspirée » */
export const baseAvatarItems: AvatarItem[] = [
  { id: 'scarf-1', name: 'Écharpe bleue', slot: 'scarf', emoji: '🔵', cost: 16, rarity: 'common', description: 'Écharpe aux couleurs du club' },
  { id: 'scarf-2', name: 'Écharpe rouge', slot: 'scarf', emoji: '🔴', cost: 40, rarity: 'rare', description: 'Écharpe passion' },
  { id: 'scarf-3', name: 'Écharpe rayée', slot: 'scarf', emoji: '🌈', cost: 80, rarity: 'epic', description: 'Écharpe arc-en-ciel tribune' },
  { id: 'scarf-4', name: 'Écharpe dorée', slot: 'scarf', emoji: '⭐', cost: 150, rarity: 'legendary', description: 'Écharpe prestige' },
  { id: 'hat-1', name: 'Casquette club', slot: 'hat', emoji: '🧢', cost: 12, rarity: 'common', description: 'Casquette officielle' },
  { id: 'hat-2', name: 'Béret supporteur', slot: 'hat', emoji: '🎩', cost: 32, rarity: 'rare', description: 'Style stade' },
  { id: 'hat-3', name: 'Bonnet hiver', slot: 'hat', emoji: '🧶', cost: 60, rarity: 'epic', description: 'Matchs de décembre' },
  { id: 'hat-4', name: 'Couronne buteur', slot: 'hat', emoji: '👑', cost: 100, rarity: 'legendary', description: 'Prestige tribune' },
  {
    id: 'jersey-1',
    name: 'Maillot domicile',
    slot: 'jersey',
    emoji: '👕',
    cost: 32,
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
    rarity: 'rare',
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
    cost: 180,
    rarity: 'epic',
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
    cost: 320,
    rarity: 'legendary',
    description: 'Rayures verticales premium or & minuit.',
    jerseyVisual: {
      primary: '#0f172a',
      secondary: '#d4a574',
      pattern: 'vertical',
      stripeLight: '#fef3c7',
    },
  },
  { id: 'acc-1', name: 'Sifflet', slot: 'accessory', emoji: '📣', cost: 8, rarity: 'common', description: 'Mise en avant basique' },
  { id: 'acc-2', name: 'Drapeau', slot: 'accessory', emoji: '🚩', cost: 8, rarity: 'common', description: 'Petit drapeau de poche' },
  { id: 'acc-3', name: 'Mégaphone', slot: 'accessory', emoji: '📢', cost: 20, rarity: 'rare', description: 'Mettre un message en avant en live' },
  { id: 'acc-4', name: 'Fumigène virtuel', slot: 'accessory', emoji: '💨', cost: 40, rarity: 'epic', description: 'Effet tribune premium' },
]

/** Équipement classique + maillots inspirés (personnalisables à l’achat) */
export const avatarItems: AvatarItem[] = [...baseAvatarItems, ...inspiredJerseyItems]

/**
 * Packs de médailles — achat en euros (simulation CB).
 * Grille produit : montants € → médailles (pas de bonus séparé dans la grille actuelle).
 */
export const medalPacks: MedalPack[] = [
  {
    id: 'medal-pack-199',
    name: 'Pack Coup d’envoi',
    tagline: 'Première recharge',
    medals: 20,
    priceEur: '1,99 €',
    flavor: 'Pour tester la boutique ou un accessoire commun.',
  },
  {
    id: 'medal-pack-499',
    name: 'Pack Tribune',
    tagline: 'Bon rapport € / 🏅',
    medals: 55,
    priceEur: '4,99 €',
    flavor: 'Idéal pour une écharpe rare ou avancer vers un maillot.',
  },
  {
    id: 'medal-pack-999',
    name: 'Pack Capitaine',
    tagline: 'Le plus choisi',
    medals: 120,
    priceEur: '9,99 €',
    popular: true,
    flavor: 'Équilibre entre budget et progression (maillots, packs rares).',
  },
  {
    id: 'medal-pack-1999',
    name: 'Pack Virage',
    tagline: 'Réserve sérieuse',
    medals: 260,
    priceEur: '19,99 €',
    flavor: 'Pour viser épique / plusieurs pièces.',
  },
  {
    id: 'medal-pack-4999',
    name: 'Pack Ultras',
    tagline: 'Gros coffre',
    medals: 700,
    priceEur: '49,99 €',
    flavor: 'Collectionneurs et tenues complètes haut de gamme.',
  },
  {
    id: 'medal-pack-9999',
    name: 'Pack Légende',
    tagline: 'Maximum médailles',
    medals: 1600,
    priceEur: '99,99 €',
    flavor: 'Top débit : légendaires et personnalisation poussée.',
  },
]

const dailyOfferPool: AvatarItem[] = [
  ...avatarItems.filter((i) => i.slot === 'jersey' || i.slot === 'accessory'),
]

/** Rotation quotidienne déterministe (offre du jour). */
export function pickDailyOfferItem(): AvatarItem {
  const d = new Date()
  const seed = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()
  return dailyOfferPool[seed % dailyOfferPool.length]!
}

/** Prix promo affiché (−12 % environ) — le coût catalogue reste `item.cost`. */
export function dailyOfferDiscountedCost(item: AvatarItem): number {
  return Math.max(4, Math.round(item.cost * 0.88))
}

/**
 * Prix en jetons pour le même cosmétique (référence : 1 🏅 ≈ 200 jetons).
 */
export function cosmeticTokenPrice(medalCost: number): number {
  return Math.max(1, medalCost * TOKENS_PER_MEDAL)
}

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
