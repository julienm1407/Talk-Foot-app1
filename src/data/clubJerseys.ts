import type { AvatarItem } from '../types/profile'
import { ALL_CLUBS_BY_ID } from './allClubsCatalog'
import { CDM_JERSEY_MEDALS } from './boutiqueMedalCosts'
import { teamColors } from './teams'
import {
  boutiqueClubJerseyUrl,
  CLUB_JERSEY_ASSET_IDS,
  clubJerseyUrl,
  type ClubJerseyAssetId,
} from './clubJerseyAssets'

function buildClubJersey(clubId: ClubJerseyAssetId): AvatarItem | null {
  const meta = ALL_CLUBS_BY_ID[clubId]
  if (!meta) return null
  const [primary, secondary] = teamColors[clubId] ?? ['#111827', '#f9fafb']
  return {
    id: `club-${clubId}`,
    name: `Maillot ${meta.shortName} (dom.)`,
    slot: 'jersey',
    emoji: '👕',
    cost: CDM_JERSEY_MEDALS,
    rarity: 'rare',
    description: `Maillot domicile ${meta.name} — ${meta.leagueName}.`,
    inspirationNote: `Inspiré ${meta.name} · domicile`,
    collection: 'clubs',
    clubId,
    jerseyVisual: {
      primary,
      secondary,
      pattern: 'kit_mesh',
      stripeLight: secondary,
      imageUrl: clubJerseyUrl(clubId),
      boutiqueImageUrl: boutiqueClubJerseyUrl(clubId),
    },
  }
}

export const clubJerseyItems: AvatarItem[] = CLUB_JERSEY_ASSET_IDS.map((id) => buildClubJersey(id)).filter(
  (item): item is AvatarItem => item != null,
)

export const clubJerseyByClubId: Record<string, AvatarItem> = clubJerseyItems.reduce(
  (acc, item) => {
    if (item.clubId) acc[item.clubId] = item
    return acc
  },
  {} as Record<string, AvatarItem>,
)
