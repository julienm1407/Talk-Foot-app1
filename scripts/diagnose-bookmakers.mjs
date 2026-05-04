#!/usr/bin/env node
/**
 * Diagnostic SportMonks: détecte quels bookmaker IDs renvoient des cotes 1N2.
 *
 * Exemples:
 *   node scripts/diagnose-bookmakers.mjs --round 372150 --bookmakers 2,8,14
 *   node scripts/diagnose-bookmakers.mjs --fixture 19427211 --bookmakers 2-20
 *   node scripts/diagnose-bookmakers.mjs --round 372150 --fixture 19427211
 *
 * Token lu depuis (ordre):
 *   1) --token <value>
 *   2) SPORTMONKS_TOKEN
 *   3) VITE_SPORTMONKS_TOKEN
 */

const API_BASE = 'https://api.sportmonks.com/v3/football'
const DEFAULT_INCLUDE_ROUND =
  'fixtures.odds.market;fixtures.odds.bookmaker;fixtures.participants;league.country'
const DEFAULT_INCLUDE_FIXTURE = 'odds.market;odds.bookmaker;participants;predictions.type'

function parseArgs(argv) {
  const out = new Map()
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) continue
    const key = a.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) {
      out.set(key, 'true')
      continue
    }
    out.set(key, next)
    i += 1
  }
  return out
}

function toPosInt(raw) {
  const n = Number(String(raw ?? '').trim())
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null
}

function parseBookmakerList(raw) {
  if (!raw || String(raw).trim() === '') {
    return [2, 8, 12, 14, 16, 18, 20, 24, 27, 29, 36, 52]
  }
  const s = String(raw).trim()
  if (s.includes('-')) {
    const [a, b] = s.split('-').map((x) => toPosInt(x))
    if (a && b && b >= a) {
      const arr = []
      for (let i = a; i <= b; i++) arr.push(i)
      return arr
    }
  }
  const uniq = new Set()
  for (const chunk of s.split(',')) {
    const n = toPosInt(chunk)
    if (n) uniq.add(n)
  }
  return [...uniq]
}

function normalize(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
}

function oddsSide(o, homePid, awayPid) {
  const label = normalize(`${o?.label ?? ''} ${o?.name ?? ''}`)
  if (label === '1' || label === 'HOME' || label.includes('DOMICILE')) return 'home'
  if (label === 'X' || label === 'DRAW' || label.includes('NUL')) return 'draw'
  if (label === '2' || label === 'AWAY' || label.includes('EXTERIEUR')) return 'away'
  const p = Number(o?.participants)
  if (Number.isFinite(p)) {
    if (homePid != null && p === homePid) return 'home'
    if (awayPid != null && p === awayPid) return 'away'
  }
  return null
}

function pickHomeAwayPids(fixture) {
  const parts = Array.isArray(fixture?.participants) ? fixture.participants : []
  let homePid
  let awayPid
  for (const p of parts) {
    const loc = String(p?.meta?.location ?? '').toLowerCase()
    if (loc === 'home' && typeof p?.id === 'number') homePid = p.id
    if (loc === 'away' && typeof p?.id === 'number') awayPid = p.id
  }
  return { homePid, awayPid }
}

function hasFull1x2Triplet(odds, fixture, bookmakerId) {
  if (!Array.isArray(odds) || odds.length === 0) return false
  const { homePid, awayPid } = pickHomeAwayPids(fixture)
  let h = false
  let d = false
  let a = false
  for (const o of odds) {
    if (o?.stopped === true) continue
    const bm = o?.bookmaker_id ?? o?.bookmaker?.id
    if (bm !== bookmakerId) continue
    const mk = o?.market_id ?? o?.market?.id
    const dev = normalize(o?.market?.developer_name)
    if (!(mk === 1 || dev.includes('RESULT'))) continue
    const side = oddsSide(o, homePid, awayPid)
    const val = Number(String(o?.value ?? o?.dp3 ?? '').replace(',', '.'))
    if (!Number.isFinite(val) || val < 1.01) continue
    if (side === 'home') h = true
    if (side === 'draw') d = true
    if (side === 'away') a = true
  }
  return h && d && a
}

async function fetchSm(path, token, search = {}) {
  const u = new URL(`${API_BASE}${path}`)
  for (const [k, v] of Object.entries(search)) {
    if (v != null && v !== '') u.searchParams.set(k, String(v))
  }
  if (!u.searchParams.has('timezone')) u.searchParams.set('timezone', 'Europe/Paris')
  const res = await fetch(u.toString(), { headers: { Authorization: token } })
  const txt = await res.text()
  let body
  try {
    body = JSON.parse(txt)
  } catch {
    throw new Error(`HTTP ${res.status} non JSON: ${txt.slice(0, 140)}`)
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${String(body?.message ?? txt).slice(0, 200)}`)
  }
  return body
}

async function diagnoseRound(roundId, token, bookmakerIds) {
  const out = []
  for (const bm of bookmakerIds) {
    const json = await fetchSm(`/rounds/${roundId}`, token, {
      include: DEFAULT_INCLUDE_ROUND,
      filters: `markets:1;bookmakers:${bm}`,
    })
    const round = json?.data ?? {}
    const fixtures = Array.isArray(round?.fixtures) ? round.fixtures : []
    let withAnyOdds = 0
    let withTriplet = 0
    for (const f of fixtures) {
      const odds = Array.isArray(f?.odds) ? f.odds : []
      if (odds.length) withAnyOdds += 1
      if (hasFull1x2Triplet(odds, f, bm)) withTriplet += 1
    }
    out.push({ bookmakerId: bm, fixtures: fixtures.length, withAnyOdds, withTriplet })
  }
  return out
}

async function diagnoseFixture(fixtureId, token, bookmakerIds) {
  const out = []
  const json = await fetchSm(`/fixtures/${fixtureId}`, token, {
    include: DEFAULT_INCLUDE_FIXTURE,
  })
  const fixture = json?.data ?? null
  const odds = Array.isArray(fixture?.odds) ? fixture.odds : []
  for (const bm of bookmakerIds) {
    out.push({
      bookmakerId: bm,
      withAnyOdds: odds.some((o) => (o?.bookmaker_id ?? o?.bookmaker?.id) === bm),
      withTriplet: hasFull1x2Triplet(odds, fixture, bm),
    })
  }
  const predictionsCount = Array.isArray(fixture?.predictions) ? fixture.predictions.length : 0
  return { rows: out, predictionsCount }
}

function printRound(rows) {
  console.log('\nRound diagnostics (markets:1 + bookmaker):')
  console.table(rows)
  const winners = rows.filter((r) => r.withTriplet > 0).map((r) => r.bookmakerId)
  console.log(
    winners.length
      ? `Bookmakers avec triplet 1N2: ${winners.join(', ')}`
      : 'Aucun bookmaker testé ne renvoie un triplet 1N2 complet sur ce round.',
  )
}

function printFixture(res) {
  console.log('\nFixture diagnostics (odds présents sur /fixtures/{id}):')
  console.table(res.rows)
  const winners = res.rows.filter((r) => r.withTriplet).map((r) => r.bookmakerId)
  console.log(
    winners.length
      ? `Bookmakers avec triplet 1N2: ${winners.join(', ')}`
      : 'Aucun bookmaker testé ne renvoie un triplet 1N2 complet sur cette fixture.',
  )
  console.log(`predictions.type rows: ${res.predictionsCount}`)
}

async function main() {
  const args = parseArgs(process.argv)
  const roundId = toPosInt(args.get('round'))
  const fixtureId = toPosInt(args.get('fixture'))
  const bookmakerIds = parseBookmakerList(args.get('bookmakers'))
  const token = args.get('token') || process.env.SPORTMONKS_TOKEN || process.env.VITE_SPORTMONKS_TOKEN

  if (!token) {
    throw new Error('Token manquant. Passe --token ou définis SPORTMONKS_TOKEN / VITE_SPORTMONKS_TOKEN.')
  }
  if (!roundId && !fixtureId) {
    throw new Error('Passe au moins --round <id> ou --fixture <id>.')
  }
  if (bookmakerIds.length === 0) {
    throw new Error('Liste bookmakers vide. Ex: --bookmakers 2,8,14 ou 2-20')
  }

  console.log(`Bookmakers testés: ${bookmakerIds.join(', ')}`)
  if (roundId) {
    console.log(`Round: ${roundId}`)
    const roundRows = await diagnoseRound(roundId, token, bookmakerIds)
    printRound(roundRows)
  }
  if (fixtureId) {
    console.log(`Fixture: ${fixtureId}`)
    const fixtureRows = await diagnoseFixture(fixtureId, token, bookmakerIds)
    printFixture(fixtureRows)
  }
}

main().catch((err) => {
  console.error('\nDiagnostic échoué:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
