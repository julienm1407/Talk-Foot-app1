/**
 * Catalogue boutique CDM 2026 — un `AvatarItem` par sélection nationale.
 */

import type { AvatarItem } from '../types/profile'
import { CDM_JERSEY_MEDALS } from './boutiqueEconomy'
import { NATIONS, boutiqueJerseyUrl, type Nation } from './nations'

function buildJersey(nation: Nation): AvatarItem {
  return {
    id: `cdm2026-${nation.iso.toLowerCase()}`,
    name: `Maillot ${nation.nameFr}`,
    slot: 'jersey',
    emoji: nation.flag,
    cost: CDM_JERSEY_MEDALS,
    rarity: 'epic',
    description: `Maillot ${nation.nameFr} — Coupe du Monde 2026.`,
    inspirationNote: 'Collection officielle Talk Foot · CDM 2026',
    collection: 'cdm2026',
    nationIso: nation.iso,
    jerseyVisual: {
      primary: nation.primary,
      secondary: nation.secondary,
      pattern: 'kit_mesh',
      stripeLight: nation.accent,
      imageUrl: nation.jerseyUrl,
      boutiqueImageUrl: boutiqueJerseyUrl(nation.iso),
    },
  }
}

export const cdm2026JerseyItems: AvatarItem[] = NATIONS.map(buildJersey)

export const cdm2026JerseyByNationIso: Record<string, AvatarItem> = cdm2026JerseyItems.reduce(
  (acc, item) => {
    if (item.nationIso) acc[item.nationIso] = item
    return acc
  },
  {} as Record<string, AvatarItem>,
)
