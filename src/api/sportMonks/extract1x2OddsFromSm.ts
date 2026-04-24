import type { SmFixture, SmOdd } from './types'
import { SM_ODDS_1X2_MARKET_ID, sportMonksOddsBookmakerId } from './includes'

export type SmBookOdds1x2 = { home: number; draw: number; away: number }

export type Extract1x2OddsOpts = {
  /** Surcharge rare — par défaut = `sportMonksOddsBookmakerId()` (un seul bookmaker site-wide). */
  bookmakerId?: number
  marketId?: number
  /** Fixture SM (même objet que `odds`) : ids participants domicile / extérieur pour lire `odd.participants`. */
  fixture?: SmFixture | null
}

function parseDecimalOdd(raw: string | number | null | undefined): number | null {
  if (raw == null) return null
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim().replace(',', '.'))
  if (!Number.isFinite(n) || n < 1.01) return null
  return Math.round(n * 100) / 100
}

function oddNumericValue(o: SmOdd): number | null {
  const v = o.value ?? o.dp3 ?? null
  return parseDecimalOdd(v)
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** Identifiants participants SM (méta `home` / `away`) — alignés sur `odd.participants` (string). */
export function smHomeAwayParticipantIds(f: SmFixture | null | undefined): {
  home?: number
  away?: number
} {
  if (!f?.participants?.length) return {}
  let home: number | undefined
  let away: number | undefined
  for (const p of f.participants) {
    const loc = String(p.meta?.location ?? '').toLowerCase()
    if (loc === 'home' && typeof p.id === 'number') home = p.id
    if (loc === 'away' && typeof p.id === 'number') away = p.id
  }
  return { home, away }
}

function isFulltimeResultMarket(o: SmOdd, marketId: number): boolean {
  const mk = o.market_id ?? o.market?.id
  if (mk === marketId) return true
  const dev = String(o.market?.developer_name ?? '')
    .toUpperCase()
    .replace(/\s+/g, '_')
  return (
    dev === 'FULLTIME_RESULT' ||
    dev === 'FULL_TIME_RESULT' ||
    dev === 'MATCH_RESULT' ||
    dev === '3WAY_RESULT'
  )
}

function oddSideFromParticipants(
  participants: string | number | null | undefined,
  homePid?: number,
  awayPid?: number,
): 'home' | 'away' | null {
  if (participants === null || participants === undefined) return null
  const s = String(participants).trim()
  if (s === '' || s.toLowerCase() === 'null') return null
  const n = Number(s)
  if (!Number.isFinite(n)) return null
  if (homePid != null && n === homePid) return 'home'
  if (awayPid != null && n === awayPid) return 'away'
  return null
}

/**
 * Mappe libellés / noms SportMonks (1, X, 2, Home, Away, Domicile…) vers le triplet 1N2.
 */
function oddSideFromLabels(label: string | null | undefined, name: string | null | undefined): 'home' | 'draw' | 'away' | null {
  const raw = `${label ?? ''} ${name ?? ''}`.trim()
  if (!raw) return null
  const u = stripAccents(raw).toUpperCase().replace(/\s+/g, ' ').trim()

  if (u === '1' || u === 'H' || /^\s*1\s*$/.test(raw)) return 'home'
  if (u === '2' || u === 'A' || /^\s*2\s*$/.test(raw)) return 'away'
  if (u === 'X' || u === 'NUL' || u === 'DRAW' || u === 'TIE' || u === 'EGALITE' || u.includes('MATCH NUL')) {
    return 'draw'
  }
  if (/\bHOME\b/.test(u) || u === 'HOME' || u.startsWith('HOME ') || u === 'DOMICILE' || /\bDOMICILE\b/.test(u)) {
    return 'home'
  }
  if (/\bAWAY\b/.test(u) || u === 'AWAY' || u.startsWith('AWAY ') || u === 'EXTERIEUR' || /\bEXTERIEUR\b/.test(u)) {
    return 'away'
  }
  return null
}

function resolveSide(
  o: SmOdd,
  homePid: number | undefined,
  awayPid: number | undefined,
): 'home' | 'draw' | 'away' | null {
  const fromLabel = oddSideFromLabels(o.label ?? undefined, o.name ?? undefined)
  if (fromLabel) return fromLabel
  const fromPart = oddSideFromParticipants(o.participants, homePid, awayPid)
  if (fromPart) return fromPart
  return null
}

function collect1x2FromOdds(
  odds: SmOdd[],
  opts: {
    marketId: number
    bookmakerId: number
    homePid?: number
    awayPid?: number
  },
): SmBookOdds1x2 | null {
  let home: number | undefined
  let draw: number | undefined
  let away: number | undefined

  for (const o of odds) {
    if (o.stopped === true) continue
    if (!isFulltimeResultMarket(o, opts.marketId)) continue

    const bm = o.bookmaker_id ?? o.bookmaker?.id
    if (bm == null || bm !== opts.bookmakerId) continue

    const side = resolveSide(o, opts.homePid, opts.awayPid)
    if (!side) continue
    const v = oddNumericValue(o)
    if (v == null) continue
    if (side === 'home') home = v
    else if (side === 'draw') draw = v
    else away = v
  }

  if (home == null || draw == null || away == null) return null
  return { home, draw, away }
}

/**
 * Extrait le triplet **victoire domicile / nul / victoire extérieur** depuis `fixture.odds`.
 * Un seul bookmaker (défaut `sportMonksOddsBookmakerId()`, aligné sur le filtre `GET /rounds/…`).
 * Pas de mélange entre bookmakers.
 */
export function extract1x2OddsFromOddsList(
  odds: SmOdd[] | undefined,
  opts?: Extract1x2OddsOpts,
): SmBookOdds1x2 | null {
  if (!Array.isArray(odds) || !odds.length) return null

  const bookmakerId = opts?.bookmakerId ?? sportMonksOddsBookmakerId()
  const marketId = opts?.marketId ?? SM_ODDS_1X2_MARKET_ID
  const { home: homePid, away: awayPid } = smHomeAwayParticipantIds(opts?.fixture ?? undefined)

  return collect1x2FromOdds(odds, { marketId, bookmakerId, homePid, awayPid })
}
