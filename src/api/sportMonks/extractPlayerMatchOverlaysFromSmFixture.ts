import {
  compactScorerDisplayName,
  scorerLineupMatchesScoredGoal,
  slugScorer,
  type LiveCardDisplayRow,
  type LiveGoalDisplayRow,
} from '../../utils/liveFootballOdds'
import type { SmFixture, SmFixtureEventRow, SmLineupRow } from './types'

export type LineupPlayerMatchOverlay = {
  rating?: number
  goals: number
  ownGoals: number
  yellowCards: number
  redCards: number
  subbedOffMinute?: number
}

export type LineupPlayerOverlayIndex = {
  byPlayerId: Map<number, LineupPlayerMatchOverlay>
  bySlug: Map<string, LineupPlayerMatchOverlay>
}

export type LineupOverlayRosterPlayer = {
  label: string
  playerId?: number
  side: 'home' | 'away'
}

function emptyOverlay(): LineupPlayerMatchOverlay {
  return { goals: 0, ownGoals: 0, yellowCards: 0, redCards: 0 }
}

function cloneOverlay(o: LineupPlayerMatchOverlay): LineupPlayerMatchOverlay {
  return { ...o }
}

function mergeInto(
  target: Map<number, LineupPlayerMatchOverlay>,
  playerId: number,
  patch: Partial<LineupPlayerMatchOverlay>,
): void {
  const cur = target.get(playerId) ?? emptyOverlay()
  target.set(playerId, {
    rating: patch.rating ?? cur.rating,
    goals: patch.goals ?? cur.goals,
    ownGoals: patch.ownGoals ?? cur.ownGoals,
    yellowCards: patch.yellowCards ?? cur.yellowCards,
    redCards: patch.redCards ?? cur.redCards,
    subbedOffMinute: patch.subbedOffMinute ?? cur.subbedOffMinute,
  })
}

function detailNumeric(row: SmLineupRow, tokens: string[]): number | undefined {
  for (const d of row.details ?? []) {
    const dev = `${d.type?.developer_name ?? ''} ${d.type?.name ?? ''}`.toUpperCase()
    if (!tokens.some((t) => dev.includes(t))) continue
    const n = Number(d.value)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function lineupPlayerId(row: SmLineupRow): number | undefined {
  if (typeof row.player_id === 'number') return row.player_id
  const nested = row.player?.id
  return typeof nested === 'number' ? nested : undefined
}

function eventRelatedPlayerId(ev: SmFixtureEventRow): number | undefined {
  const nested = (ev.relatedPlayer ?? ev.related_player) as { id?: number } | undefined
  if (typeof nested?.id === 'number') return nested.id
  const top = (ev as { related_player_id?: number | null }).related_player_id
  return typeof top === 'number' ? top : undefined
}

function eventDev(ev: SmFixtureEventRow): string {
  return String(ev.type?.developer_name ?? ev.type?.name ?? '').toUpperCase()
}

function eventMinute(ev: SmFixtureEventRow): number {
  const m = typeof ev.minute === 'number' ? ev.minute : 0
  const x = typeof ev.extra_minute === 'number' ? ev.extra_minute : 0
  return m + x
}

function slugFromPlayerName(name: string | null | undefined): string | undefined {
  const s = String(name ?? '').trim()
  if (!s) return undefined
  const slug = slugScorer(compactScorerDisplayName(s))
  return slug || undefined
}

function slugFromEventRelated(ev: SmFixtureEventRow): string | undefined {
  const rel = ev.relatedPlayer ?? ev.related_player
  return slugFromPlayerName(rel?.display_name ?? rel?.name ?? ev.related_player_name)
}

function mergeSlug(
  bySlug: Map<string, LineupPlayerMatchOverlay>,
  slug: string,
  patch: Partial<LineupPlayerMatchOverlay>,
): void {
  const cur = bySlug.get(slug) ?? emptyOverlay()
  bySlug.set(slug, {
    rating: patch.rating ?? cur.rating,
    goals: patch.goals ?? cur.goals,
    ownGoals: patch.ownGoals ?? cur.ownGoals,
    yellowCards: patch.yellowCards ?? cur.yellowCards,
    redCards: patch.redCards ?? cur.redCards,
    subbedOffMinute: patch.subbedOffMinute ?? cur.subbedOffMinute,
  })
}

function eventPlayerId(ev: SmFixtureEventRow): number | undefined {
  const nested = ev.player as { id?: number } | undefined
  if (typeof nested?.id === 'number') return nested.id
  const top = (ev as { player_id?: number | null }).player_id
  return typeof top === 'number' ? top : undefined
}

function slugFromEventPlayer(ev: SmFixtureEventRow): string | undefined {
  return slugFromPlayerName(ev.player?.display_name ?? ev.player?.name ?? ev.player_name)
}

function overlayHasVisibleStats(o: LineupPlayerMatchOverlay): boolean {
  return (
    o.goals > 0 ||
    o.ownGoals > 0 ||
    o.yellowCards > 0 ||
    o.redCards > 0 ||
    o.rating != null ||
    o.subbedOffMinute != null
  )
}

function writeOverlayOnRosterPlayer(
  byPlayerId: Map<number, LineupPlayerMatchOverlay>,
  bySlug: Map<string, LineupPlayerMatchOverlay>,
  player: LineupOverlayRosterPlayer,
  patch: Partial<LineupPlayerMatchOverlay>,
): void {
  if (player.playerId != null) mergeInto(byPlayerId, player.playerId, patch)
  const slug = slugFromPlayerName(player.label)
  if (slug) mergeSlug(bySlug, slug, patch)
}

/** Base SM : note, CSC, sortie — pas les buts/cartons (source = fil sous le score). */
export function extractPlayerMatchOverlaysFromSmFixture(
  fixture: SmFixture | null | undefined,
): LineupPlayerOverlayIndex {
  const byPlayerId = new Map<number, LineupPlayerMatchOverlay>()
  const bySlug = new Map<string, LineupPlayerMatchOverlay>()
  if (!fixture) return { byPlayerId, bySlug }

  for (const row of fixture.lineups ?? []) {
    const pid = lineupPlayerId(row)
    if (pid == null) continue
    const rating = detailNumeric(row, ['RATING'])
    if (rating != null) {
      mergeInto(byPlayerId, pid, { rating })
      const label = String(row.player?.display_name ?? row.player?.name ?? '').trim()
      const slug = slugFromPlayerName(label)
      if (slug) mergeSlug(bySlug, slug, { rating })
    }
  }

  for (const ev of fixture.events ?? []) {
    const dev = eventDev(ev)
    const minute = eventMinute(ev)
    const relPid = eventRelatedPlayerId(ev)
    const relSlug = slugFromEventRelated(ev)
    const pid = eventPlayerId(ev)
    const slug = slugFromEventPlayer(ev)

    if (dev.includes('SUBSTITUTION') || dev.includes('SUBS')) {
      if (relPid != null) mergeInto(byPlayerId, relPid, { subbedOffMinute: minute })
      else if (relSlug) mergeSlug(bySlug, relSlug, { subbedOffMinute: minute })
      continue
    }

    if (dev.includes('OWNGOAL') || dev.includes('OWN GOAL') || dev.includes('OWN-GOAL')) {
      if (pid != null) {
        const cur = byPlayerId.get(pid) ?? emptyOverlay()
        mergeInto(byPlayerId, pid, { ownGoals: cur.ownGoals + 1 })
      } else if (slug) {
        const cur = bySlug.get(slug) ?? emptyOverlay()
        mergeSlug(bySlug, slug, { ownGoals: cur.ownGoals + 1 })
      }
    }
  }

  return { byPlayerId, bySlug }
}

function playersMatchingEventName(
  eventName: string,
  players: LineupOverlayRosterPlayer[],
): LineupOverlayRosterPlayer[] {
  const eventSlug = slugFromPlayerName(eventName)
  if (!eventSlug) return []
  return players.filter((p) => {
    const lineupSlug = slugFromPlayerName(p.label)
    if (!lineupSlug) return false
    if (lineupSlug === eventSlug) return true
    return scorerLineupMatchesScoredGoal(lineupSlug, { slug: eventSlug, name: eventName })
  })
}

/** Un seul titulaire par événement — évite les homonymes (ex. deux « Gómez »). */
function resolveUniqueRosterPlayer(
  eventName: string,
  side: 'home' | 'away',
  players: LineupOverlayRosterPlayer[],
): LineupOverlayRosterPlayer | null {
  const pool = players.filter((p) => p.side === side)
  const matches = playersMatchingEventName(eventName, pool)
  if (matches.length === 1) return matches[0]

  const eventSlug = slugFromPlayerName(eventName)
  if (!eventSlug) return null

  const exactSlug = matches.filter((p) => slugFromPlayerName(p.label) === eventSlug)
  if (exactSlug.length === 1) return exactSlug[0]

  const endsWith = matches.filter((p) => {
    const lineupSlug = slugFromPlayerName(p.label)
    return lineupSlug != null && lineupSlug.endsWith(`-${eventSlug}`)
  })
  if (endsWith.length === 1) return endsWith[0]

  return null
}

/**
 * Buts + cartons compo = exactement les lignes affichées sous le score (déjà dédupliquées).
 */
export function enrichLineupOverlaysFromMatchFeed(
  index: LineupPlayerOverlayIndex,
  feed: {
    cards?: LiveCardDisplayRow[]
    goals?: LiveGoalDisplayRow[]
    players: LineupOverlayRosterPlayer[]
  },
): LineupPlayerOverlayIndex {
  const byPlayerId = new Map<number, LineupPlayerMatchOverlay>()
  const bySlug = new Map<string, LineupPlayerMatchOverlay>()
  const players = feed.players.filter((p) => p.label.trim().length > 0)

  for (const [pid, overlay] of index.byPlayerId) {
    byPlayerId.set(pid, cloneOverlay(overlay))
  }
  for (const [slug, overlay] of index.bySlug) {
    bySlug.set(slug, cloneOverlay(overlay))
  }

  const goalCounts = new Map<string, number>()
  const yellowCounts = new Map<string, number>()
  const redCounts = new Map<string, number>()

  const rosterKey = (p: LineupOverlayRosterPlayer) =>
    p.playerId != null ? `id:${p.playerId}` : `slug:${slugFromPlayerName(p.label) ?? p.label}`

  for (const goal of feed.goals ?? []) {
    const player = resolveUniqueRosterPlayer(goal.name, goal.side, players)
    if (!player) continue
    const key = rosterKey(player)
    goalCounts.set(key, (goalCounts.get(key) ?? 0) + 1)
  }

  for (const card of feed.cards ?? []) {
    const player = resolveUniqueRosterPlayer(card.name, card.side, players)
    if (!player) continue
    const key = rosterKey(player)
    if (card.color === 'red') {
      redCounts.set(key, (redCounts.get(key) ?? 0) + 1)
    } else {
      yellowCounts.set(key, (yellowCounts.get(key) ?? 0) + 1)
    }
  }

  for (const player of players) {
    const key = rosterKey(player)
    const goals = goalCounts.get(key) ?? 0
    const yellowCards = yellowCounts.get(key) ?? 0
    const redCards = redCounts.get(key) ?? 0
    if (goals === 0 && yellowCards === 0 && redCards === 0) continue
    writeOverlayOnRosterPlayer(byPlayerId, bySlug, player, { goals, yellowCards, redCards })
  }

  return { byPlayerId, bySlug }
}

export function resolveLineupPlayerOverlay(
  index: LineupPlayerOverlayIndex,
  opts: { playerId?: number; name: string },
): LineupPlayerMatchOverlay | undefined {
  let result: LineupPlayerMatchOverlay | undefined

  if (opts.playerId != null && index.byPlayerId.has(opts.playerId)) {
    result = index.byPlayerId.get(opts.playerId)
  }

  if (!result) {
    const lineupSlug = slugFromPlayerName(opts.name)
    if (lineupSlug && index.bySlug.has(lineupSlug)) {
      result = index.bySlug.get(lineupSlug)
    }
  }

  if (!result || !overlayHasVisibleStats(result)) return undefined
  return result
}
