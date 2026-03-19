import type { Match } from '../types/match'
import { generateFixtures, SIM_NOW } from './fixtures'
import { teams } from './teams'

// Match fictif toujours en direct pour tester live + paris en conditions réelles
const DEMO_LIVE_MATCH: Match = {
  id: 'm-demo-live',
  competition: { id: 'ligue-1', name: 'Ligue 1', shortName: 'L1' },
  home: teams['ligue-1'].find((t) => t.id === 'psg') ?? teams['ligue-1'][0],
  away: teams['ligue-1'].find((t) => t.id === 'om') ?? teams['ligue-1'][1],
  kickoffAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  status: 'live',
  minute: 40,
  score: { home: 1, away: 0 },
}

// Seuil : pas de matchs avant le 18 mars (éviter surcharge)
const CUTOFF_DATE = new Date('2026-03-18T00:00:00').getTime()

const allMatches = [DEMO_LIVE_MATCH, ...generateFixtures()].filter(
  (m) => m.id === DEMO_LIVE_MATCH.id || new Date(m.kickoffAt).getTime() >= CUTOFF_DATE
)

// Fin mars uniquement
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000

// Affrontements à fort intérêt (classiques, derbies, grosses affiches)
const BIG_MATCHUPS = new Set([
  'psg-om', 'om-psg', 'psg-lyon', 'lyon-psg', 'monaco-om', 'om-monaco',
  'rma-fcb', 'fcb-rma', 'rma-atleti', 'atleti-rma', 'fcb-atleti', 'atleti-fcb',
  'mci-liv', 'liv-mci', 'ars-che', 'che-ars', 'mun-liv', 'liv-mun', 'ars-tot',
  'inter-juve', 'juve-inter', 'milan-napoli', 'napoli-milan', 'milan-inter', 'inter-milan',
  'bayern-bvb', 'bvb-bayern', 'leverkusen-bayern', 'bayern-leverkusen', 'leipzig-bvb',
])

// Équipes "stars" — matchs avec au moins une = un peu plus d’intérêt
const BIG_CLUBS = new Set(['psg', 'om', 'monaco', 'rma', 'fcb', 'atleti', 'mci', 'liv', 'ars', 'che', 'mun', 'inter', 'juve', 'milan', 'napoli', 'bayern', 'bvb', 'leverkusen', 'leipzig'])

function interestScore(m: Match): number {
  const pair = `${m.home.id}-${m.away.id}`
  const isBigMatchup = BIG_MATCHUPS.has(pair) ? 200 : 0
  const isLive = m.status === 'live' ? 150 : 0
  const hasBigClubs = (BIG_CLUBS.has(m.home.id) ? 1 : 0) + (BIG_CLUBS.has(m.away.id) ? 1 : 0)
  const bigClubBonus = hasBigClubs === 2 ? 30 : hasBigClubs === 1 ? 10 : 0
  return isBigMatchup + isLive + bigClubBonus
}

function timePenalty(kickoffMs: number): number {
  const daysAhead = (kickoffMs - SIM_NOW) / (24 * 60 * 60 * 1000)
  if (daysAhead < 0) return 0 // déjà commencé ou terminé
  if (daysAhead <= 7) return 20 // cette semaine = ok
  if (daysAhead <= 14) return 10 // 2e semaine = ok
  return 0 // trop loin
}

// Les 10 matchs les plus intéressants — le demo live toujours en 1er
export const carouselMatches: Match[] = [
  DEMO_LIVE_MATCH,
  ...allMatches
    .filter((m) => m.id !== DEMO_LIVE_MATCH.id)
    .filter((m) => {
      const kickoff = new Date(m.kickoffAt).getTime()
      return kickoff >= SIM_NOW - 60_000 && kickoff <= SIM_NOW + ONE_WEEK
    })
    .sort((a, b) => {
    const scoreA = interestScore(a) + timePenalty(new Date(a.kickoffAt).getTime())
    const scoreB = interestScore(b) + timePenalty(new Date(b.kickoffAt).getTime())
    if (scoreB !== scoreA) return scoreB - scoreA
    return new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()
  })
  .slice(0, 9)
]

// Tous les matchs pour calendrier + routes
export const upcomingMatches: Match[] = allMatches
