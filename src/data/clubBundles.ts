/**
 * Packs boutique clubs — maillot + short.
 * Prix bundle : 80 🏅 (vs 60 + 25 à l’unité).
 */

import type { AvatarItem } from '../types/profile'
import { ALL_CLUBS_BY_ID } from './allClubsCatalog'
import { CDM_BUNDLE_MEDALS, CDM_JERSEY_MEDALS, CDM_SHORT_MEDALS } from './boutiqueMedalCosts'
import { teamColors } from './teams'
import {
  boutiqueClubJerseyUrl,
  boutiqueClubShortsUrl,
  CLUB_JERSEY_ASSET_IDS,
  clubJerseyUrl,
  clubShortsUrl,
  type ClubJerseyAssetId,
} from './clubJerseyAssets'

function buildClubBundle(clubId: ClubJerseyAssetId): AvatarItem | null {
  const meta = ALL_CLUBS_BY_ID[clubId]
  if (!meta) return null
  const jerseyId = `club-${clubId}`
  const shortId = `club-short-${clubId}`
  const savings = CDM_JERSEY_MEDALS + CDM_SHORT_MEDALS - CDM_BUNDLE_MEDALS
  const [primary, secondary] = teamColors[clubId] ?? ['#111827', '#f9fafb']

  return {
    id: `club-pack-${clubId}`,
    name: `Pack ${meta.shortName} · maillot + short`,
    slot: 'jersey',
    emoji: '👕',
    cost: CDM_BUNDLE_MEDALS,
    rarity: 'epic',
    description: `Maillot et short ${meta.name} — économise ${savings} médailles vs l’achat séparé.`,
    inspirationNote: `Pack club · ${meta.leagueName}`,
    collection: 'clubs',
    clubId,
    bundleIncludes: [jerseyId, shortId],
    packVisual: {
      imageUrl: clubJerseyUrl(clubId),
    },
    jerseyVisual: {
      primary,
      secondary,
      pattern: 'kit_mesh',
      stripeLight: secondary,
      imageUrl: clubJerseyUrl(clubId),
      boutiqueImageUrl: boutiqueClubJerseyUrl(clubId),
    },
    pantsVisual: {
      imageUrl: clubShortsUrl(clubId),
      boutiqueImageUrl: boutiqueClubShortsUrl(clubId),
    },
  }
}

export const clubBundleItems: AvatarItem[] = CLUB_JERSEY_ASSET_IDS.map((id) => buildClubBundle(id)).filter(
  (item): item is AvatarItem => item != null,
)
