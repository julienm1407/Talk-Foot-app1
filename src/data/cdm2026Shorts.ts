/**
 * Catalogue boutique CDM 2026 — shorts par sélection nationale.
 */

import type { AvatarItem } from '../types/profile'
import { CDM_SHORT_MEDALS } from './boutiqueMedalCosts'
import { NATIONS, boutiqueShortsUrl, type Nation } from './nations'

function buildShorts(nation: Nation): AvatarItem {
  return {
    id: `cdm2026-short-${nation.iso.toLowerCase()}`,
    name: `Short ${nation.nameFr}`,
    slot: 'pants',
    emoji: nation.flag,
    cost: CDM_SHORT_MEDALS,
    rarity: 'rare',
    description: `Short ${nation.nameFr}.`,
    inspirationNote: 'Collection sélections Talk Foot',
    collection: 'cdm2026',
    nationIso: nation.iso,
    pantsVisual: {
      imageUrl: nation.shortsUrl,
      boutiqueImageUrl: boutiqueShortsUrl(nation.iso),
    },
  }
}

export const cdm2026ShortItems: AvatarItem[] = NATIONS.map(buildShorts)

export const cdm2026ShortByNationIso: Record<string, AvatarItem> = cdm2026ShortItems.reduce(
  (acc, item) => {
    if (item.nationIso) acc[item.nationIso] = item
    return acc
  },
  {} as Record<string, AvatarItem>,
)
