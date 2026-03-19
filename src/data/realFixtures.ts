/**
 * Simulation réaliste : vrais matchs des 5 grands championnats européens (D1)
 * Dates et heures basées sur les calendriers officiels Ligue 1, La Liga, EPL, Serie A, Bundesliga
 */
import type { Match } from '../types/match'
import { teams, teamColors } from './teams'

const COMP_NAMES: Record<string, { name: string; shortName: string }> = {
  'ligue-1': { name: 'Ligue 1', shortName: 'L1' },
  laliga: { name: 'LaLiga', shortName: 'LL' },
  epl: { name: 'Premier League', shortName: 'EPL' },
  'serie-a': { name: 'Serie A', shortName: 'SA' },
  bund: { name: 'Bundesliga', shortName: 'BUN' },
}

function matchId(compId: string, homeId: string, awayId: string, ts: number): string {
  return `m-${compId}-${homeId}-${awayId}-${ts}`
}

function getTeam(compId: keyof typeof teams, id: string) {
  const arr = teams[compId]
  const t = arr?.find((x) => x.id === id)
  if (t) return { ...t }
  const [primary, secondary] = teamColors[id] ?? ['#111827', '#f9fafb']
  return { id, name: id, shortName: id.slice(0, 3).toUpperCase(), colors: { primary, secondary } }
}

// Créneaux horaires réalistes par ligue (heure locale)
// L1: Ven 21h, Sam 17h/21h05, Dim 15h/17h15/20h45
// LaLiga: Ven 21h, Sam 16h/18h30/21h, Dim 14h/16h15/18h30/21h
// EPL: Sam 13h30/16h/18h30, Dim 15h/17h30, Lun 21h
// Serie A: Sam 18h/20h45, Dim 12h30/15h/18h/20h45
// Bundesliga: Ven 20h30, Sam 15h30/18h30, Dim 15h30/17h30

/** Génère les prochaines dates de weekend à partir de aujourd'hui */
function buildWeekendSlots(now: Date): Array<{ date: Date; hour: number; min: number }> {
  const slots: Array<{ date: Date; hour: number; min: number }> = []

  // Trouver le prochain vendredi
  const dayOfWeek = now.getDay()
  let daysToFri = (5 - dayOfWeek + 7) % 7
  if (daysToFri === 0 && now.getHours() >= 20) daysToFri = 7

  for (let w = 0; w < 4; w++) {
    const baseFri = new Date(now)
    baseFri.setDate(baseFri.getDate() + daysToFri + w * 7)
    baseFri.setHours(0, 0, 0, 0)

    const sat = new Date(baseFri)
    sat.setDate(sat.getDate() + 1)
    const sun = new Date(baseFri)
    sun.setDate(sun.getDate() + 2)

    slots.push({ date: baseFri, hour: 21, min: 0 })
    slots.push({ date: sat, hour: 17, min: 0 })
    slots.push({ date: sat, hour: 21, min: 5 })
    slots.push({ date: sun, hour: 15, min: 0 })
    slots.push({ date: sun, hour: 17, min: 15 })
    slots.push({ date: sun, hour: 20, min: 45 })
  }
  return slots
}

// Vrais matchs par ligue (paires homeId–awayId, saison 2025-26)
// Ligue 1 — J25-28 (mars–avril 2026)
const L1_FIXTURES: [string, string][] = [
  ['psg', 'monaco'],
  ['nantes', 'angers'],
  ['auxerre', 'strasbourg'],
  ['toulouse', 'om'],
  ['lens', 'metz'],
  ['brest', 'lehavre'],
  ['nice', 'rennes'],
  ['lyon', 'parisfc'],
  ['lille', 'lorient'],
  ['lens', 'angers'],
  ['toulouse', 'lorient'],
  ['auxerre', 'brest'],
  ['nice', 'psg'],
  ['lyon', 'monaco'],
  ['rennes', 'metz'],
  ['parisfc', 'lehavre'],
  ['om', 'lille'],
  ['nantes', 'strasbourg'],
  ['psg', 'toulouse'],
  ['strasbourg', 'nice'],
  ['brest', 'rennes'],
  ['lille', 'lens'],
  ['angers', 'lyon'],
  ['metz', 'nantes'],
  ['lehavre', 'auxerre'],
  ['lorient', 'parisfc'],
  ['monaco', 'om'],
]

// La Liga
const LL_FIXTURES: [string, string][] = [
  ['rma', 'fcb'],
  ['atleti', 'sevilla'],
  ['sociedad', 'betis'],
  ['villarreal', 'bilbao'],
  ['valencia', 'girona'],
  ['getafe', 'osasuna'],
  ['mallorca', 'alaves'],
  ['celta', 'rayo'],
  ['rma', 'atleti'],
  ['fcb', 'sociedad'],
  ['sevilla', 'valencia'],
  ['betis', 'villarreal'],
  ['bilbao', 'getafe'],
  ['girona', 'mallorca'],
  ['rma', 'betis'],
  ['fcb', 'atleti'],
  ['sevilla', 'bilbao'],
]

// EPL
const EPL_FIXTURES: [string, string][] = [
  ['mci', 'liv'],
  ['ars', 'che'],
  ['mun', 'tot'],
  ['new', 'avl'],
  ['whu', 'bha'],
  ['brentford', 'palace'],
  ['fulham', 'wolves'],
  ['bournemouth', 'forest'],
  ['saints', 'leicester'],
  ['everton', 'ipswich'],
  ['mci', 'ars'],
  ['liv', 'mun'],
  ['che', 'tot'],
  ['avl', 'whu'],
  ['mci', 'che'],
  ['ars', 'liv'],
  ['mun', 'avl'],
]

// Serie A
const SA_FIXTURES: [string, string][] = [
  ['inter', 'juve'],
  ['milan', 'napoli'],
  ['roma', 'lazio'],
  ['atalanta', 'fiorentina'],
  ['torino', 'bologna'],
  ['genoa', 'udinese'],
  ['monza', 'lecce'],
  ['empoli', 'cagliari'],
  ['inter', 'milan'],
  ['juve', 'roma'],
  ['napoli', 'atalanta'],
  ['lazio', 'fiorentina'],
  ['inter', 'napoli'],
  ['milan', 'juve'],
  ['roma', 'atalanta'],
]

// Bundesliga
const BUN_FIXTURES: [string, string][] = [
  ['bayern', 'bvb'],
  ['leverkusen', 'leipzig'],
  ['wolfsburg', 'freiburg'],
  ['frankfurt', 'union'],
  ['stuttgart', 'augsburg'],
  ['mainz', 'bremen'],
  ['bochum', 'heidenheim'],
  ['bayern', 'leverkusen'],
  ['bvb', 'leipzig'],
  ['freiburg', 'frankfurt'],
  ['union', 'stuttgart'],
  ['bayern', 'frankfurt'],
  ['bvb', 'leverkusen'],
  ['leipzig', 'union'],
  ['stuttgart', 'bayern'],
]

type FixtureDef = { compId: keyof typeof teams; fixtures: [string, string][] }
const ALL_FIXTURES: FixtureDef[] = [
  { compId: 'ligue-1', fixtures: L1_FIXTURES },
  { compId: 'laliga', fixtures: LL_FIXTURES },
  { compId: 'epl', fixtures: EPL_FIXTURES },
  { compId: 'serie-a', fixtures: SA_FIXTURES },
  { compId: 'bund', fixtures: BUN_FIXTURES },
]

/**
 * Génère une simulation réaliste avec vrais matchs et vrais créneaux horaires.
 * Les dates sont calculées à partir de "maintenant" pour avoir toujours des matchs à venir.
 */
export function generateRealFixtures(simNowMs?: number): Match[] {
  const now = simNowMs != null ? new Date(simNowMs) : new Date()
  const slots = buildWeekendSlots(now)
  const matches: Match[] = []
  let slotIdx = 0

  for (const { compId, fixtures } of ALL_FIXTURES) {
    const comp = COMP_NAMES[compId]

    for (const [homeId, awayId] of fixtures) {
      const home = getTeam(compId, homeId)
      const away = getTeam(compId, awayId)
      if (!home.colors || !away.colors) continue

      const slot = slots[slotIdx % slots.length]
      const kickoff = new Date(slot.date)
      kickoff.setHours(slot.hour, slot.min, 0, 0)
      const kickoffMs = kickoff.getTime()
      const id = matchId(compId, homeId, awayId, kickoffMs)

      const durationMs = 105 * 60 * 1000
      let status: 'upcoming' | 'live' | 'finished' = 'upcoming'
      let minute: number | undefined
      let score: { home: number; away: number } | undefined

      const nowMs = now.getTime()
      if (nowMs > kickoffMs + durationMs) {
        status = 'finished'
        const seed = (id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) | 0)
        score = {
          home: (seed % 4),
          away: ((seed + 1) % 4),
        }
      } else if (nowMs >= kickoffMs && nowMs < kickoffMs + durationMs) {
        status = 'live'
        minute = Math.min(99, Math.max(1, Math.floor((nowMs - kickoffMs) / 60000)))
        const progress = Math.min(1, (nowMs - kickoffMs) / (90 * 60 * 1000))
        const seed = (id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) | 0)
        const finalHome = (seed % 4)
        const finalAway = ((seed + 1) % 4)
        score = {
          home: minute >= 90 ? finalHome : Math.min(finalHome, Math.floor(progress * 3)),
          away: minute >= 90 ? finalAway : Math.min(finalAway, Math.floor(progress * 2.5)),
        }
      }

      matches.push({
        id,
        competition: { id: compId, name: comp.name, shortName: comp.shortName },
        home,
        away,
        kickoffAt: new Date(kickoffMs).toISOString(),
        status,
        ...(minute != null && { minute }),
        ...(score != null && { score }),
      })
      slotIdx++
    }
  }

  return matches.sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
}
