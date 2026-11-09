import { smIncludeRows } from './normalizeSmFixtureIncludes'
import { extractPlayerRecentMatchesFromSmPlayerPayload, type PlayerRecentMatch } from './extractPlayerRecentMatchesFromSm'

export type PlayerSeasonStat = { key: string; label: string; value: string }

export type PlayerPitchSlot =
  | 'gk'
  | 'def-l'
  | 'def-c'
  | 'def-r'
  | 'mid-l'
  | 'mid-c'
  | 'mid-r'
  | 'att-l'
  | 'att-c'
  | 'att-r'

export type PlayerCareerSpell = {
  team: string
  logoUrl?: string
  start?: string
  end?: string | null
  current: boolean
}

export type PlayerTrophyKind = 'winner' | 'runner' | 'other'

export type PlayerTrophyRow = {
  title: string
  team?: string
  teamLogo?: string
  season?: string
  kind: PlayerTrophyKind
}

export type PlayerTrophyGroup = {
  team: string
  logoUrl?: string
  items: PlayerTrophyRow[]
}

export type PlayerProfile = {
  name: string
  photoUrl?: string
  country?: string
  countryFlagUrl?: string
  currentTeam?: string
  currentTeamLogo?: string
  position?: string
  pitchSlot: PlayerPitchSlot
  dateOfBirth?: string
  age?: number
  height?: string
  weight?: string
  foot?: string
  seasonLabel?: string
  seasonStats: PlayerSeasonStat[]
  career: PlayerCareerSpell[]
  trophies: PlayerTrophyRow[]
  trophyGroups: PlayerTrophyGroup[]
  matches: PlayerRecentMatch[]
}

function rec(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function unwrap(v: unknown): Record<string, unknown> | null {
  const o = rec(v)
  if (!o) return null
  return rec(o.data) ?? o
}

function num(v: unknown): number | null {
  if (v == null) return null
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const nested = rec(v)
  if (nested) return num(nested.value ?? nested.total)
  const n = Number(String(v).replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : null
}

function str(v: unknown): string | undefined {
  const s = String(v ?? '').trim()
  return s || undefined
}

function named(v: unknown): string | undefined {
  const o = unwrap(v)
  return str(o?.name ?? o?.display_name ?? o?.developer_name)
}

function typeDev(d: Record<string, unknown>): string {
  const t = unwrap(d.type)
  return String(t?.developer_name ?? t?.name ?? '')
    .trim()
    .toUpperCase()
}

function detailNum(d: Record<string, unknown>): number | null {
  return num(d.value ?? rec(d.data)?.value ?? rec(d.data)?.total ?? d.data)
}

function formatCmKg(raw: unknown, unit: 'cm' | 'kg'): string | undefined {
  const s = str(raw)
  if (!s) return undefined
  if (/[a-z]/i.test(s)) return s
  const n = num(s)
  return n != null ? `${n} ${unit}` : s
}

function ageFromDob(iso: string): number | undefined {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return undefined
  const born = new Date(t)
  const now = new Date()
  let age = now.getFullYear() - born.getFullYear()
  const m = now.getMonth() - born.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age -= 1
  return age >= 14 && age <= 60 ? age : undefined
}

function formatDob(iso: string): string | undefined {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return undefined
  return new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatYear(raw: unknown): string | undefined {
  const s = str(raw)
  if (!s) return undefined
  const y = s.slice(0, 4)
  return /^\d{4}$/.test(y) ? y : s
}

function translateFoot(raw: string): string {
  const k = raw.toLowerCase()
  if (k.includes('left') || k.includes('gauch')) return 'Pied gauche'
  if (k.includes('right') || k.includes('droit')) return 'Pied droit'
  if (k.includes('both') || k.includes('two') || k.includes('ambi')) return 'Ambidextre'
  return raw
}

function translatePosition(raw: string): string {
  const k = raw.toLowerCase()
  const map: [RegExp, string][] = [
    [/goalkeeper|^gk\b|gardien/, 'Gardien'],
    [/centre.?back|center.?back|^cb\b/, 'Défenseur central'],
    [/left.?back|^lb\b/, 'Latéral gauche'],
    [/right.?back|^rb\b/, 'Latéral droit'],
    [/wing.?back/, 'Piston'],
    [/defensive.?mid|defensive midfielder|^dm\b/, 'Milieu défensif'],
    [/attacking.?mid|^am\b|^cam\b/, 'Milieu offensif'],
    [/central.?mid|^cm\b/, 'Milieu'],
    [/left.?mid|^lm\b/, 'Milieu gauche'],
    [/right.?mid|^rm\b/, 'Milieu droit'],
    [/left.?wing|^lw\b/, 'Ailier gauche'],
    [/right.?wing|^rw\b/, 'Ailier droit'],
    [/second.?striker/, 'Second attaquant'],
    [/centre.?forward|center.?forward|striker|^st\b|^cf\b/, 'Attaquant'],
    [/forward|attacker/, 'Attaquant'],
    [/midfield/, 'Milieu'],
    [/defend/, 'Défenseur'],
  ]
  for (const [re, label] of map) {
    if (re.test(k)) return label
  }
  return raw
}

const SEASON_STAT_ORDER: { keys: string[]; label: string }[] = [
  { keys: ['MINUTES_PLAYED'], label: 'Minutes' },
  { keys: ['GOALS'], label: 'Buts' },
  { keys: ['APPEARANCES', 'MATCHES', 'GAMES_PLAYED'], label: 'Matchs' },
  { keys: ['RATING'], label: 'Note' },
  { keys: ['ASSISTS'], label: 'Passes D' },
  { keys: ['BENCH', 'SUBSTITUTE_APPEARANCES', 'SUBSTITUTIONS_IN', 'SUBSTITUTE_IN'], label: 'Banc' },
  { keys: ['PASSES', 'TOTAL_PASSES'], label: 'Passes' },
  { keys: ['SHOTS_TOTAL', 'SHOTS'], label: 'Tirs' },
  { keys: ['SHOTS_ON_TARGET', 'SHOTS_ON_GOAL'], label: 'Cadrés' },
  { keys: ['YELLOWCARDS', 'YELLOW_CARDS'], label: 'Jaunes' },
  { keys: ['REDCARDS', 'RED_CARDS'], label: 'Rouges' },
  { keys: ['CLEAN_SHEETS', 'CLEANSHEET'], label: 'Cleansheets' },
  { keys: ['SAVES'], label: 'Arrêts' },
]

function imagePath(v: unknown): string | undefined {
  const o = unwrap(v)
  return str(o?.image_path) ?? str(v)
}

function trophyKind(name: string | undefined): PlayerTrophyKind {
  const k = (name ?? '').toLowerCase()
  if (/runner|finalist|vice/.test(k)) return 'runner'
  if (/winner|champion|vainqueur/.test(k)) return 'winner'
  return 'other'
}

function positionSlotFromName(raw: string): PlayerPitchSlot {
  const k = raw.toLowerCase()
  if (/goalkeeper|^gk\b|gardien/.test(k)) return 'gk'
  if (/left.?back|^lb\b/.test(k)) return 'def-l'
  if (/right.?back|^rb\b/.test(k)) return 'def-r'
  if (/centre.?back|center.?back|^cb\b|defend/.test(k)) return 'def-c'
  if (/left.?wing|^lw\b|left.?mid|^lm\b/.test(k)) return /wing|forward|attack/.test(k) ? 'att-l' : 'mid-l'
  if (/right.?wing|^rw\b|right.?mid|^rm\b/.test(k)) return /wing|forward|attack/.test(k) ? 'att-r' : 'mid-r'
  if (/attacking.?mid|^am\b|^cam\b/.test(k)) return 'mid-c'
  if (/defensive.?mid|^dm\b/.test(k)) return 'mid-c'
  if (/central.?mid|^cm\b|midfield/.test(k)) return 'mid-c'
  if (/second.?striker|centre.?forward|center.?forward|striker|^st\b|^cf\b|forward|attack/.test(k)) return 'att-c'
  return 'mid-c'
}

function pickFoot(metadata: Record<string, unknown>[]): string | undefined {
  for (const row of metadata) {
    const blob = `${typeDev(row)} ${named(row.type) ?? ''}`
    if (!/FOOT|PIED/.test(blob)) continue
    const values = row.values ?? row.value ?? rec(row.data)?.value ?? rec(row.data)?.values
    const text = Array.isArray(values)
      ? values.map((x) => str(x) ?? named(x) ?? '').filter(Boolean).join(' ')
      : str(values) ?? named(values)
    if (text) return translateFoot(text)
  }
  return undefined
}

function seasonSortKey(block: Record<string, unknown>): number {
  const season = unwrap(block.season)
  return num(block.season_id ?? season?.id ?? season?.name) ?? 0
}

function appearancesInBlock(details: Record<string, unknown>[]): number {
  for (const d of details) {
    if (!['APPEARANCES', 'MATCHES', 'GAMES_PLAYED', 'MINUTES_PLAYED'].includes(typeDev(d))) continue
    const v = detailNum(d)
    if (v != null) return v
  }
  return 0
}

function extractSeasonStats(player: Record<string, unknown>): {
  label?: string
  stats: PlayerSeasonStat[]
} {
  const blocks = smIncludeRows<Record<string, unknown>>(player.statistics)
    .map((b) => rec(b))
    .filter((b): b is Record<string, unknown> => Boolean(b))
    .filter((b) => smIncludeRows(b.details).length > 0)
    .sort((a, b) => seasonSortKey(b) - seasonSortKey(a) || appearancesInBlock(smIncludeRows(b.details)) - appearancesInBlock(smIncludeRows(a.details)))

  const block = blocks[0]
  if (!block) return { stats: [] }

  const season = unwrap(block.season)
  const league = named(season?.league)
  const seasonName = str(season?.name)
  const team = named(block.team)
  const label = [league, seasonName, team].filter(Boolean).join(' · ') || undefined

  const details = smIncludeRows<Record<string, unknown>>(block.details)
  const byDev = new Map<string, number>()
  for (const d of details) {
    const v = detailNum(d)
    if (v == null) continue
    byDev.set(typeDev(d), v)
  }

  const stats: PlayerSeasonStat[] = []
  const used = new Set<string>()
  for (const row of SEASON_STAT_ORDER) {
    for (const key of row.keys) {
      const v = byDev.get(key)
      if (v == null || used.has(row.label)) continue
      used.add(row.label)
      const value = key === 'RATING' ? v.toFixed(1).replace('.', ',') : String(Math.round(v))
      stats.push({ key, label: row.label, value })
      break
    }
  }
  return { label, stats }
}

function extractCareer(player: Record<string, unknown>): PlayerCareerSpell[] {
  const rows = smIncludeRows<Record<string, unknown>>(player.teams)
  const out: PlayerCareerSpell[] = []
  const seen = new Set<string>()
  for (const raw of rows) {
    const row = rec(raw)
    if (!row) continue
    const team = named(row.team) ?? str(row.team_name)
    if (!team) continue
    const start = formatYear(row.start ?? row.started_at ?? row.from)
    const endRaw = row.end ?? row.ended_at ?? row.to
    const current = endRaw == null || str(endRaw) == null || str(endRaw) === ''
    const end = current ? null : formatYear(endRaw)
    const key = `${team}:${start ?? ''}:${end ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      team,
      logoUrl: imagePath(row.team),
      start,
      end,
      current,
    })
  }
  out.sort((a, b) => {
    if (a.current !== b.current) return a.current ? -1 : 1
    return String(b.start ?? '').localeCompare(String(a.start ?? ''))
  })
  return out.slice(0, 12)
}

function extractTrophies(player: Record<string, unknown>): PlayerTrophyRow[] {
  const rows = smIncludeRows<Record<string, unknown>>(player.trophies)
  const out: PlayerTrophyRow[] = []
  for (const raw of rows) {
    const row = rec(raw)
    if (!row) continue
    const trophyName = named(row.trophy)
    const leagueName = named(row.league)
    const kind = trophyKind(trophyName)
    const title =
      kind !== 'other' ? leagueName ?? trophyName : trophyName ?? leagueName ?? str(row.name)
    if (!title) continue
    out.push({
      title,
      kind,
      team: named(row.team),
      teamLogo: imagePath(row.team),
      season: str(unwrap(row.season)?.name) ?? formatYear(unwrap(row.season)?.starting_at),
    })
  }
  out.sort((a, b) => String(b.season ?? '').localeCompare(String(a.season ?? '')))
  return out.slice(0, 24)
}

function groupTrophies(rows: PlayerTrophyRow[]): PlayerTrophyGroup[] {
  const order: string[] = []
  const map = new Map<string, PlayerTrophyGroup>()
  for (const row of rows) {
    const team = row.team ?? 'Palmarès'
    let g = map.get(team)
    if (!g) {
      g = { team, logoUrl: row.teamLogo, items: [] }
      map.set(team, g)
      order.push(team)
    }
    if (!g.logoUrl && row.teamLogo) g.logoUrl = row.teamLogo
    g.items.push(row)
  }
  return order.map((k) => map.get(k)!).filter((g) => g.items.length > 0)
}

export function extractPlayerProfileFromSmPayload(
  payload: unknown,
  opts?: { excludeFixtureId?: number; matchLimit?: number },
): PlayerProfile | null {
  const root = rec(payload)
  if (!root) return null
  const player = rec(root.data) ?? (Array.isArray(root.data) ? rec(root.data[0]) : root)
  if (!player) return null

  const name =
    str(player.display_name) ??
    str(player.name) ??
    `${str(player.firstname) ?? ''} ${str(player.lastname) ?? ''}`.trim()
  if (!name) return null

  const dob = str(player.date_of_birth)
  const season = extractSeasonStats(player)
  const photo = str(player.image_path)
  const rawPos = named(player.detailedPosition) ?? named(player.position) ?? named(player.detailed_position)
  const career = extractCareer(player)
  const current = career.find((c) => c.current) ?? career[0]
  const trophies = extractTrophies(player)

  return {
    name,
    photoUrl: photo,
    country: named(player.nationality) ?? named(player.country),
    countryFlagUrl: imagePath(player.nationality) ?? imagePath(player.country),
    currentTeam: current?.team,
    currentTeamLogo: current?.logoUrl,
    position: rawPos ? translatePosition(rawPos) : undefined,
    pitchSlot: positionSlotFromName(rawPos ?? ''),
    dateOfBirth: dob ? formatDob(dob) : undefined,
    age: dob ? ageFromDob(dob) : undefined,
    height: formatCmKg(player.height, 'cm'),
    weight: formatCmKg(player.weight, 'kg'),
    foot: pickFoot(smIncludeRows(player.metadata)),
    seasonLabel: season.label,
    seasonStats: season.stats,
    career,
    trophies,
    trophyGroups: groupTrophies(trophies),
    matches: extractPlayerRecentMatchesFromSmPlayerPayload(payload, {
      excludeFixtureId: opts?.excludeFixtureId,
      limit: opts?.matchLimit ?? 12,
    }),
  }
}

export function careerSpellLabel(spell: PlayerCareerSpell): string {
  if (spell.current) return spell.start ? `${spell.start} — auj.` : 'En cours'
  if (spell.start && spell.end) return spell.start === spell.end ? spell.start : `${spell.start}–${spell.end}`
  return spell.start ?? spell.end ?? ''
}
