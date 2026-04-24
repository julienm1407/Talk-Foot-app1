import type { SmFixture, SmFixtureTrend } from './types'
import type { FormResult } from '../../types/standings'
import { smFixtureHomeAwayParticipantIds } from './smFixtureParticipantSides'

export type FixtureTrendDisplayRow = {
  key: string
  label: string
  home: string
  away: string
}

function trendTypeKey(t: SmFixtureTrend): string {
  const tid = t.type_id
  if (typeof tid === 'number' && Number.isFinite(tid)) return `t${tid}`
  const dev = String(t.type?.developer_name ?? '').trim().toLowerCase().replace(/\s+/g, '_')
  if (dev) return dev
  return String(t.type?.name ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

function trendLabel(t: SmFixtureTrend): string {
  const name = String(t.type?.name ?? '').trim()
  if (name) return name
  const dev = String(t.type?.developer_name ?? '').trim()
  if (dev) return dev.replace(/_/g, ' ')
  return 'Tendance'
}

function parseNumeric(raw: unknown): number | null {
  if (raw == null) return null
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  const n = Number(String(raw).trim().replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function rawTrendValue(t: SmFixtureTrend): unknown {
  const d = t.data
  if (d && typeof d === 'object' && 'value' in d) return (d as { value?: unknown }).value
  return t.value
}

function formatCell(raw: unknown, typeKey: string): string {
  const s = typeof raw === 'string' ? raw.trim() : ''
  if (s && Number.isNaN(Number(s))) return s.length > 24 ? `${s.slice(0, 22)}…` : s

  const n = parseNumeric(raw)
  if (n == null) return '—'

  const k = typeKey.toLowerCase()
  if (n > 0 && n <= 1 && (k.includes('prob') || k.includes('percent') || k.includes('pourcent'))) {
    return `${Math.round(n * 100)}%`
  }
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(2).replace('.', ',')
}

function participantIdOf(t: SmFixtureTrend): number | undefined {
  const a = t.participant_id
  if (typeof a === 'number' && Number.isFinite(a)) return a
  const b = t.participant?.id
  if (typeof b === 'number' && Number.isFinite(b)) return b
  return undefined
}

/**
 * Aplatit `fixture.trends` en lignes domicile / extérieur (clé = type de tendance).
 */
function trendsArrayFromFixture(fixture: SmFixture): SmFixtureTrend[] {
  const a = fixture.trends
  if (Array.isArray(a)) return a as SmFixtureTrend[]
  const alt = (fixture as Record<string, unknown>).Trends
  if (Array.isArray(alt)) return alt as SmFixtureTrend[]
  return []
}

export function extractFixtureTrendRowsFromSmFixture(fixture: SmFixture): FixtureTrendDisplayRow[] {
  const raw = trendsArrayFromFixture(fixture)
  if (!raw.length) return []

  const { homeId, awayId } = smFixtureHomeAwayParticipantIds(fixture)
  const byKey = new Map<
    string,
    { label: string; home?: unknown; away?: unknown; order: number }
  >()

  let order = 0
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const t = item as SmFixtureTrend
    const key = trendTypeKey(t)
    if (!key) continue
    const pid = participantIdOf(t)
    if (pid == null) continue
    const val = rawTrendValue(t)
    const label = trendLabel(t)

    let slot = byKey.get(key)
    if (!slot) {
      slot = { label, order: order++ }
      byKey.set(key, slot)
    } else if (slot.label.length < label.length) slot.label = label

    if (homeId != null && pid === homeId) slot.home = val
    else if (awayId != null && pid === awayId) slot.away = val
  }

  const rows: FixtureTrendDisplayRow[] = []
  for (const [key, v] of byKey) {
    rows.push({
      key,
      label: v.label,
      home: formatCell(v.home, key),
      away: formatCell(v.away, key),
    })
  }

  rows.sort((a, b) => {
    const ao = byKey.get(a.key)?.order ?? 0
    const bo = byKey.get(b.key)?.order ?? 0
    if (ao !== bo) return ao - bo
    return a.label.localeCompare(b.label, 'fr')
  })

  return rows
}

function formTrendLikelihood(t: SmFixtureTrend): number {
  const blob = `${t.type?.developer_name ?? ''} ${t.type?.name ?? ''}`.toLowerCase()
  let s = 0
  if (blob.includes('form')) s += 60
  if (blob.includes('last') && (blob.includes('5') || blob.includes('five'))) s += 40
  if (blob.includes('recent')) s += 25
  if (blob.includes('sequence') || blob.includes('streak')) s += 15
  if (blob.includes('5')) s += 10
  return s
}

/** Interprète une valeur API (ex. `WWDLW`, `W,W,D,L,W`, `["W","D",…]`). */
function parseFormResults(raw: unknown): FormResult[] {
  if (raw == null) return []
  if (Array.isArray(raw)) {
    const out: FormResult[] = []
    for (const x of raw) {
      out.push(...parseFormResults(x))
    }
    return out.length > 5 ? out.slice(-5) : out
  }
  if (typeof raw === 'object' && raw !== null && 'value' in raw) {
    return parseFormResults((raw as { value?: unknown }).value)
  }
  const s = String(raw).trim()
  if (!s) return []
  const tokens = s.split(/[,;\s|]+/).map((x) => x.trim()).filter(Boolean)
  const out: FormResult[] = []
  const pushOne = (ch: string) => {
    const u = ch.toUpperCase()
    if (u === 'W' || u === 'V') out.push('W')
    else if (u === 'D' || u === 'N' || u === 'T' || u === 'X') out.push('D')
    else if (u === 'L') out.push('L')
  }
  const pushWord = (tok: string) => {
    const u = tok.toUpperCase()
    if (u === 'WIN' || u === 'VICTORY') out.push('W')
    else if (u === 'DRAW' || u === 'TIE') out.push('D')
    else if (u === 'LOSS' || u === 'DEFEAT') out.push('L')
    else if (tok.length === 1) pushOne(tok)
    else for (const c of u.replace(/[^WVDNLTX]/gi, '')) pushOne(c)
  }
  for (const tok of tokens) pushWord(tok)
  return out.length > 5 ? out.slice(-5) : out
}

/**
 * Dernière forme (séquence V/N/D) par participant à partir de `fixture.trends`
 * (`include` : `trends.type;trends.participant`).
 */
export function extractSmRecentFormFromFixture(
  fixture: SmFixture | null | undefined,
): { home: FormResult[]; away: FormResult[] } | null {
  if (!fixture) return null
  const raw = trendsArrayFromFixture(fixture)
  if (!raw.length) return null
  const { homeId, awayId } = smFixtureHomeAwayParticipantIds(fixture)

  let bestHome: { letters: FormResult[]; score: number } | null = null
  let bestAway: { letters: FormResult[]; score: number } | null = null

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const t = item as SmFixtureTrend
    const pid = participantIdOf(t)
    if (pid == null) continue
    const letters = parseFormResults(rawTrendValue(t))
    if (letters.length < 2) continue
    const score = formTrendLikelihood(t)
    if (homeId != null && pid === homeId) {
      if (!bestHome || score > bestHome.score || (score === bestHome.score && letters.length > bestHome.letters.length)) {
        bestHome = { letters, score }
      }
    }
    if (awayId != null && pid === awayId) {
      if (!bestAway || score > bestAway.score || (score === bestAway.score && letters.length > bestAway.letters.length)) {
        bestAway = { letters, score }
      }
    }
  }

  const fallbackFor = (pid: number | undefined): FormResult[] => {
    if (pid == null) return []
    let longest: FormResult[] = []
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue
      const t = item as SmFixtureTrend
      if (participantIdOf(t) !== pid) continue
      const letters = parseFormResults(rawTrendValue(t))
      if (letters.length >= 2 && letters.length > longest.length) longest = letters
    }
    return longest
  }

  const homeOut = bestHome?.letters?.length ? bestHome.letters : fallbackFor(homeId)
  const awayOut = bestAway?.letters?.length ? bestAway.letters : fallbackFor(awayId)

  if (!homeOut.length && !awayOut.length) return null
  return { home: homeOut, away: awayOut }
}
