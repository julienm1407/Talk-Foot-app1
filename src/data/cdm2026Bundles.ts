/**
 * Packs boutique CDM 2026 — maillot + short par sélection.
 * Prix bundle : 80 🏅 (vs 60 + 25 à l’unité).
 */

import type { AvatarItem } from '../types/profile'
import { CDM_BUNDLE_MEDALS, CDM_JERSEY_MEDALS, CDM_SHORT_MEDALS } from './boutiqueEconomy'
import { NATIONS, boutiqueJerseyUrl, boutiqueShortsUrl, kitPackUrl, type Nation } from './nations'

function buildBundle(nation: Nation): AvatarItem {
  const slug = nation.iso.toLowerCase()
  const jerseyId = `cdm2026-${slug}`
  const shortId = `cdm2026-short-${slug}`
  const savings = CDM_JERSEY_MEDALS + CDM_SHORT_MEDALS - CDM_BUNDLE_MEDALS

  return {
    id: `cdm2026-pack-${slug}`,
    name: `Pack ${nation.nameFr} · maillot + short`,
    slot: 'jersey',
    emoji: nation.flag,
    cost: CDM_BUNDLE_MEDALS,
    rarity: 'epic',
    description: `Maillot et short ${nation.nameFr} — économise ${savings} médailles vs l’achat séparé.`,
    inspirationNote: 'Pack Coupe du Monde 2026',
    collection: 'cdm2026',
    nationIso: nation.iso,
    bundleIncludes: [jerseyId, shortId],
    packVisual: {
      imageUrl: kitPackUrl(nation.iso),
    },
    jerseyVisual: {
      primary: nation.primary,
      secondary: nation.secondary,
      pattern: 'kit_mesh',
      stripeLight: nation.accent,
      imageUrl: nation.jerseyUrl,
      boutiqueImageUrl: boutiqueJerseyUrl(nation.iso),
    },
    pantsVisual: {
      imageUrl: nation.shortsUrl,
      boutiqueImageUrl: boutiqueShortsUrl(nation.iso),
    },
  }
}

export const cdm2026BundleItems: AvatarItem[] = NATIONS.map(buildBundle)
