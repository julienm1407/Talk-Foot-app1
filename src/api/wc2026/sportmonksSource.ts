/**
 * Source CDM 2026 — poules et classements via SportMonks (`standings/seasons/{id}`).
 * Repli sur le mock si pas de jeton ou si l’API ne renvoie pas de groupes.
 */

import { WC_DATASET } from '../../data/wc2026Mock'
import { getNationByIso } from '../../data/nations'
import { resolveSportMonksWc2026SeasonId } from '../../data/wc2026SportMonks'
import type { Nation } from '../../data/nations'
import type { WcDataset, WcMatch } from '../../types/wc2026'
import { getSportMonksToken } from '../../utils/apiTokens'
import {
  fetchSportMonksFixturesForSeason,
  fetchSportMonksStandingsBySeason,
  fetchSportMonksTeamSquad,
} from '../sportMonks/sportMonksApi'
import { extractWcGroupsAndStandingsFromSmEnvelope } from '../sportMonks/extractStandingsFromSm'
import {
  extractWcMatchesFromSmFixtures,
  mergeWcBracketWithMatches,
} from './extractWcMatchesFromSmFixtures'
import {
  extractNationSmTeamIdsFromStandingsEnvelope,
  wcSquadFromSportMonksEnvelope,
} from './squadFromSportMonks'
import { wc2026MockSource } from './mockSource'
import type { WcDataSource } from './types'
import type { WcSquad } from '../../types/wc2026'

const WC_FIXTURE_INCLUDE =
  'participants;scores.type;league;state;round;stage;venue;group;periods' as const

let cachedNationSmTeamIds: Record<string, number> | null = null
let cachedStandingsEnvelope: unknown = null

async function fetchWcStandingsEnvelope(token: string) {
  const seasonId = resolveSportMonksWc2026SeasonId()
  return fetchSportMonksStandingsBySeason(token, seasonId)
}

async function ensureNationSmTeamIds(token: string): Promise<Record<string, number>> {
  if (cachedNationSmTeamIds && Object.keys(cachedNationSmTeamIds).length > 0) {
    return cachedNationSmTeamIds
  }
  const envelope = cachedStandingsEnvelope ?? (await fetchWcStandingsEnvelope(token))
  cachedStandingsEnvelope = envelope
  cachedNationSmTeamIds = extractNationSmTeamIdsFromStandingsEnvelope(envelope)
  return cachedNationSmTeamIds
}

async function fetchWcGroupsFromSportMonks(): Promise<{
  groups: WcDataset['groups']
  standings: WcDataset['standings']
  nations: Nation[]
  updatedAt: string
} | null> {
  const token = getSportMonksToken()
  if (!token) return null

  const envelope = await fetchWcStandingsEnvelope(token)
  cachedStandingsEnvelope = envelope
  cachedNationSmTeamIds = extractNationSmTeamIdsFromStandingsEnvelope(envelope)
  const { groups, standings } = extractWcGroupsAndStandingsFromSmEnvelope(envelope)
  if (!groups.some((g) => g.teams.some((t) => t.iso !== 'TBD'))) return null

  const isos = new Set(
    groups.flatMap((g) => g.teams.map((t) => t.iso)).filter((iso) => iso !== 'TBD'),
  )
  const nations = [...isos]
    .map((iso) => getNationByIso(iso))
    .filter((n): n is Nation => n != null)

  return {
    groups,
    standings,
    nations: nations.length ? nations : WC_DATASET.nations,
    updatedAt: new Date().toISOString(),
  }
}

async function fetchWcMatchesFromSportMonks(): Promise<WcMatch[] | null> {
  const token = getSportMonksToken()
  if (!token) return null
  const seasonId = resolveSportMonksWc2026SeasonId()
  const fixtures = await fetchSportMonksFixturesForSeason(
    token,
    seasonId,
    WC_FIXTURE_INCLUDE,
  )
  if (!fixtures.length) return null
  const matches = extractWcMatchesFromSmFixtures(fixtures)
  return matches.length ? matches : null
}

function mergeLiveIntoBase(
  live: NonNullable<Awaited<ReturnType<typeof fetchWcGroupsFromSportMonks>>>,
  matches: WcMatch[] | null,
): WcDataset {
  const resolvedMatches = matches?.length ? matches : WC_DATASET.matches
  const bracket = matches?.length
    ? mergeWcBracketWithMatches(WC_DATASET.bracket, matches)
    : WC_DATASET.bracket
  return {
    ...WC_DATASET,
    groups: live.groups,
    standings: live.standings,
    nations: live.nations,
    matches: resolvedMatches,
    bracket,
    updatedAt: live.updatedAt,
  }
}

function mergeMatchesOnly(matches: WcMatch[]): WcDataset {
  return {
    ...WC_DATASET,
    matches,
    bracket: mergeWcBracketWithMatches(WC_DATASET.bracket, matches),
    updatedAt: new Date().toISOString(),
  }
}

/** SportMonks pour poules, classements et calendrier éliminatoires ; mock en repli. */
export const wc2026SportMonksSource: WcDataSource = {
  loadDataset: async () => {
    try {
      const token = getSportMonksToken()
      if (!token) return wc2026MockSource.loadDataset()

      const [live, matches] = await Promise.all([
        fetchWcGroupsFromSportMonks(),
        fetchWcMatchesFromSportMonks(),
      ])

      if (live && matches?.length) {
        return mergeLiveIntoBase(live, matches)
      }
      if (live) return mergeLiveIntoBase(live, null)
      if (matches?.length) return mergeMatchesOnly(matches)
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[TalkFoot] CDM SportMonks — repli mock:', err)
      }
    }
    return wc2026MockSource.loadDataset()
  },

  refreshLive: async () => {
    try {
      const [live, matches] = await Promise.all([
        fetchWcGroupsFromSportMonks(),
        fetchWcMatchesFromSportMonks(),
      ])
      if (live || matches?.length) {
        return {
          matches: matches?.length ? matches : WC_DATASET.matches,
          standings: live?.standings ?? WC_DATASET.standings,
          stats: WC_DATASET.stats,
        }
      }
    } catch {
      /* repli mock */
    }
    return wc2026MockSource.refreshLive!()
  },

  loadMatchDetails: wc2026MockSource.loadMatchDetails,

  loadSquad: async (nationIso): Promise<WcSquad> => {
    const empty: WcSquad = { nationIso, players: [] }
    const token = getSportMonksToken()
    if (!token) return wc2026MockSource.loadSquad!(nationIso)

    try {
      const teamIds = await ensureNationSmTeamIds(token)
      const smTeamId = teamIds[nationIso]
      if (smTeamId == null) return empty

      const seasonId = String(resolveSportMonksWc2026SeasonId())
      const envelope = await fetchSportMonksTeamSquad(token, smTeamId, seasonId)
      const squad = wcSquadFromSportMonksEnvelope(envelope, nationIso)
      return squad.players.length ? squad : empty
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn(`[TalkFoot] effectif ${nationIso} SportMonks:`, err)
      }
      return empty
    }
  },
}
