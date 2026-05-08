import type { FormResult } from '../../types/standings'
import type { LeagueStandingRow } from '../../data/leagueStandings'
import { apiNameToOurId } from '../footballApi'
import { teams } from '../../data/teams'
import { SPORTMONKS_TEAM_ID_BY_CLUB_ID } from '../../data/sportMonksKnownTeamIds'

function smStandingsListFromEnvelope(body: unknown): unknown[] {
  const raw = body && typeof body === 'object' && 'data' in body ? (body as { data: unknown }).data : body
  return Array.isArray(raw) ? raw : []
}

function parseNum(raw: unknown): number | null {
  if (raw == null) return null
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  const n = Number(String(raw).trim().replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function parseGoalDiff(raw: Record<string, unknown>): number | null {
  return parseNum(
    raw.goal_difference ??
      raw.goals_difference ??
      raw.goal_diff ??
      raw.goals_diff ??
      raw.gd ??
      raw.diff ??
      raw.difference,
  )
}

function resolveGoalsAgainst(
  gf: number | null,
  gaRaw: number | null,
  gd: number | null,
): number | null {
  if (gf == null || gd == null) return gaRaw
  const gaFromDiff = gf - gd
  if (!Number.isFinite(gaFromDiff) || gaFromDiff < 0) return gaRaw
  if (gaRaw == null) return gaFromDiff
  const rawDiff = Math.round(gf - gaRaw)
  const expectedDiff = Math.round(gd)
  if (Math.round(gaRaw) === expectedDiff || rawDiff !== expectedDiff) return gaFromDiff
  return gaRaw
}

function parseForm(raw: unknown): FormResult[] {
  if (typeof raw === 'string') {
    const parts = raw
      .split(/[\s,;|]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
    const out: FormResult[] = []
    for (const p of parts) {
      const c = p[0]
      if (c === 'W') out.push('W')
      else if (c === 'L') out.push('L')
      else if (c === 'D' || c === 'N') out.push('D')
    }
    return out.slice(-5)
  }
  if (!Array.isArray(raw)) return []

  /** SportMonks `StandingForm` : ordre chronologique via `sort_order` (plus ancien → plus récent). */
  const arr = [...raw]
  const hasSortOrder = arr.some(
    (item) => item && typeof item === 'object' && typeof (item as Record<string, unknown>).sort_order === 'number',
  )
  if (hasSortOrder) {
    arr.sort((a, b) => {
      const sa = a && typeof a === 'object' ? Number((a as Record<string, unknown>).sort_order) : 0
      const sb = b && typeof b === 'object' ? Number((b as Record<string, unknown>).sort_order) : 0
      return (Number.isFinite(sa) ? sa : 0) - (Number.isFinite(sb) ? sb : 0)
    })
  }

  const out: FormResult[] = []
  for (const item of arr) {
    if (typeof item === 'string') {
      const u = item.trim().toUpperCase()
      if (u.startsWith('W')) out.push('W')
      else if (u.startsWith('L')) out.push('L')
      else if (u.startsWith('D') || u.startsWith('N')) out.push('D')
      continue
    }
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    /** Champ officiel `StandingForm.form` : une lettre W / D / L (doc SportMonks). */
    const smForm = String(o.form ?? '').trim().toUpperCase()
    if (smForm.startsWith('W')) {
      out.push('W')
      continue
    }
    if (smForm.startsWith('L')) {
      out.push('L')
      continue
    }
    if (smForm.startsWith('D') || smForm.startsWith('N')) {
      out.push('D')
      continue
    }
    const r = String(o.result ?? o.description ?? '').toUpperCase()
    if (r.includes('WIN')) out.push('W')
    else if (r.includes('LOSS') || r.includes('DEF')) out.push('L')
    else if (r.includes('DRAW')) out.push('D')
  }
  return out.slice(-5)
}

function shortParticipantLabel(name: string): string {
  const t = name.trim()
  if (!t) return '?'
  if (t.length <= 5) return t.toUpperCase()
  const parts = t.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0].slice(0, 3)}${parts[parts.length - 1].slice(0, 2)}`.toUpperCase()
  }
  return t.slice(0, 4).toUpperCase()
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]/g, '')
}

function compactClubName(s: string): string {
  return normalizeName(s).replace(
    /(footballclub|fc|ac|sc|as|rc|cf|afc|clubathletique|sportingclub|olympique|stade|de|du|des|la|le|the)/g,
    '',
  )
}

function resolveTeamId(
  participantId: number,
  participantName: string,
  talkFootLeagueId: string,
): { teamId: string; displayName?: string } {
  const pool = teams[talkFootLeagueId as keyof typeof teams]
  if (pool?.length) {
    const n = normalizeName(participantName)
    const c = compactClubName(participantName)
    const exact = pool.find((x) => normalizeName(x.name) === n || normalizeName(x.shortName) === n)
    if (exact) return { teamId: exact.id }
    const fuzzy = pool.find((x) => {
      const xn = normalizeName(x.name)
      const xc = compactClubName(x.name)
      return (
        (c.length >= 4 && xc.length >= 4 && (c.includes(xc) || xc.includes(c))) ||
        (n.length >= 5 && (n.includes(xn) || xn.includes(n)))
      )
    })
    if (fuzzy) return { teamId: fuzzy.id }
  }
  const guessed = apiNameToOurId(participantName)
  if (pool?.some((x) => x.id === guessed)) return { teamId: guessed }
  for (const [clubId, smId] of Object.entries(SPORTMONKS_TEAM_ID_BY_CLUB_ID)) {
    if (smId === participantId && pool?.some((x) => x.id === clubId)) return { teamId: clubId }
  }
  return {
    teamId: `sm-${participantId}`,
    displayName: shortParticipantLabel(participantName),
  }
}

function parseDetailBlob(details: unknown): {
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number | null
} {
  const out = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: null as number | null }
  if (!Array.isArray(details)) return out

  const putBest = (
    key: 'played' | 'won' | 'drawn' | 'lost' | 'gf' | 'ga',
    value: number,
    score: number,
    cur: Record<string, number>,
    quality: Record<string, number>,
  ) => {
    const qk = `q_${key}`
    const prev = quality[qk] ?? -1
    if (score >= prev) {
      cur[key] = value
      quality[qk] = score
    }
  }
  const quality: Record<string, number> = {}

  for (const raw of details) {
    if (!raw || typeof raw !== 'object') continue
    const d = raw as Record<string, unknown>
    const typeObj = d.type
    const dev =
      typeObj && typeof typeObj === 'object'
        ? String((typeObj as Record<string, unknown>).developer_name ?? '').toUpperCase()
        : ''
    const nm =
      typeObj && typeof typeObj === 'object'
        ? String((typeObj as Record<string, unknown>).name ?? '').toUpperCase()
        : ''
    const blob = `${dev} ${nm}`
    const isHomeAway = /HOME|AWAY|DOMICILE|EXTERIEUR/i.test(blob)
    const isOverall = /OVERALL|TOTAL|ALL/i.test(blob) && !isHomeAway
    const score = isOverall ? 3 : isHomeAway ? 1 : 2
    const val = parseNum(d.value ?? d.total)
    if (val == null) continue

    if (dev === 'GOALS_FOR') {
      putBest('gf', val, 5, out, quality)
      continue
    }
    if (dev === 'GOALS_AGAINST') {
      putBest('ga', val, 5, out, quality)
      continue
    }
    if (dev === 'WON' || dev === 'WINS') {
      putBest('won', val, 5, out, quality)
      continue
    }
    if (dev === 'DRAW' || dev === 'DRAWS') {
      putBest('drawn', val, 5, out, quality)
      continue
    }
    if (dev === 'LOST' || dev === 'LOSSES') {
      putBest('lost', val, 5, out, quality)
      continue
    }
    if (dev === 'MATCHES_PLAYED' || dev === 'GAMES_PLAYED' || dev === 'PLAYED') {
      putBest('played', val, 5, out, quality)
      continue
    }

    if (/PLAYED|GAMES?\s*PLAY|MATCHES?\s*PLAY|PJ\b|MP\b/i.test(blob)) {
      putBest('played', val, score, out, quality)
    } else if (
      /OVERALL.*WIN|^WINS?$|TOTAL.*WIN/i.test(blob) ||
      (/\bWIN\b/.test(blob) && !/HOME|AWAY|DOMICILE|EXTERIEUR/.test(blob))
    ) {
      putBest('won', val, score, out, quality)
    } else if (/DRAW|TIE|NUL/i.test(blob)) {
      putBest('drawn', val, score, out, quality)
    } else if (/LOSS|DEFEAT|LOST|DEFAITE/i.test(blob)) {
      putBest('lost', val, score, out, quality)
    } else if (/SCORE|GOAL.*FOR|GOALS?\s*FOR|GF\b|FAVOR/i.test(blob)) {
      putBest('gf', val, score, out, quality)
    } else if (/CONCED|AGAINST|GOALS?\s*AG|GA\b|ENC/i.test(blob)) {
      putBest('ga', val, score, out, quality)
    } else if (/GOAL.*DIFF|GOALS?.*DIFF|\bGD\b|DIFFERENCE/i.test(blob)) {
      out.gd = val
    }
  }

  return out
}

function flattenTeamStatisticsDetails(statistics: unknown): unknown[] {
  if (!Array.isArray(statistics)) return []
  const out: unknown[] = []
  for (const block of statistics) {
    if (!block || typeof block !== 'object') continue
    const details = (block as { details?: unknown[] }).details
    if (Array.isArray(details)) out.push(...details)
  }
  return out
}

function parsePointsFromStatisticDetails(details: unknown[]): number | null {
  for (const raw of details) {
    if (!raw || typeof raw !== 'object') continue
    const d = raw as Record<string, unknown>
    const typeObj = d.type
    const dev =
      typeObj && typeof typeObj === 'object'
        ? String((typeObj as Record<string, unknown>).developer_name ?? '').toUpperCase()
        : ''
    const nm =
      typeObj && typeof typeObj === 'object'
        ? String((typeObj as Record<string, unknown>).name ?? '').toUpperCase()
        : ''
    const blob = `${dev} ${nm}`
    const val = parseNum(d.value ?? d.total)
    if (val == null) continue
    if (/\bPOINTS?\b|TOTAL\s*POINTS?|^PTS\b|TABLE\s*POINTS?/i.test(blob)) return val
  }
  return null
}

function parseOverallBlock(row: Record<string, unknown>): Partial<{
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
}> | null {
  const o = row.overall ?? row.all
  if (!o || typeof o !== 'object') return null
  const g = o as Record<string, unknown>
  const partial: Partial<{
    played: number
    won: number
    drawn: number
    lost: number
    gf: number
    ga: number
  }> = {}
  const played = parseNum(g.played ?? g.games_played ?? g.match_played)
  const won = parseNum(g.wins ?? g.win ?? g.won)
  const drawn = parseNum(g.draws ?? g.draw ?? g.drawn)
  const lost = parseNum(g.losses ?? g.loss ?? g.lost)
  const gf = parseNum(g.goals_scored ?? g.goals_for ?? g.scored)
  const gd = parseGoalDiff(g)
  const gaRaw = parseNum(g.goals_against ?? g.conceded ?? g.against)
  const ga = resolveGoalsAgainst(gf, gaRaw, gd)
  if (played != null) partial.played = played
  if (won != null) partial.won = won
  if (drawn != null) partial.drawn = drawn
  if (lost != null) partial.lost = lost
  if (gf != null) partial.gf = gf
  if (ga != null) partial.ga = ga
  return Object.keys(partial).length ? partial : null
}

function parseTopLevelBlock(row: Record<string, unknown>): Partial<{
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
}> | null {
  const partial: Partial<{
    played: number
    won: number
    drawn: number
    lost: number
    gf: number
    ga: number
  }> = {}
  const played = parseNum(row.played ?? row.games_played ?? row.matches_played ?? row.match_played)
  const won = parseNum(row.won ?? row.wins ?? row.win)
  const drawn = parseNum(row.drawn ?? row.draws ?? row.draw)
  const lost = parseNum(row.lost ?? row.losses ?? row.loss)
  const gf = parseNum(row.goals_for ?? row.goals_scored ?? row.scored)
  const gd = parseGoalDiff(row)
  const gaRaw = parseNum(row.goals_against ?? row.conceded ?? row.against)
  const ga = resolveGoalsAgainst(gf, gaRaw, gd)
  if (played != null) partial.played = played
  if (won != null) partial.won = won
  if (drawn != null) partial.drawn = drawn
  if (lost != null) partial.lost = lost
  if (gf != null) partial.gf = gf
  if (ga != null) partial.ga = ga
  return Object.keys(partial).length ? partial : null
}

function parseDirectStandingsCore(row: Record<string, unknown>): Partial<{
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
}> | null {
  const partial: Partial<{
    played: number
    won: number
    drawn: number
    lost: number
    gf: number
    ga: number
  }> = {}
  const played = parseNum(row.games_played ?? row.played ?? row.matches_played)
  const won = parseNum(row.won ?? row.wins)
  const drawn = parseNum(row.drawn ?? row.draws ?? row.draw)
  const lost = parseNum(row.lost ?? row.losses ?? row.loss)
  const gf = parseNum(row.goals_for ?? row.goals_scored ?? row.scored)
  const gd = parseGoalDiff(row)
  const gaRaw = parseNum(row.goals_against ?? row.conceded ?? row.against)
  const ga = resolveGoalsAgainst(gf, gaRaw, gd)
  if (played != null) partial.played = played
  if (won != null) partial.won = won
  if (drawn != null) partial.drawn = drawn
  if (lost != null) partial.lost = lost
  if (gf != null) partial.gf = gf
  if (ga != null) partial.ga = ga
  return Object.keys(partial).length ? partial : null
}

function trendFromResult(raw: unknown): 'up' | 'down' | 'same' | undefined {
  const s = String(raw ?? '').toLowerCase()
  if (s.includes('up') || s === 'promotion') return 'up'
  if (s.includes('down') || s === 'relegation') return 'down'
  if (s.includes('equal') || s.includes('same')) return 'same'
  return undefined
}

function derivedIndices(row: {
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  points: number
  form: FormResult[]
}): Pick<LeagueStandingRow, 'attackIndex' | 'defenseIndex' | 'momentumIndex'> {
  const p = Math.max(1, row.played)
  const attackIndex = Math.round(Math.min(100, (row.gf / p) * 24 + row.won * 3.2 + row.drawn * 0.8))
  const defenseIndex = Math.round(Math.min(100, Math.max(0, 92 - (row.ga / p) * 26 + row.won * 1.5)))
  let m = 0
  for (const x of row.form) {
    if (x === 'W') m += 20
    else if (x === 'D') m += 8
  }
  const momentumIndex = Math.min(100, Math.round(m + row.points * 0.15))
  return {
    attackIndex: Math.max(0, Math.min(100, attackIndex)),
    defenseIndex: Math.max(0, Math.min(100, defenseIndex)),
    momentumIndex: Math.max(0, Math.min(100, momentumIndex)),
  }
}

/**
 * Repli : `GET /teams/seasons/{seasonId}?include=statistics.details.type` — une ligne par équipe,
 * classement reconstitué par tri sur les points (pas de place officielle dans cette liste).
 */
export function extractLeagueStandingRowsFromSmTeamsSeasonEnvelope(
  body: unknown,
  talkFootLeagueId: string,
): LeagueStandingRow[] {
  const raw = body && typeof body === 'object' && 'data' in body ? (body as { data: unknown }).data : body
  const list = Array.isArray(raw) ? raw : []
  const rows: LeagueStandingRow[] = []

  for (const rawTeam of list) {
    if (!rawTeam || typeof rawTeam !== 'object') continue
    const team = rawTeam as Record<string, unknown>
    const tid = team.id
    if (typeof tid !== 'number' || !Number.isFinite(tid)) continue

    const pname = String(team.name ?? '').trim()
    const { teamId, displayName } = resolveTeamId(tid, pname || `Team ${tid}`, talkFootLeagueId)

    const flat = flattenTeamStatisticsDetails(team.statistics)
    let d = parseDetailBlob(flat)
    const ov = parseOverallBlock(team)
    if (ov) d = { ...d, ...ov }

    const { won, drawn, lost, gf } = d
    const ga = resolveGoalsAgainst(gf, d.ga, d.gd)
    let played = d.played
    const pointsFromStats = parsePointsFromStatisticDetails(flat)
    const points =
      pointsFromStats != null
        ? Math.round(pointsFromStats)
        : Math.round(Math.max(0, won * 3 + drawn))
    if (!played && won + drawn + lost > 0) played = won + drawn + lost
    if (!played) played = Math.max(1, won + drawn + lost)
    if (flat.length === 0 && !ov && points === 0 && won + drawn + lost === 0 && gf === 0 && (ga ?? 0) === 0)
      continue

    const form: FormResult[] = []
    const base = { played, won, drawn, lost, gf, ga: ga ?? 0, points, form }
    const idx = derivedIndices(base)

    rows.push({
      rank: 0,
      teamId,
      played,
      won,
      drawn,
      lost,
      gf,
      ga: ga ?? 0,
      points,
      form,
      ...idx,
      ...(displayName ? { displayName } : {}),
      sportMonksParticipantId: tid,
    })
  }

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const da = a.gf - a.ga
    const db = b.gf - b.ga
    if (db !== da) return db - da
    return b.gf - a.gf
  })
  rows.forEach((r, i) => {
    r.rank = i + 1
  })
  return rows
}

/**
 * Transforme la réponse `standings/live/leagues/{id}` ou `standings/seasons/{id}` en lignes `LeagueStandingRow`.
 */
export function extractLeagueStandingRowsFromSmStandingsEnvelope(
  body: unknown,
  talkFootLeagueId: string,
): LeagueStandingRow[] {
  const list = smStandingsListFromEnvelope(body)
  if (!list.length) return []

  const rows: LeagueStandingRow[] = []

  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue
    const row = raw as Record<string, unknown>
    const part = row.participant
    const pidFromRow = parseNum(row.participant_id)
    const pidFromPart =
      part && typeof part === 'object'
        ? parseNum((part as Record<string, unknown>).id)
        : null
    const pid = pidFromRow ?? pidFromPart
    if (pid == null || !Number.isFinite(pid)) continue

    const pname =
      part && typeof part === 'object'
        ? String((part as Record<string, unknown>).name ?? (part as Record<string, unknown>).short_code ?? '')
            .trim()
        : ''
    const { teamId, displayName } = resolveTeamId(pid, pname || `Team ${pid}`, talkFootLeagueId)

    const pos = parseNum(row.position ?? row.rank ?? row.place)
    const rank = pos != null && pos > 0 ? Math.floor(pos) : rows.length + 1
    const points = parseNum(row.points) ?? 0

    let d = parseDetailBlob(row.details)
    const direct = parseDirectStandingsCore(row)
    if (direct) d = { ...d, ...direct }
    const top = parseTopLevelBlock(row)
    if (top) d = { ...d, ...top }
    const ov = parseOverallBlock(row)
    if (ov) d = { ...d, ...ov }

    const { won, drawn, lost, gf } = d
    const rowGd = parseGoalDiff(row)
    const ga = resolveGoalsAgainst(gf, d.ga, rowGd ?? d.gd)
    let played = d.played
    const sumWdl = won + drawn + lost
    if (played > 0 && sumWdl > played) played = sumWdl
    if (!played && won + drawn + lost > 0) played = won + drawn + lost
    if (!played) played = Math.max(1, won + drawn + lost)

    const form = parseForm(row.form)

    const base = { played, won, drawn, lost, gf, ga: ga ?? 0, points, form }
    const idx = derivedIndices(base)

    rows.push({
      rank,
      teamId,
      played,
      won,
      drawn,
      lost,
      gf,
      ga: ga ?? 0,
      points,
      form,
      ...idx,
      ...(displayName ? { displayName } : {}),
      trend: trendFromResult(row.result),
      sportMonksParticipantId: pid,
    })
  }

  rows.sort((a, b) => a.rank - b.rank || b.points - a.points)
  return rows
}
