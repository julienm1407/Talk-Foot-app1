/**
 * Source CDM 2026 — poules et classements via SportMonks (`standings/seasons/{id}`).
 * Repli sur le mock si pas de jeton ou si l’API ne renvoie pas de groupes.
 */

import { WC_DATASET } from '../../data/wc2026Mock'
import { getNationByIso } from '../../data/nations'
import { resolveSportMonksWc2026SeasonId } from '../../data/wc2026SportMonks'
import type { Nation } from '../../data/nations'
import type { WcDataset } from '../../types/wc2026'
import { getSportMonksToken } from '../../utils/apiTokens'
import { fetchSportMonksStandingsBySeason, fetchSportMonksTeamSquad } from '../sportMonks/sportMonksApi'
import { extractWcGroupsAndStandingsFromSmEnvelope } from '../sportMonks/extractStandingsFromSm'
import {
  extractNationSmTeamIdsFromStandingsEnvelope,
  wcSquadFromSportMonksEnvelope,
} from './squadFromSportMonks'
import { wc2026MockSource } from './mockSource'
import type { WcDataSource } from './types'
import type { WcSquad } from '../../types/wc2026'

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

function mergeLiveIntoBase(live: NonNullable<Awaited<ReturnType<typeof fetchWcGroupsFromSportMonks>>>): WcDataset {
  return {
    ...WC_DATASET,
    groups: live.groups,
    standings: live.standings,
    nations: live.nations,
    updatedAt: live.updatedAt,
  }
}

/** SportMonks pour poules / classements ; mock pour le reste (arbre, stades, effectifs). */
export const wc2026SportMonksSource: WcDataSource = {
  loadDataset: async () => {
    try {
      const live = await fetchWcGroupsFromSportMonks()
      if (live) return mergeLiveIntoBase(live)
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[TalkFoot] CDM poules SportMonks — repli mock:', err)
      }
    }
    return wc2026MockSource.loadDataset()
  },

  refreshLive: async () => {
    try {
      const live = await fetchWcGroupsFromSportMonks()
      if (live) {
        return {
          matches: WC_DATASET.matches,
          standings: live.standings,
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
