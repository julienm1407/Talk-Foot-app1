import { smFixtureHomeAwayParticipantIds } from './smFixtureParticipantSides'
import type { SmFixture, SmFixtureCommentRow, SmFixtureEventRow, SmLineupRow } from './types'

export type LineupSubstitutePlayer = {
  label: string
  shortName: string
  number?: string
  photoUrl?: string
  playerId?: number
  side: 'home' | 'away'
  subbedOnMinute: number
  replacedPlayerName: string
  replacedShortName: string
}

export type LineupSubstitutesBySide = {
  home: LineupSubstitutePlayer[]
  away: LineupSubstitutePlayer[]
}

const SUBSTITUTION_TYPE_ID = 18

const SUBSTITUTION_COMMENT_RE =
  /^Substitution,?\s+(.+?):\s*(.+?)\s+(?:is replaced by|replaced by)\s+(.+?)\.?$/i

function lineupPlayerId(row: SmLineupRow): number | undefined {
  if (typeof row.player_id === 'number') return row.player_id
  const nested = row.player?.id
  return typeof nested === 'number' ? nested : undefined
}

function lineupPlayerLabel(row: SmLineupRow): string {
  return String(row.player?.display_name ?? row.player?.name ?? '').trim()
}

function jerseyNumber(row: SmLineupRow): number | undefined {
  const direct = row.jersey_number
  if (typeof direct === 'number' && Number.isFinite(direct)) return direct
  for (const d of row.details ?? []) {
    const dev = `${d.type?.developer_name ?? ''} ${d.type?.name ?? ''}`.toUpperCase()
    if (!dev.includes('NUMBER') && !dev.includes('JERSEY') && !dev.includes('SHIRT')) continue
    const n = Number(d.value)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function playerPhotoUrl(row: SmLineupRow): string | undefined {
  const raw = row.player?.image_path
  const url = typeof raw === 'string' ? raw.trim() : ''
  return url || undefined
}

function eventPlayerId(ev: SmFixtureEventRow): number | undefined {
  const nested = ev.player as { id?: number } | undefined
  if (typeof nested?.id === 'number') return nested.id
  const top = (ev as { player_id?: number | null }).player_id
  return typeof top === 'number' ? top : undefined
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

function eventTypeId(ev: SmFixtureEventRow): number | undefined {
  const top = (ev as { type_id?: number | null }).type_id
  if (typeof top === 'number' && Number.isFinite(top)) return top
  const nested = ev.type as { id?: number } | undefined
  return typeof nested?.id === 'number' ? nested.id : undefined
}

function eventMinute(ev: SmFixtureEventRow | SmFixtureCommentRow): number {
  const m = typeof ev.minute === 'number' ? ev.minute : 0
  const x = typeof ev.extra_minute === 'number' ? ev.extra_minute : 0
  return m + x
}

function playerNameFromEvent(ev: SmFixtureEventRow, kind: 'in' | 'out'): string {
  if (kind === 'in') {
    return String(ev.player?.display_name ?? ev.player?.name ?? ev.player_name ?? '').trim()
  }
  const rel = ev.relatedPlayer ?? ev.related_player
  return String(rel?.display_name ?? rel?.name ?? ev.related_player_name ?? '').trim()
}

function parseSubstitutionFromFreeText(text: string): { team?: string; outName: string; inName: string } | null {
  const cleaned = String(text ?? '').trim()
  if (!cleaned) return null
  const m = cleaned.match(SUBSTITUTION_COMMENT_RE)
  if (!m) return null
  const outName = m[2]?.trim() ?? ''
  const inName = m[3]?.trim() ?? ''
  if (!inName) return null
  return { team: m[1]?.trim(), outName, inName }
}

/** Nom court style Flashscore : « Pulisic C. » */
export function lineupFlashscoreShortName(fullName: string): string {
  const cleaned = fullName.replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'Joueur'
  const parts = cleaned.split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0]
  const surname = parts[parts.length - 1]
  const initial = parts[0][0]?.toUpperCase() ?? ''
  return initial ? `${surname} ${initial}.` : surname
}

function sideFromParticipant(
  participantId: number | null | undefined,
  homeId: number | undefined,
  awayId: number | undefined,
): 'home' | 'away' | undefined {
  if (participantId == null || !Number.isFinite(participantId)) return undefined
  if (homeId != null && participantId === homeId) return 'home'
  if (awayId != null && participantId === awayId) return 'away'
  return undefined
}

function sideFromParticipantName(
  teamLabel: string | undefined,
  participants: SmFixture['participants'],
  homeId: number | undefined,
  awayId: number | undefined,
): 'home' | 'away' | undefined {
  const label = String(teamLabel ?? '').trim().toLowerCase()
  if (!label) return undefined
  for (const p of participants ?? []) {
    const name = String(p.name ?? '').trim().toLowerCase()
    if (!name) continue
    if (!label.includes(name) && !name.includes(label)) continue
    if (p.id === homeId) return 'home'
    if (p.id === awayId) return 'away'
  }
  return undefined
}

function teamIdOf(row: SmLineupRow): number | null {
  const raw = row.team_id
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string') {
    const n = Number(raw.trim())
    return Number.isFinite(n) ? n : null
  }
  return null
}

function sideFromLineupPlayerId(
  playerId: number | undefined,
  lineupByPlayerId: Map<number, SmLineupRow>,
  homeId: number | undefined,
  awayId: number | undefined,
): 'home' | 'away' | undefined {
  if (playerId == null) return undefined
  const row = lineupByPlayerId.get(playerId)
  if (!row) return undefined
  const tid = teamIdOf(row)
  if (tid == null) return undefined
  if (homeId != null && tid === homeId) return 'home'
  if (awayId != null && tid === awayId) return 'away'
  return undefined
}

export function isSubstitutionEvent(ev: SmFixtureEventRow): boolean {
  const typeId = eventTypeId(ev)
  if (typeId === SUBSTITUTION_TYPE_ID) return true
  if (typeId != null) return false

  const dev = eventDev(ev)
  if (dev.includes('YELLOW') || dev.includes('REDCARD') || dev.includes('RED_CARD')) return false
  if (dev.includes('GOAL') || dev.includes('PENALTY') || dev.includes('VAR')) return false
  if (dev.includes('SUBSTITUTION')) return true
  if (dev === 'SUB') return true
  return false
}

function resolveSubstitutionPlayers(
  ev: SmFixtureEventRow,
  lineupByPlayerId: Map<number, SmLineupRow>,
): { inName: string; outName: string; inPid?: number; outPid?: number } {
  let inName = playerNameFromEvent(ev, 'in')
  let outName = playerNameFromEvent(ev, 'out')
  let inPid = eventPlayerId(ev)
  let outPid = eventRelatedPlayerId(ev)

  const inRow = inPid != null ? lineupByPlayerId.get(inPid) : undefined
  const outRow = outPid != null ? lineupByPlayerId.get(outPid) : undefined
  if (!inName && inRow) inName = lineupPlayerLabel(inRow)
  if (!outName && outRow) outName = lineupPlayerLabel(outRow)

  // SM remplit parfois uniquement relatedPlayer (entrant) ou inverse player/related.
  if (!inName && outName) {
    inName = outName
    outName = playerNameFromEvent(ev, 'in')
    inPid = eventRelatedPlayerId(ev)
    outPid = eventPlayerId(ev)
    if (!outName && outPid != null) {
      const row = lineupByPlayerId.get(outPid)
      if (row) outName = lineupPlayerLabel(row)
    }
  }

  const infoText = `${ev.info ?? ''} ${ev.addition ?? ''}`.trim()
  const parsed = parseSubstitutionFromFreeText(infoText)
  if (parsed) {
    if (!inName) inName = parsed.inName
    if (!outName) outName = parsed.outName
  }

  return { inName, outName, inPid, outPid }
}

function resolveSubstitutionSide(
  ev: SmFixtureEventRow,
  inPid: number | undefined,
  outPid: number | undefined,
  lineupByPlayerId: Map<number, SmLineupRow>,
  homeId: number | undefined,
  awayId: number | undefined,
): 'home' | 'away' | undefined {
  return (
    sideFromParticipant(ev.participant_id, homeId, awayId) ??
    sideFromLineupPlayerId(inPid, lineupByPlayerId, homeId, awayId) ??
    sideFromLineupPlayerId(outPid, lineupByPlayerId, homeId, awayId)
  )
}

function buildSubstitute(
  side: 'home' | 'away',
  minute: number,
  inName: string,
  outName: string,
  inPid: number | undefined,
  lineupByPlayerId: Map<number, SmLineupRow>,
): LineupSubstitutePlayer {
  const row = inPid != null ? lineupByPlayerId.get(inPid) : undefined
  const label = inName || (row ? lineupPlayerLabel(row) : '')
  const j = row ? jerseyNumber(row) : undefined
  const replaced = outName || 'Joueur'
  return {
    label: label || 'Joueur',
    shortName: lineupFlashscoreShortName(label || inName || 'Joueur'),
    number: j != null && j < 100 ? String(j) : undefined,
    photoUrl: row ? playerPhotoUrl(row) : undefined,
    playerId: inPid,
    side,
    subbedOnMinute: minute,
    replacedPlayerName: replaced,
    replacedShortName: outName ? lineupFlashscoreShortName(outName) : 'Joueur',
  }
}

function pushSubstitute(
  target: LineupSubstitutesBySide,
  sub: LineupSubstitutePlayer,
  seen: Set<string>,
): void {
  const dedupeKey = `${sub.side}:${sub.playerId ?? sub.label}:${sub.subbedOnMinute}:${sub.replacedPlayerName}`
  if (seen.has(dedupeKey)) return
  seen.add(dedupeKey)
  if (sub.side === 'home') target.home.push(sub)
  else target.away.push(sub)
}

function extractSubstitutesFromEvents(
  fixture: SmFixture,
  homeId: number | undefined,
  awayId: number | undefined,
  lineupByPlayerId: Map<number, SmLineupRow>,
  seen: Set<string>,
  target: LineupSubstitutesBySide,
): void {
  for (const ev of fixture.events ?? []) {
    if (!isSubstitutionEvent(ev)) continue

    const minute = eventMinute(ev)
    const { inName, outName, inPid, outPid } = resolveSubstitutionPlayers(ev, lineupByPlayerId)
    if (!inName) continue

    const side = resolveSubstitutionSide(ev, inPid, outPid, lineupByPlayerId, homeId, awayId)
    if (!side) continue

    pushSubstitute(
      target,
      buildSubstitute(side, minute, inName, outName, inPid, lineupByPlayerId),
      seen,
    )
  }
}

function extractSubstitutesFromComments(
  fixture: SmFixture,
  homeId: number | undefined,
  awayId: number | undefined,
  lineupByPlayerId: Map<number, SmLineupRow>,
  seen: Set<string>,
  target: LineupSubstitutesBySide,
): void {
  for (const row of fixture.comments ?? []) {
    const parsed = parseSubstitutionFromFreeText(String(row.comment ?? ''))
    if (!parsed) continue

    const minute = eventMinute(row)
    const side =
      sideFromParticipantName(parsed.team, fixture.participants, homeId, awayId) ??
      (() => {
        for (const [pid, lineupRow] of lineupByPlayerId) {
          const label = lineupPlayerLabel(lineupRow)
          if (!label) continue
          if (label !== parsed.inName && !label.includes(parsed.inName) && !parsed.inName.includes(label)) {
            continue
          }
          return sideFromLineupPlayerId(pid, lineupByPlayerId, homeId, awayId)
        }
        return undefined
      })()
    if (!side) continue

    pushSubstitute(
      target,
      buildSubstitute(side, minute, parsed.inName, parsed.outName, undefined, lineupByPlayerId),
      seen,
    )
  }
}

/** Entrants en jeu depuis événements + commentaires SM (joueur = entrant, related = sortant). */
export function extractSubstitutesFromSmFixture(
  fixture: SmFixture | null | undefined,
): LineupSubstitutesBySide {
  const empty: LineupSubstitutesBySide = { home: [], away: [] }
  if (!fixture) return empty

  const { homeId, awayId } = smFixtureHomeAwayParticipantIds(fixture)
  if (homeId == null && awayId == null) return empty

  const lineupByPlayerId = new Map<number, SmLineupRow>()
  for (const row of fixture.lineups ?? []) {
    const pid = lineupPlayerId(row)
    if (pid != null) lineupByPlayerId.set(pid, row)
  }

  const target: LineupSubstitutesBySide = { home: [], away: [] }
  const seen = new Set<string>()

  extractSubstitutesFromEvents(fixture, homeId, awayId, lineupByPlayerId, seen, target)
  extractSubstitutesFromComments(fixture, homeId, awayId, lineupByPlayerId, seen, target)

  const byMinute = (a: LineupSubstitutePlayer, b: LineupSubstitutePlayer) =>
    a.subbedOnMinute - b.subbedOnMinute || a.shortName.localeCompare(b.shortName, 'fr')

  target.home.sort(byMinute)
  target.away.sort(byMinute)

  return target
}
