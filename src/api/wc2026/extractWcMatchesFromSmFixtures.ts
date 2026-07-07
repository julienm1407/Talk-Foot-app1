import { findNationByName } from '../../data/nations'
import type { SmFixture } from '../sportMonks/types'
import {
  extractCurrentGoalsFromSmFixture,
  extractPenaltyShootoutScoreFromSmFixture,
  smStatus,
} from '../sportMonks/transformSportMonksToMatch'
import type { WcBracket, WcGroupId, WcMatch, WcMatchStatus, WcMatchTeam, WcRoundId } from '../../types/wc2026'

const KO_ROUND_ORDER: Exclude<WcRoundId, 'group'>[] = [
  'r32',
  'r16',
  'qf',
  'sf',
  'third-place',
  'final',
]

function wcGroupIdFromSmGroupName(name: string | undefined | null): WcGroupId | null {
  if (!name) return null
  const m = /group\s+([A-L])\b/i.exec(name.trim())
  return m ? (m[1].toUpperCase() as WcGroupId) : null
}

function startingAtIso(f: SmFixture): string {
  const raw = f.starting_at_timestamp
  if (raw != null && String(raw).trim() !== '') {
    const n = typeof raw === 'string' ? Number(raw) : Number(raw)
    if (Number.isFinite(n)) {
      const ms = n < 1e12 ? n * 1000 : n
      return new Date(ms).toISOString()
    }
  }
  const s = f.starting_at?.trim()
  if (!s) return new Date().toISOString()
  if (s.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(s)) {
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
  }
  if (s.includes('T')) {
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
  }
  const asUtc = new Date(`${s.replace(' ', 'T')}Z`)
  return Number.isNaN(asUtc.getTime()) ? new Date().toISOString() : asUtc.toISOString()
}

function participantNames(f: SmFixture): { home: string; away: string } {
  const parts = f.participants
  if (!Array.isArray(parts) || parts.length < 2) {
    const raw = f.name ?? 'Home vs Away'
    const bits = raw.split(/\s+vs\.?\s+/i)
    return {
      home: (bits[0] ?? 'Home').trim(),
      away: (bits[1] ?? 'Away').trim(),
    }
  }
  let home = ''
  let away = ''
  for (const p of parts) {
    const loc = p.meta?.location?.toLowerCase()
    if (loc === 'home') home = p.name ?? ''
    if (loc === 'away') away = p.name ?? ''
  }
  if (!home || !away) {
    const raw = f.name ?? ''
    const bits = raw.split(/\s+vs\.?\s+/i)
    return {
      home: home || (bits[0] ?? 'Home').trim(),
      away: away || (bits[1] ?? 'Away').trim(),
    }
  }
  return { home, away }
}

function wcRoundFromSmFixture(f: SmFixture): WcRoundId | null {
  const stage = String(f.stage?.name ?? '').trim().toLowerCase()
  if (!stage || stage.includes('group')) return 'group'
  if (stage.includes('round of 32')) return 'r32'
  if (stage.includes('round of 16')) return 'r16'
  if (stage.includes('quarter')) return 'qf'
  if (stage.includes('semi')) return 'sf'
  if (stage.includes('3rd') || stage.includes('third')) return 'third-place'
  if (stage === 'final' || stage.endsWith(' final')) return 'final'
  return null
}

function wcMatchStatusFromSm(f: SmFixture): WcMatchStatus {
  const sm = smStatus(f)
  if (sm === 'live') return 'live'
  if (sm === 'finished') return 'finished'
  const dev = String(f.state?.developer_name ?? f.state?.state ?? '').toUpperCase()
  if (dev.includes('POSTPON')) return 'postponed'
  if (dev.includes('CANCEL')) return 'cancelled'
  return 'scheduled'
}

function teamFromName(
  name: string,
  goals?: number,
  penaltyGoals?: number,
): WcMatchTeam {
  const nation = findNationByName(name)
  return {
    iso: nation?.iso,
    label: nation?.nameFr ?? name,
    ...(goals != null ? { goals } : {}),
    ...(penaltyGoals != null ? { penaltyGoals } : {}),
  }
}

function smFixtureDecidedOnPenalties(f: SmFixture): boolean {
  const dev = String(f.state?.developer_name ?? f.state?.state ?? '').toUpperCase()
  return dev.includes('PENALT') || dev.includes('AFTER PEN')
}

function groupIdFromFixture(f: SmFixture): WcGroupId | undefined {
  const groupObj = f.group
  if (groupObj && typeof groupObj === 'object') {
    const name = String((groupObj as { name?: unknown }).name ?? '').trim()
    const fromName = wcGroupIdFromSmGroupName(name)
    if (fromName) return fromName
  }
  return undefined
}

function bracketSlotForKo(round: Exclude<WcRoundId, 'group'>, index: number): string {
  if (round === 'final') return 'F'
  if (round === 'third-place') return '3RD'
  const prefix =
    round === 'r32'
      ? 'R32'
      : round === 'r16'
        ? 'R16'
        : round === 'qf'
          ? 'QF'
          : 'SF'
  return `${prefix}-${index + 1}`
}

export function assignWcBracketSlots(matches: WcMatch[]): WcMatch[] {
  const next = matches.map((m) => ({ ...m }))
  for (const round of KO_ROUND_ORDER) {
    const roundMatches = next
      .filter((m) => m.round === round)
      .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt) || a.id.localeCompare(b.id))
    roundMatches.forEach((m, index) => {
      const slot = bracketSlotForKo(round, index)
      const idx = next.findIndex((x) => x.id === m.id)
      if (idx >= 0) next[idx] = { ...next[idx], bracketSlot: slot }
    })
  }
  return next
}

export function smFixtureToWcMatch(f: SmFixture): WcMatch | null {
  const round = wcRoundFromSmFixture(f)
  if (!round) return null
  const { home: homeName, away: awayName } = participantNames(f)
  const score = extractCurrentGoalsFromSmFixture(f)
  const penaltyScore = extractPenaltyShootoutScoreFromSmFixture(f)
  const kickoffAt = startingAtIso(f)
  const status = wcMatchStatusFromSm(f)
  const hasFutureKickoff = Date.parse(kickoffAt) > Date.now() + 60_000
  const normalizedStatus =
    hasFutureKickoff && status === 'finished' ? 'scheduled' : status
  const regulationTie =
    score?.home != null && score?.away != null && score.home === score.away
  const includePenalties =
    penaltyScore != null || (regulationTie && smFixtureDecidedOnPenalties(f))

  return {
    id: `m-sm-${f.id}`,
    round,
    groupId: round === 'group' ? groupIdFromFixture(f) : undefined,
    kickoffAt,
    status: normalizedStatus,
    home: teamFromName(
      homeName,
      score?.home,
      includePenalties ? penaltyScore?.home : undefined,
    ),
    away: teamFromName(
      awayName,
      score?.away,
      includePenalties ? penaltyScore?.away : undefined,
    ),
    ...(f.venue?.name ? { venueId: f.venue.name.toLowerCase().replace(/\s+/g, '-') } : {}),
  }
}

export function extractWcMatchesFromSmFixtures(fixtures: SmFixture[]): WcMatch[] {
  const matches = fixtures
    .map(smFixtureToWcMatch)
    .filter((m): m is WcMatch => m != null)
    .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt) || a.id.localeCompare(b.id))
  return assignWcBracketSlots(matches)
}

export function mergeWcBracketWithMatches(base: WcBracket, matches: WcMatch[]): WcBracket {
  const bySlot = new Map(
    matches.filter((m) => m.bracketSlot).map((m) => [m.bracketSlot as string, m]),
  )
  return {
    slots: base.slots.map((slot) => {
      const live = bySlot.get(slot.id)
      if (!live) return slot
      const home = live.home.iso ? live.home.label ?? live.home.iso : live.home.label
      const away = live.away.iso ? live.away.label ?? live.away.iso : live.away.label
      const description =
        home && away ? `${home} vs ${away}` : slot.description
      return {
        ...slot,
        matchId: live.id,
        description,
      }
    }),
  }
}
