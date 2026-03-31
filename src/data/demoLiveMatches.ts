import type { Match } from '../types/match'
import { teams } from './teams'

function kickoffToday(h: number, min: number) {
  const d = new Date()
  d.setHours(h, min, 0, 0)
  return d.toISOString()
}

const epl = teams.epl
const laliga = teams.laliga

const mci = epl.find((t) => t.id === 'mci')!
const liv = epl.find((t) => t.id === 'liv')!
const rma = laliga.find((t) => t.id === 'rma')!
const fcb = laliga.find((t) => t.id === 'fcb')!

/**
 * Matchs live fictifs (sans clé API) pour densifier l’agenda.
 * Le match référence Rennes–PSG reste `REPLAY_LIVE_ID` / `FALLBACK_LIVE_MATCH` (pas de doublon sens inverse ici).
 */
export const DEMO_EXTRA_LIVE_MATCHES: Match[] = [
  {
    id: 'm-demo-live-mci-liv',
    competition: { id: 'epl', name: 'Premier League', shortName: 'EPL' },
    home: mci,
    away: liv,
    kickoffAt: kickoffToday(18, 30),
    status: 'live',
    minute: 24,
    score: { home: 1, away: 1 },
  },
  {
    id: 'm-demo-live-elclasico',
    competition: { id: 'laliga', name: 'La Liga', shortName: 'LL' },
    home: rma,
    away: fcb,
    kickoffAt: kickoffToday(21, 0),
    status: 'live',
    minute: 12,
    score: { home: 0, away: 0 },
  },
]
