/**
 * Audit cotes prematch — détecte favori inversé ou cotes aberrantes.
 * Usage: npx tsx scripts/audit-prematch-odds.mjs
 */
import { ALL_CLUBS_CATALOG } from '../src/data/allClubsCatalog.ts'
import { standingsByLeague, BIG_FIVE_LEAGUE_IDS } from '../src/data/leagueStandings.ts'
import {
  buildMatchOddsContext,
  buildOddsStandingsPool,
  computePrematch1x2ForMatch,
  findStandingForTeam,
} from '../src/odds/buildTeamOddsInput.ts'
import { teamPowerScore } from '../src/odds/internalOddsEngine.ts'

function mkMatch(homeId, awayId, compId = 'ligue-1') {
  const home = ALL_CLUBS_CATALOG.find((c) => c.id === homeId)
  const away = ALL_CLUBS_CATALOG.find((c) => c.id === awayId)
  return {
    id: `audit-${homeId}-${awayId}`,
    competition: { id: compId, name: compId, shortName: compId },
    home: {
      id: homeId,
      name: home?.name ?? homeId,
      shortName: home?.shortName ?? homeId,
      colors: { primary: '#111', secondary: '#fff' },
    },
    away: {
      id: awayId,
      name: away?.name ?? awayId,
      shortName: away?.shortName ?? awayId,
      colors: { primary: '#111', secondary: '#fff' },
    },
    kickoffAt: new Date().toISOString(),
    status: 'upcoming',
  }
}

function oddsFor(homeId, awayId, compId, smRows = []) {
  const match = mkMatch(homeId, awayId, compId)
  const pool = buildOddsStandingsPool(match, smRows)
  const homeRow = findStandingForTeam(pool, { teamId: homeId, name: match.home.name })
  const awayRow = findStandingForTeam(pool, { teamId: awayId, name: match.away.name })
  const ctx = buildMatchOddsContext(homeRow, awayRow, homeId, awayId, {
    leagueSize: Math.max(pool.length, 18),
    standingsRows: pool,
  })
  const hp = teamPowerScore(ctx.home.factors, ctx.home.absenceFactor ?? 1)
  const ap = teamPowerScore(ctx.away.factors, ctx.away.absenceFactor ?? 1)
  const { odds1x2 } = computePrematch1x2ForMatch(match, smRows)
  return { odds1x2, hp, ap, poolSize: pool.length }
}

const ELITE = [
  'psg', 'mci', 'liv', 'ars', 'bayern', 'leverkusen', 'rma', 'fcb', 'inter', 'juve',
]
const MINNOWS = ['elversberg', 'parisfc', 'lemans', 'troyes', 'lehavre', 'angers', 'auxerre']

const issues = []

function check(label, homeId, awayId, compId, smRows, expectFav) {
  const { odds1x2, hp, ap } = oddsFor(homeId, awayId, compId, smRows)
  const favSide =
    odds1x2.home <= odds1x2.away && odds1x2.home <= odds1x2.draw
      ? 'home'
      : odds1x2.away <= odds1x2.home && odds1x2.away <= odds1x2.draw
        ? 'away'
        : 'draw'
  const favOdd = Math.min(odds1x2.home, odds1x2.away)
  const dogOdd = Math.max(odds1x2.home, odds1x2.away)
  const powerFavHome = hp > ap + 3.5
  const powerFavAway = ap > hp + 3.5

  if (expectFav && favSide !== expectFav) {
    issues.push({ label, type: 'inverted-favorite', homeId, awayId, odds1x2, hp, ap, expectFav, favSide })
  }
  if (powerFavHome && favSide === 'away' && dogOdd < 3.5) {
    issues.push({ label, type: 'power-vs-market-home', homeId, awayId, odds1x2, hp, ap })
  }
  if (powerFavAway && favSide === 'home' && dogOdd < 3.5) {
    issues.push({ label, type: 'power-vs-market-away', homeId, awayId, odds1x2, hp, ap })
  }
  if (favOdd < 1.2 && dogOdd < 4) {
    issues.push({ label, type: 'flat-market', homeId, awayId, odds1x2 })
  }
  if (dogOdd > 10 && favOdd > 1.55) {
    issues.push({ label, type: 'extreme-dog-with-mild-fav', homeId, awayId, odds1x2 })
  }
  if (Math.max(odds1x2.home, odds1x2.away, odds1x2.draw) > 12) {
    issues.push({ label, type: 'odds-too-high', homeId, awayId, odds1x2 })
  }
}

// Coupes / SM vide — elite vs minnow
for (const elite of ELITE) {
  for (const minnow of MINNOWS) {
    check(`cup ${minnow}-home vs ${elite}`, minnow, elite, 'dfb-pokal', [], 'away')
    check(`cup ${elite}-home vs ${minnow}`, elite, minnow, 'coupe-fr', [], 'home')
  }
}

// Big 5 — 1er vs dernier du mock (SM vide → pool statique)
for (const league of BIG_FIVE_LEAGUE_IDS) {
  const rows = standingsByLeague[league] ?? []
  if (rows.length < 2) continue
  const top = rows[0].teamId
  const bottom = rows[rows.length - 1].teamId
  check(`${league} top home vs bottom`, top, bottom, league, [], 'home')
  check(`${league} bottom home vs top`, bottom, top, league, [], 'away')
}

// Tous les clubs du catalogue : chaque club vs le leader de sa ligue (SM vide)
for (const league of BIG_FIVE_LEAGUE_IDS) {
  const rows = standingsByLeague[league] ?? []
  const top = rows[0]?.teamId
  if (!top) continue
  const leagueClubs = ALL_CLUBS_CATALOG.filter((c) => c.leagueId === league)
  for (const club of leagueClubs) {
    if (club.id === top) continue
    check(`${league} ${top} @ ${club.id}`, club.id, top, league, [], 'away')
    check(`${league} ${club.id} @ ${top}`, top, club.id, league, [], 'home')
  }
}

// Matchs clés signalés par l'utilisateur
const pairs = [
  ['lille', 'psg'],
  ['strasbourg', 'lens'],
  ['lehavre', 'lyon'],
  ['elversberg', 'leverkusen'],
  ['angers', 'lille'],
  ['parisfc', 'psg'],
  ['getafe', 'rma'],
  ['bochum', 'bayern'],
  ['montpellier', 'psg'],
  ['nantes', 'mci'],
  ['auxerre', 'monaco'],
]
for (const [h, a] of pairs) {
  const club = ALL_CLUBS_CATALOG.find((c) => c.id === h)
  const comp = club?.leagueId ?? 'ligue-1'
  check(`${h} vs ${a} (${comp})`, h, a, comp, [], null)
}

console.log(`Audit: ${issues.length} issue(s)`)
if (issues.length) {
  for (const i of issues.slice(0, 50)) {
    console.log(JSON.stringify(i))
  }
  process.exit(1)
}
console.log('OK — no aberrant prematch odds in audit set')
