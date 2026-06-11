import type { SupporterChannel, SupporterGroup } from '../types/group'
import { NATIONS, type Nation } from './nations'

const nationChannels: SupporterChannel[] = [
  {
    id: 'general',
    name: 'Général',
    description: 'Débats, ambiance et vie de la tribune.',
    emoji: '💬',
  },
  {
    id: 'pronos',
    name: 'Pronos',
    description: 'Paris entre supporters, scores et parcours en poule.',
    emoji: '🎯',
  },
  {
    id: 'chants',
    name: 'Chants',
    description: 'Paroles, vidéos et ambiance stade.',
    emoji: '🎵',
  },
]

const CREATED_AT = '2026-05-01T12:00:00.000Z'

export function nationSupporterGroupId(iso: string): string {
  return `g-nation-${iso.toLowerCase()}`
}

function nationHashtags(nation: Nation): string[] {
  const slug = nation.iso.toLowerCase()
  const fr = nation.nameFr
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '')
  return ['cdm2026', 'cdm', 'mondial', slug, fr].filter(Boolean)
}

function scarfLabel(iso: string): string {
  const clean = iso.replace(/[^A-Za-z]/g, '').toUpperCase()
  return clean.slice(0, 6) || 'CDM26'
}

export function buildNationSupporterGroup(nation: Nation): SupporterGroup {
  const id = nationSupporterGroupId(nation.iso)
  return {
    id,
    name: `Tribune ${nation.nameFr}`,
    emoji: nation.flag,
    location: `CDM 2026 · ${nation.confederation}`,
    motto: `Tous les supporters des ${nation.nameFr} pendant le Mondial.`,
    theme: {
      primary: nation.primary,
      secondary: nation.secondary,
      background: 'stripe',
      accent: nation.accent,
      salonBoxBorder: nation.accent,
      quickEmotes: [nation.flag, '⚽', '🔥', '👏', '🎯', '🎵'],
    },
    scarf: {
      label: scarfLabel(nation.iso),
      colorA: nation.primary,
      colorB: nation.secondary,
      colorC: nation.accent,
    },
    members: 0,
    intensity: 36,
    channels: [...nationChannels],
    createdBy: 'system',
    createdAt: CREATED_AT,
    fanTags: {
      leagueIds: ['wc-2026'],
      clubIds: [],
      countryLabels: [nation.nameFr],
      nationIso: nation.iso,
    },
    onlineNow: 0,
    messagesToday: 0,
    groupKind: 'public',
    hashtags: nationHashtags(nation),
    lastMessagePreview: `Bienvenue sur la tribune ${nation.nameFr} — Coupe du Monde 2026`,
  }
}

export const nationSupporterGroups: SupporterGroup[] = NATIONS.map(buildNationSupporterGroup)

export const nationSupporterGroupByIso = new Map(
  NATIONS.map((n) => [n.iso.toUpperCase(), nationSupporterGroupId(n.iso)] as const),
)
