import type { Match } from '../types/match'
import { teams } from './teams'

const COMP_IDS = ['ligue-1', 'laliga', 'epl', 'serie-a', 'bund'] as const
const COMP_NAMES: Record<string, { name: string; shortName: string }> = {
  'ligue-1': { name: 'Ligue 1', shortName: 'L1' },
  laliga: { name: 'LaLiga', shortName: 'LL' },
  epl: { name: 'Premier League', shortName: 'EPL' },
  'serie-a': { name: 'Serie A', shortName: 'SA' },
  bund: { name: 'Bundesliga', shortName: 'BUN' },
}

// Seed for deterministic "random" scores (based on match id hash)
function seededScore(seed: number): number {
  return ((seed * 1103515245 + 12345) >>> 0) % 4
}

function matchId(compId: string, homeId: string, awayId: string, date: string): string {
  return `m-${compId}-${homeId}-${awayId}-${date.replace(/-/g, '')}`
}

// Célèbres affiches par ligue (affichées en priorité)
const FEATURED: Array<[string, string, string]> = [
  ['ligue-1', 'psg', 'om'],
  ['ligue-1', 'monaco', 'lyon'],
  ['laliga', 'rma', 'fcb'],
  ['laliga', 'atleti', 'sevilla'],
  ['epl', 'mci', 'liv'],
  ['epl', 'ars', 'che'],
  ['serie-a', 'inter', 'juve'],
  ['serie-a', 'milan', 'napoli'],
  ['bund', 'bayern', 'bvb'],
  ['bund', 'leverkusen', 'leipzig'],
]

// Génère des paires variées pour une journée (évite doublons)
function matchdayPairs<T extends { id: string }>(arr: T[], md: number): [T, T][] {
  const out: [T, T][] = []
  const n = arr.length
  for (let i = 0; i < 5; i++) {
    const a = (md * 3 + i) % n
    let b = (a + 1 + (i % 2)) % n
    if (a === b) b = (b + 1) % n
    const tA = arr[a]
    const tB = arr[b]
    if (tA && tB) out.push([tA, tB])
  }
  return out
}

// Créneaux à partir du 18 mars 2026 — éviter surcharge (pas de matchs avant le 18)
function buildSlots(): string[] {
  const out: string[] = []
  const add = (y: number, m: number, d: number, h: number) =>
    out.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:00:00`)
  // Midweek: mer 18 mars
  add(2026, 3, 18, 21)
  // J28: sam 21 + dim 22 mars
  add(2026, 3, 21, 21)
  add(2026, 3, 22, 15)
  add(2026, 3, 22, 17)
  // J29: sam 28 + dim 29 mars
  add(2026, 3, 28, 21)
  add(2026, 3, 29, 15)
  add(2026, 3, 29, 17)
  return out.sort()
}

const SLOTS = buildSlots()

// "Maintenant" pour la simu : dimanche 22 mars 2026 16h (matchday en cours)
export const SIM_NOW = new Date('2026-03-22T16:00:00').getTime()

export function generateFixtures(simNowMs?: number): Match[] {
  const now = simNowMs ?? SIM_NOW
  const matches: Match[] = []
  let slotIdx = 0

  for (const compId of COMP_IDS) {
    const compTeams = teams[compId]
    const comp = COMP_NAMES[compId]
    const byId = Object.fromEntries(compTeams.map((t) => [t.id, t]))

    for (let md = 0; md < 4; md++) {
      const pairsThisDay = matchdayPairs([...compTeams], md)
      for (const [home, away] of pairsThisDay) {
        const slot = SLOTS[slotIdx % SLOTS.length]
        slotIdx++
        const kickoff = new Date(slot).getTime()
        const dateStr = slot.slice(0, 10)
        const id = matchId(compId, home.id, away.id, dateStr)

        const seed = (id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + md) | 0
        const homeGoals = seededScore(seed)
        const awayGoals = seededScore(seed + 1)
        const durationMs = 105 * 60 * 1000

        let status: 'upcoming' | 'live' | 'finished' = 'upcoming'
        let minute: number | undefined
        let score: { home: number; away: number } | undefined

        // Simuler uniquement les matchs du dimanche 22 mars ; le reste reste en pré-match
        const isMarch22 = dateStr === '2026-03-22'
        if (isMarch22) {
          if (now > kickoff + durationMs) {
            status = 'finished'
            score = { home: homeGoals, away: awayGoals }
          } else if (now >= kickoff && now < kickoff + durationMs) {
            status = 'live'
            const elapsed = Math.floor((now - kickoff) / 60000)
            minute = Math.min(99, Math.max(1, elapsed))
            const progress = Math.min(1, elapsed / 90)
            score = {
              home: progress >= 0.99 ? homeGoals : Math.min(homeGoals, Math.floor(homeGoals * progress * 1.3)),
              away: progress >= 0.99 ? awayGoals : Math.min(awayGoals, Math.floor(awayGoals * progress * 1.3)),
            }
            if (minute >= 90) score = { home: homeGoals, away: awayGoals }
          }
        }

        matches.push({
          id,
          competition: { id: compId, name: comp.name, shortName: comp.shortName },
          home: { ...home },
          away: { ...away },
          kickoffAt: new Date(kickoff).toISOString(),
          status,
          ...(minute != null && { minute }),
          ...(score != null && { score }),
        })
      }
    }

    // Ajouter affiches célèbres si pas déjà présentes
    for (const [cid, hid, aid] of FEATURED) {
      if (cid !== compId) continue
      const home = byId[hid]
      const away = byId[aid]
      if (!home || !away) continue
      const exists = matches.some((m) => m.home.id === hid && m.away.id === aid)
      if (exists) continue
      const slot = SLOTS[slotIdx % SLOTS.length]
      slotIdx++
      const kickoff = new Date(slot).getTime()
      const dateStr = slot.slice(0, 10)
      const id = matchId(compId, home.id, away.id, dateStr)
      const seed = (id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) | 0
      const homeGoals = seededScore(seed)
      const awayGoals = seededScore(seed + 1)
      const durationMs = 105 * 60 * 1000
      const dateStrFeatured = slot.slice(0, 10)
      let status: 'upcoming' | 'live' | 'finished' = 'upcoming'
      let minute: number | undefined
      let score: { home: number; away: number } | undefined
      const isMarch22Featured = dateStrFeatured === '2026-03-22'
      if (isMarch22Featured) {
        if (now > kickoff + durationMs) {
          status = 'finished'
          score = { home: homeGoals, away: awayGoals }
        } else if (now >= kickoff && now < kickoff + durationMs) {
          status = 'live'
          const elapsed = Math.floor((now - kickoff) / 60000)
          minute = Math.min(99, Math.max(1, elapsed))
          score = elapsed >= 90 ? { home: homeGoals, away: awayGoals } : { home: Math.min(homeGoals, Math.floor(elapsed / 25)), away: Math.min(awayGoals, Math.floor(elapsed / 30)) }
        }
      }
      matches.push({
        id,
        competition: { id: compId, name: comp.name, shortName: comp.shortName },
        home: { ...home },
        away: { ...away },
        kickoffAt: new Date(kickoff).toISOString(),
        status,
        ...(minute != null && { minute }),
        ...(score != null && { score }),
      })
    }
  }

  return matches.sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
}
