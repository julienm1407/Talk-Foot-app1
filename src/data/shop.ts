import type { AvatarItem, MedalPack } from '../types/profile'
import { cdm2026BundleItems } from './cdm2026Bundles'
import { cdm2026JerseyItems } from './cdm2026Jerseys'
import { cdm2026ShortItems } from './cdm2026Shorts'
import { clubBundleItems } from './clubBundles'
import { clubJerseyItems } from './clubJerseys'
import { clubShortItems } from './clubShorts'
import { STANDARD_SHOES_MEDALS } from './boutiqueMedalCosts'
import { baseJerseyUrl, baseShortsUrl } from './nations'

export { TOKENS_PER_MEDAL, cosmeticTokenPrice, isCosmeticOwned } from './boutiqueEconomy'

const BASE_JERSEY_COLORS = [
  { id: 'blanc', name: 'blanc', primary: '#f8fafc', secondary: '#e2e8f0' },
  { id: 'bleu', name: 'bleu', primary: '#1d4ed8', secondary: '#1e3a8a' },
  { id: 'jaune', name: 'jaune', primary: '#facc15', secondary: '#ca8a04' },
  { id: 'rouge', name: 'rouge', primary: '#dc2626', secondary: '#991b1b' },
] as const

const baseJerseyItems: AvatarItem[] = BASE_JERSEY_COLORS.map((c) => ({
  id: `kit-base-${c.id}`,
  name: `Maillot ${c.name}`,
  slot: 'jersey',
  emoji: '👕',
  cost: 0,
  rarity: 'common',
  description: 'Maillot de départ — offert à tous les joueurs.',
  collection: 'standard',
  jerseyVisual: {
    primary: c.primary,
    secondary: c.secondary,
    pattern: 'solid',
    stripeLight: '#ffffff',
    imageUrl: baseJerseyUrl(c.id),
  },
}))

const baseShortItems: AvatarItem[] = BASE_JERSEY_COLORS.map((c) => ({
  id: `pants-base-${c.id}`,
  name: `Short ${c.name}`,
  slot: 'pants',
  emoji: '🩳',
  cost: 0,
  rarity: 'common',
  description: 'Short de départ — offert à tous les joueurs.',
  collection: 'standard',
  pantsVisual: {
    imageUrl: baseShortsUrl(c.id),
  },
}))

/** Écharpes, casquettes, maillots de base, accessoires */
export const baseAvatarItems: AvatarItem[] = [
  ...baseJerseyItems,
  ...baseShortItems,
  {
    id: 'kit-default',
    name: 'Maillot tribune (base blanc)',
    slot: 'jersey',
    emoji: '👕',
    cost: 0,
    rarity: 'common',
    description: 'Tenue d’origine — toujours disponible.',
    collection: 'standard',
    jerseyVisual: {
      primary: '#f8fafc',
      secondary: '#e2e8f0',
      pattern: 'solid',
      stripeLight: '#ffffff',
      imageUrl: baseJerseyUrl('blanc'),
    },
  },
  {
    id: 'accessory-default',
    name: 'Sans accessoire',
    slot: 'accessory',
    emoji: '·',
    cost: 0,
    rarity: 'common',
    description: 'Look épuré.',
  },
  {
    id: 'pants-kit',
    name: 'Short assorti au maillot',
    slot: 'pants',
    emoji: '🩳',
    cost: 0,
    rarity: 'common',
    description: 'Short qui reprend les couleurs du haut.',
  },
  {
    id: 'shoes-studs',
    name: 'Crampons classiques',
    slot: 'shoes',
    emoji: '⚽',
    cost: 0,
    rarity: 'common',
    description: 'Chaussures stade sombres.',
  },
  {
    id: 'pants-jeans',
    name: 'Jean brut',
    slot: 'pants',
    emoji: '👖',
    cost: 28,
    rarity: 'common',
    description: 'Denim tribune.',
  },
  {
    id: 'pants-jogger',
    name: 'Jogging technique',
    slot: 'pants',
    emoji: '🏃',
    cost: 36,
    rarity: 'rare',
    description: 'Textile mat, coupe slim.',
  },
  {
    id: 'pants-chino',
    name: 'Chino sable',
    slot: 'pants',
    emoji: '🧥',
    cost: 32,
    rarity: 'common',
    description: 'Tenue casual avant-match.',
  },
  {
    id: 'pants-cargo',
    name: 'Cargo kaki',
    slot: 'pants',
    emoji: '🎒',
    cost: 44,
    rarity: 'rare',
    description: 'Poches utilitaires.',
  },
  {
    id: 'shoes-sneaker-neon',
    name: 'Crampons standards bleus',
    slot: 'shoes',
    emoji: '💠',
    cost: STANDARD_SHOES_MEDALS,
    rarity: 'common',
    description: 'Chaussures stade — collection standards.',
  },
  {
    id: 'shoes-retro-gum',
    name: 'Crampons standards rouges',
    slot: 'shoes',
    emoji: '🔴',
    cost: STANDARD_SHOES_MEDALS,
    rarity: 'common',
    description: 'Chaussures stade — collection standards.',
  },
  {
    id: 'shoes-sneaker-jaune',
    name: 'Crampons standards jaunes',
    slot: 'shoes',
    emoji: '🟡',
    cost: STANDARD_SHOES_MEDALS,
    rarity: 'common',
    description: 'Chaussures stade — collection standards.',
  },
  {
    id: 'shoes-sneaker-vert',
    name: 'Crampons standards verts',
    slot: 'shoes',
    emoji: '🟢',
    cost: STANDARD_SHOES_MEDALS,
    rarity: 'common',
    description: 'Chaussures stade — collection standards.',
  },
  { id: 'scarf-1', name: 'Écharpe bleue', slot: 'scarf', emoji: '🔵', cost: 16, rarity: 'common', description: 'Écharpe aux couleurs du club' },
  { id: 'scarf-2', name: 'Écharpe rouge', slot: 'scarf', emoji: '🔴', cost: 40, rarity: 'rare', description: 'Écharpe passion' },
  { id: 'scarf-3', name: 'Écharpe rayée', slot: 'scarf', emoji: '🌈', cost: 80, rarity: 'epic', description: 'Écharpe arc-en-ciel tribune' },
  { id: 'scarf-4', name: 'Écharpe dorée', slot: 'scarf', emoji: '⭐', cost: 150, rarity: 'legendary', description: 'Écharpe prestige' },
  { id: 'hat-1', name: 'Casquette club', slot: 'hat', emoji: '🧢', cost: 12, rarity: 'common', description: 'Casquette officielle' },
  { id: 'hat-2', name: 'Béret supporteur', slot: 'hat', emoji: '🎩', cost: 32, rarity: 'rare', description: 'Style stade' },
  { id: 'hat-3', name: 'Bonnet hiver', slot: 'hat', emoji: '🧶', cost: 60, rarity: 'epic', description: 'Matchs de décembre' },
  { id: 'hat-4', name: 'Couronne buteur', slot: 'hat', emoji: '👑', cost: 100, rarity: 'legendary', description: 'Prestige tribune' },
  { id: 'acc-1', name: 'Sifflet', slot: 'accessory', emoji: '📣', cost: 8, rarity: 'common', description: 'Mise en avant basique' },
  { id: 'acc-2', name: 'Drapeau', slot: 'accessory', emoji: '🚩', cost: 8, rarity: 'common', description: 'Petit drapeau de poche' },
  { id: 'acc-3', name: 'Mégaphone', slot: 'accessory', emoji: '📢', cost: 20, rarity: 'rare', description: 'Mettre un message en avant en live' },
  { id: 'acc-4', name: 'Fumigène virtuel', slot: 'accessory', emoji: '💨', cost: 40, rarity: 'epic', description: 'Effet tribune premium' },
]

/** Équipement classique + collection officielle CDM 2026 (PNG). */
export const avatarItems: AvatarItem[] = [
  ...baseAvatarItems,
  ...clubJerseyItems,
  ...clubShortItems,
  ...clubBundleItems,
  ...cdm2026JerseyItems,
  ...cdm2026ShortItems,
  ...cdm2026BundleItems,
]

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
    medals: 60,
    priceEur: '4,99 €',
    flavor: 'Idéal pour un short CDM ou avancer vers un maillot.',
  },
  {
    id: 'medal-pack-999',
    name: 'Pack Capitaine',
    tagline: 'Le plus choisi',
    medals: 130,
    priceEur: '9,99 €',
    popular: true,
    flavor: 'Équilibre entre budget et progression (maillots, packs rares).',
  },
  {
    id: 'medal-pack-1999',
    name: 'Pack Virage',
    tagline: 'Réserve sérieuse',
    medals: 280,
    priceEur: '19,99 €',
    flavor: 'Un maillot CDM + budget accessoires.',
  },
  {
    id: 'medal-pack-4999',
    name: 'Pack Ultras',
    tagline: 'Gros coffre',
    medals: 750,
    priceEur: '49,99 €',
    flavor: 'Plusieurs maillots ou packs tenue complète.',
  },
  {
    id: 'medal-pack-9999',
    name: 'Pack Légende',
    tagline: 'Maximum médailles',
    medals: 1700,
    priceEur: '99,99 €',
    flavor: 'Top débit : légendaires et personnalisation poussée.',
  },
]

const dailyOfferPool: AvatarItem[] = [
  ...avatarItems.filter(
    (i) => (i.slot === 'jersey' || i.slot === 'accessory') && i.cost > 0,
  ),
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
