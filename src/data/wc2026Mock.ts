/**
 * Mock data — Coupe du Monde 2026 (USA · Canada · Mexique).
 *
 * Structure conforme à `WcDataset` (cf. `src/types/wc2026.ts`).
 * À remplacer par les vrais fetchers via `src/api/wc2026/` dès que l'API
 * sera fournie. Tous les composants UI consomment uniquement le contrat
 * `WcDataset` — la bascule sera transparente.
 *
 * NB : le format 2026 = 48 nations, 12 poules de 4, qualifient 1ers + 2es +
 * 8 meilleurs 3es → 32 équipes en seizièmes (R32).
 *
 * Toutes les dates sont en UTC. Les heures sont indicatives — le vrai
 * tirage et le calendrier officiel viendront de l'API.
 */

import { NATIONS, type Nation } from './nations'
import type {
  WcBracket,
  WcBracketSlot,
  WcDataset,
  WcGroup,
  WcGroupId,
  WcMatch,
  WcStandingRow,
  WcSquad,
  WcTopAssisterRow,
  WcTopScorerRow,
  WcTournamentStats,
  WcVenue,
} from '../types/wc2026'

// ────────────────────────── HELPERS ──────────────────────────

const GROUP_IDS: WcGroupId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

function emptyStanding(iso: string, rank: number): WcStandingRow {
  return {
    iso,
    rank,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
    form: '',
    qualificationState: 'in-contention',
  }
}

// ────────────────────────── NATIONS PARTICIPANTES ──────────────────────────

/**
 * Catalogue complet des 48 sélections qualifiées pour le Mondial 2026 (USA ·
 * Canada · Mexique).
 */
export const WC_NATIONS: Nation[] = NATIONS

// ────────────────────────── GROUPES (TIRAGE PLACEHOLDER) ──────────────────────────

/**
 * Tirage placeholder : on répartit nos 48 nations dans les 12 poules de 4
 * pour montrer la mécanique. Le vrai tirage du Mondial 2026 a lieu en
 * décembre 2025 — les compositions seront remplacées par l'API officielle.
 */
const TIRAGE_PLACEHOLDER: WcGroupId[] = GROUP_IDS

const isoOrder = WC_NATIONS.map((n) => n.iso)

export const WC_GROUPS: WcGroup[] = TIRAGE_PLACEHOLDER.map((id, idx) => {
  const start = idx * 4
  const teamIsos = isoOrder.slice(start, start + 4)
  // Si jamais le catalogue passe sous 48 (édition future), on bouche avec « TBD »
  while (teamIsos.length < 4) teamIsos.push('TBD')
  return {
    id,
    teams: teamIsos.map((iso, i) => ({ iso, drawPos: (i + 1) as 1 | 2 | 3 | 4 })),
  }
})

export const WC_STANDINGS: Record<WcGroupId, WcStandingRow[]> = WC_GROUPS.reduce(
  (acc, g) => {
    acc[g.id] = g.teams.map((t, i) => emptyStanding(t.iso, i + 1))
    return acc
  },
  {} as Record<WcGroupId, WcStandingRow[]>,
)

// ────────────────────────── STADES (16 villes hôtes) ──────────────────────────

/**
 * 16 stades officiels — 11 USA, 3 Mexique, 2 Canada.
 * Capacités approximatives FIFA 2026.
 */
export const WC_VENUES: WcVenue[] = [
  { id: 'sofi', name: 'SoFi Stadium', city: 'Inglewood (Los Angeles)', country: 'US', capacity: 70_240, roof: 'open', timeZone: 'America/Los_Angeles' },
  { id: 'metlife', name: 'MetLife Stadium', city: 'East Rutherford (New York/New Jersey)', country: 'US', capacity: 82_500, roof: 'open', timeZone: 'America/New_York' },
  { id: 'attstadium', name: 'AT&T Stadium', fifaName: 'Dallas Stadium', city: 'Arlington (Dallas)', country: 'US', capacity: 80_000, roof: 'retractable', timeZone: 'America/Chicago' },
  { id: 'merc', name: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'US', capacity: 71_000, roof: 'retractable', timeZone: 'America/New_York' },
  { id: 'arrowhead', name: 'GEHA Field at Arrowhead', fifaName: 'Kansas City Stadium', city: 'Kansas City', country: 'US', capacity: 76_416, roof: 'open', timeZone: 'America/Chicago' },
  { id: 'levis', name: "Levi's Stadium", fifaName: 'San Francisco Bay Area Stadium', city: 'Santa Clara (San Francisco)', country: 'US', capacity: 68_500, roof: 'open', timeZone: 'America/Los_Angeles' },
  { id: 'nrg', name: 'NRG Stadium', fifaName: 'Houston Stadium', city: 'Houston', country: 'US', capacity: 72_220, roof: 'retractable', timeZone: 'America/Chicago' },
  { id: 'gillette', name: 'Gillette Stadium', fifaName: 'Boston Stadium', city: 'Foxborough (Boston)', country: 'US', capacity: 65_878, roof: 'open', timeZone: 'America/New_York' },
  { id: 'linc', name: 'Lincoln Financial Field', fifaName: 'Philadelphia Stadium', city: 'Philadelphia', country: 'US', capacity: 69_796, roof: 'open', timeZone: 'America/New_York' },
  { id: 'lumen', name: 'Lumen Field', fifaName: 'Seattle Stadium', city: 'Seattle', country: 'US', capacity: 68_740, roof: 'open', timeZone: 'America/Los_Angeles' },
  { id: 'hard', name: 'Hard Rock Stadium', fifaName: 'Miami Stadium', city: 'Miami Gardens', country: 'US', capacity: 64_767, roof: 'open', timeZone: 'America/New_York' },
  { id: 'azteca', name: 'Estadio Azteca', fifaName: 'Estadio Banorte', city: 'Mexico', country: 'MX', capacity: 83_264, roof: 'open', timeZone: 'America/Mexico_City' },
  { id: 'akron', name: 'Estadio Akron', city: 'Guadalajara', country: 'MX', capacity: 48_071, roof: 'open', timeZone: 'America/Mexico_City' },
  { id: 'bbva', name: 'Estadio BBVA', city: 'Monterrey', country: 'MX', capacity: 53_500, roof: 'open', timeZone: 'America/Monterrey' },
  { id: 'bmo', name: 'BMO Field', fifaName: 'Toronto Stadium', city: 'Toronto', country: 'CA', capacity: 45_000, roof: 'open', timeZone: 'America/Toronto' },
  { id: 'bcplace', name: 'BC Place', fifaName: 'Vancouver Stadium', city: 'Vancouver', country: 'CA', capacity: 54_500, roof: 'retractable', timeZone: 'America/Vancouver' },
]

// ────────────────────────── CALENDRIER PLACEHOLDER ──────────────────────────

/**
 * Calendrier placeholder de la phase de poules : 1 match par poule par jour
 * étalé du 11 juin au 27 juin 2026 (8 jours de matchs, 6 matchs/jour).
 * Toutes les heures sont en UTC.
 */
function isoFor(day: number, hourUtc: number): string {
  // Juin 2026 — index 5 (mois 0-indexed)
  const d = new Date(Date.UTC(2026, 5, day, hourUtc, 0, 0))
  return d.toISOString()
}

const groupKickoffHours = [16, 19, 22, 1] // UTC : 18h Paris, 21h Paris, 00h Paris, 03h Paris

export const WC_GROUP_MATCHES: WcMatch[] = WC_GROUPS.flatMap((g, gi) => {
  const teamA = g.teams[0]?.iso ?? 'TBD'
  const teamB = g.teams[1]?.iso ?? 'TBD'
  const teamC = g.teams[2]?.iso ?? 'TBD'
  const teamD = g.teams[3]?.iso ?? 'TBD'
  const baseDay = 11 + Math.floor(gi / 4) // 11, 12, 13 juin pour les 3 premières dates
  const hour = groupKickoffHours[gi % 4]
  return [
    // Journée 1 : A vs B, C vs D
    {
      id: `wc-2026-grp-${g.id}-j1-1`,
      round: 'group' as const,
      groupId: g.id,
      kickoffAt: isoFor(baseDay, hour),
      status: 'scheduled' as const,
      home: { iso: teamA },
      away: { iso: teamB },
      venueId: WC_VENUES[gi % WC_VENUES.length].id,
    },
    {
      id: `wc-2026-grp-${g.id}-j1-2`,
      round: 'group' as const,
      groupId: g.id,
      kickoffAt: isoFor(baseDay, hour + 3),
      status: 'scheduled' as const,
      home: { iso: teamC },
      away: { iso: teamD },
      venueId: WC_VENUES[(gi + 1) % WC_VENUES.length].id,
    },
    // Journée 2 : A vs C, B vs D
    {
      id: `wc-2026-grp-${g.id}-j2-1`,
      round: 'group' as const,
      groupId: g.id,
      kickoffAt: isoFor(baseDay + 5, hour),
      status: 'scheduled' as const,
      home: { iso: teamA },
      away: { iso: teamC },
      venueId: WC_VENUES[(gi + 2) % WC_VENUES.length].id,
    },
    {
      id: `wc-2026-grp-${g.id}-j2-2`,
      round: 'group' as const,
      groupId: g.id,
      kickoffAt: isoFor(baseDay + 5, hour + 3),
      status: 'scheduled' as const,
      home: { iso: teamB },
      away: { iso: teamD },
      venueId: WC_VENUES[(gi + 3) % WC_VENUES.length].id,
    },
    // Journée 3 : A vs D, B vs C (mêmes horaires pour fair-play)
    {
      id: `wc-2026-grp-${g.id}-j3-1`,
      round: 'group' as const,
      groupId: g.id,
      kickoffAt: isoFor(baseDay + 10, hour),
      status: 'scheduled' as const,
      home: { iso: teamA },
      away: { iso: teamD },
      venueId: WC_VENUES[(gi + 4) % WC_VENUES.length].id,
    },
    {
      id: `wc-2026-grp-${g.id}-j3-2`,
      round: 'group' as const,
      groupId: g.id,
      kickoffAt: isoFor(baseDay + 10, hour),
      status: 'scheduled' as const,
      home: { iso: teamB },
      away: { iso: teamC },
      venueId: WC_VENUES[(gi + 5) % WC_VENUES.length].id,
    },
  ]
})

// ────────────────────────── BRACKET (R32 → finale) ──────────────────────────

/**
 * Squelette du tableau final : 16 matchs en R32, 8 en R16, 4 en QF, 2 en SF,
 * 1 petite finale et 1 finale. On laisse les `label` parlants — l'API
 * remplira `home/away` une fois les qualifiés connus.
 */
function makeSlot(
  id: string,
  round: WcBracketSlot['round'],
  description: string,
  prev?: { home?: string; away?: string },
): WcBracketSlot {
  return {
    id,
    round,
    matchId: `wc-2026-${id.toLowerCase()}`,
    description,
    prevHomeSlotId: prev?.home,
    prevAwaySlotId: prev?.away,
  }
}

const r32Slots: WcBracketSlot[] = Array.from({ length: 16 }, (_, i) =>
  makeSlot(`R32-${i + 1}`, 'r32', `Match seizièmes #${i + 1}`),
)
const r16Slots: WcBracketSlot[] = Array.from({ length: 8 }, (_, i) =>
  makeSlot(`R16-${i + 1}`, 'r16', `Huitièmes ${i + 1}`, {
    home: `R32-${i * 2 + 1}`,
    away: `R32-${i * 2 + 2}`,
  }),
)
const qfSlots: WcBracketSlot[] = Array.from({ length: 4 }, (_, i) =>
  makeSlot(`QF-${i + 1}`, 'qf', `Quarts ${i + 1}`, {
    home: `R16-${i * 2 + 1}`,
    away: `R16-${i * 2 + 2}`,
  }),
)
const sfSlots: WcBracketSlot[] = Array.from({ length: 2 }, (_, i) =>
  makeSlot(`SF-${i + 1}`, 'sf', `Demi-finale ${i + 1}`, {
    home: `QF-${i * 2 + 1}`,
    away: `QF-${i * 2 + 2}`,
  }),
)
const finalSlot = makeSlot('F', 'final', 'Finale Coupe du Monde 2026', {
  home: 'SF-1',
  away: 'SF-2',
})
const thirdSlot = makeSlot('3RD', 'third-place', 'Match pour la 3e place', {
  home: 'SF-1',
  away: 'SF-2',
})

export const WC_BRACKET: WcBracket = {
  slots: [...r32Slots, ...r16Slots, ...qfSlots, ...sfSlots, thirdSlot, finalSlot],
}

// Matchs squelettes pour le bracket (kickoff approximatif — à remplacer par API)
function isoEndOfJune(day: number, hourUtc: number): string {
  return new Date(Date.UTC(2026, 5, day, hourUtc, 0, 0)).toISOString()
}
function isoJuly(day: number, hourUtc: number): string {
  return new Date(Date.UTC(2026, 6, day, hourUtc, 0, 0)).toISOString()
}

export const WC_KO_MATCHES: WcMatch[] = [
  ...r32Slots.map((s, i) => ({
    id: s.matchId!,
    round: s.round,
    bracketSlot: s.id,
    kickoffAt: isoEndOfJune(28 + Math.floor(i / 4), 16 + (i % 4) * 3),
    status: 'scheduled' as const,
    home: { label: `Vainqueur Match ${i + 1}` },
    away: { label: `2e Match ${i + 1}` },
  })),
  ...r16Slots.map((s, i) => ({
    id: s.matchId!,
    round: s.round,
    bracketSlot: s.id,
    kickoffAt: isoJuly(2 + Math.floor(i / 2), 16 + (i % 2) * 4),
    status: 'scheduled' as const,
    home: { label: `Vainqueur ${s.prevHomeSlotId}` },
    away: { label: `Vainqueur ${s.prevAwaySlotId}` },
  })),
  ...qfSlots.map((s, i) => ({
    id: s.matchId!,
    round: s.round,
    bracketSlot: s.id,
    kickoffAt: isoJuly(8 + Math.floor(i / 2), 16 + (i % 2) * 4),
    status: 'scheduled' as const,
    home: { label: `Vainqueur ${s.prevHomeSlotId}` },
    away: { label: `Vainqueur ${s.prevAwaySlotId}` },
  })),
  ...sfSlots.map((s, i) => ({
    id: s.matchId!,
    round: s.round,
    bracketSlot: s.id,
    kickoffAt: isoJuly(12 + i, 19),
    status: 'scheduled' as const,
    home: { label: `Vainqueur ${s.prevHomeSlotId}` },
    away: { label: `Vainqueur ${s.prevAwaySlotId}` },
  })),
  {
    id: thirdSlot.matchId!,
    round: 'third-place',
    bracketSlot: thirdSlot.id,
    kickoffAt: isoJuly(18, 16),
    status: 'scheduled',
    home: { label: 'Perdant SF-1' },
    away: { label: 'Perdant SF-2' },
  },
  {
    id: finalSlot.matchId!,
    round: 'final',
    bracketSlot: finalSlot.id,
    kickoffAt: isoJuly(19, 19),
    status: 'scheduled',
    home: { label: 'Vainqueur SF-1' },
    away: { label: 'Vainqueur SF-2' },
  },
]

export const WC_MATCHES: WcMatch[] = [...WC_GROUP_MATCHES, ...WC_KO_MATCHES]

// ────────────────────────── EFFECTIFS (PLACEHOLDER) ──────────────────────────

/**
 * Effectifs vides — l'API officielle fournira les 26 joueurs par sélection.
 * On laisse l'objet existant pour que la fiche pays puisse afficher
 * « Effectif en attente de publication ».
 */
export const WC_SQUADS: WcSquad[] = WC_NATIONS.map((n) => ({
  nationIso: n.iso,
  players: [],
}))

// ────────────────────────── STATS COMPÉTITION ──────────────────────────

const emptyTopScorers: WcTopScorerRow[] = []
const emptyTopAssisters: WcTopAssisterRow[] = []

export const WC_STATS: WcTournamentStats = {
  topScorers: emptyTopScorers,
  topAssisters: emptyTopAssisters,
  teams: WC_NATIONS.map((n) => ({
    iso: n.iso,
    goalsFor: 0,
    goalsAgainst: 0,
    cleanSheets: 0,
  })),
  totals: { goals: 0, penalties: 0, redCards: 0, yellowCards: 0 },
}

// ────────────────────────── DATASET AGGREGÉ ──────────────────────────

export const WC_DATASET: WcDataset = {
  nations: WC_NATIONS,
  groups: WC_GROUPS,
  standings: WC_STANDINGS,
  matches: WC_MATCHES,
  bracket: WC_BRACKET,
  venues: WC_VENUES,
  squads: WC_SQUADS,
  stats: WC_STATS,
  updatedAt: new Date(0).toISOString(), // valeur fixe : on saura que c'est mock
}
