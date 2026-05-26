/**
 * Catalogue boutique CDM 2026 — un `AvatarItem` par sélection nationale.
 *
 * Les maillots sont rendus via `jerseyVisual.imageUrl` (PNG livré dans
 * `public/jerseys/nations/<iso>.png`). Les couleurs viennent du catalogue
 * `NATIONS` pour garantir la cohérence avec le drapeau / la fiche pays.
 *
 * Prix : 110 médailles (rareté `epic`) pour les sélections « top tier »,
 * 80 médailles (`rare`) pour les autres — barème simple, ajustable.
 */

import type { AvatarItem } from '../types/profile'
import { NATIONS, type Nation } from './nations'

const TOP_TIER = new Set<string>([
  'FRA',
  'ESP',
  'DEU',
  'ENG',
  'PRT',
  'BEL',
  'NLD',
  'BRA',
  'ARG',
  'URY',
  'HRV',
  'MAR',
  'JPN',
])

function priceFor(iso: string): { cost: number; rarity: AvatarItem['rarity'] } {
  if (TOP_TIER.has(iso)) return { cost: 110, rarity: 'epic' }
  return { cost: 80, rarity: 'rare' }
}

function buildJersey(nation: Nation): AvatarItem {
  const { cost, rarity } = priceFor(nation.iso)
  return {
    id: `cdm2026-${nation.iso.toLowerCase()}`,
    name: `Maillot ${nation.nameFr} · CDM 26`,
    slot: 'jersey',
    emoji: nation.flag,
    cost,
    rarity,
    description: `Sélection ${nation.nameFr} — édition Coupe du Monde 2026.`,
    inspirationNote: `Collection officielle Talk Foot · CDM 2026`,
    collection: 'cdm2026',
    nationIso: nation.iso,
    jerseyVisual: {
      primary: nation.primary,
      secondary: nation.secondary,
      pattern: 'kit_mesh',
      stripeLight: nation.accent,
      imageUrl: nation.jerseyUrl,
    },
  }
}

export const cdm2026JerseyItems: AvatarItem[] = NATIONS.map(buildJersey)

/** Index pratique : iso → item de boutique. */
export const cdm2026JerseyByNationIso: Record<string, AvatarItem> =
  cdm2026JerseyItems.reduce(
    (acc, item) => {
      if (item.nationIso) acc[item.nationIso] = item
      return acc
    },
    {} as Record<string, AvatarItem>,
  )
