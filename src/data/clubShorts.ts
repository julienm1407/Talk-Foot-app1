/**
 * Catalogue boutique — shorts clubs (Big 5 + montées).
 */

import type { AvatarItem } from '../types/profile'
import { ALL_CLUBS_BY_ID } from './allClubsCatalog'
import { CDM_SHORT_MEDALS } from './boutiqueMedalCosts'
import {
  boutiqueClubShortsUrl,
  CLUB_SHORT_ASSET_IDS,
  clubShortsUrl,
  type ClubShortAssetId,
} from './clubJerseyAssets'

function buildClubShort(clubId: ClubShortAssetId): AvatarItem | null {
  const meta = ALL_CLUBS_BY_ID[clubId]
  if (!meta) return null
  return {
    id: `club-short-${clubId}`,
    name: `Short ${meta.shortName}`,
    slot: 'pants',
    emoji: '🩳',
    cost: CDM_SHORT_MEDALS,
    rarity: 'rare',
    description: `Short ${meta.name} — ${meta.leagueName}.`,
    inspirationNote: `Inspiré ${meta.name}`,
    collection: 'clubs',
    clubId,
    pantsVisual: {
      imageUrl: clubShortsUrl(clubId),
      boutiqueImageUrl: boutiqueClubShortsUrl(clubId),
    },
  }
}

export const clubShortItems: AvatarItem[] = CLUB_SHORT_ASSET_IDS.map((id) => buildClubShort(id)).filter(
  (item): item is AvatarItem => item != null,
)

export const clubShortByClubId: Record<string, AvatarItem> = clubShortItems.reduce(
  (acc, item) => {
    if (item.clubId) acc[item.clubId] = item
    return acc
  },
  {} as Record<string, AvatarItem>,
)
