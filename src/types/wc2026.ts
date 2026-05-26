/**
 * Modèle de domaine — Coupe du Monde 2026.
 *
 * Couvre tout ce que les fans cherchent pendant un Mondial :
 *  · calendrier (poules, éliminatoires, fiche match)
 *  · classements (poule, qualifiés, qualifiés meilleurs 3e)
 *  · arbre de la compétition (bracket 32 → finale)
 *  · effectif et joueurs (capitaine, sélectionneur, 26)
 *  · stades et fuseau
 *  · stats compétition (top buteurs, top passeurs, équipes)
 *  · résumés de match (buts, cartons, remplacements, faits)
 *
 * Source-agnostique : SportMonks, API-Football, FIFA officielle, etc. — le
 * transformer côté API doit fournir ces formes ; les composants UI ne dépendent
 * que de ces types.
 */

import type { Nation } from '../data/nations'

// ────────────────────────── ROUNDS ──────────────────────────

export type WcRoundId =
  | 'group'
  | 'r32'
  | 'r16'
  | 'qf'
  | 'sf'
  | 'third-place'
  | 'final'

export const WC_ROUND_LABELS: Record<WcRoundId, string> = {
  group: 'Phase de poules',
  r32: 'Seizièmes',
  r16: 'Huitièmes',
  qf: 'Quarts',
  sf: 'Demi-finales',
  'third-place': 'Petite finale',
  final: 'Finale',
}

// ────────────────────────── GROUP STAGE ──────────────────────────

export type WcGroupId =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'

export type WcGroupTeamSlot = {
  /** Code ISO-3 (FRA, BRA…) ou marqueur de poule si le tirage n'est pas connu. */
  iso: string
  /** Position dans le tirage (A1, A2, A3, A4…) */
  drawPos?: 1 | 2 | 3 | 4
}

export type WcGroup = {
  id: WcGroupId
  /** Les 4 équipes de la poule (référencées par ISO). */
  teams: WcGroupTeamSlot[]
}

export type WcStandingRow = {
  iso: string
  rank: number
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  /** « WWDLL » pour les 5 derniers (option). */
  form?: string
  /** « qualified » : 1er ou 2e ; « best-third » : 3e meilleur ; « out » : éliminé. */
  qualificationState?: 'qualified' | 'best-third' | 'in-contention' | 'out'
}

// ────────────────────────── MATCH / FIXTURE ──────────────────────────

export type WcMatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled'

/**
 * Identifiant Talk Foot d'un match CDM. Si SportMonks fournit l'id (`m-sm-XXXX`),
 * on l'utilise ; sinon on génère `wc-2026-<round>-<slot>`.
 */
export type WcMatchId = string

export type WcMatchTeam = {
  /** ISO ou placeholder type « Vainqueur A1 » / « 2e Groupe B ». */
  iso?: string
  /** Libellé affiché (si le tirage n'est pas connu, ex. « Vainqueur Groupe A »). */
  label?: string
  goals?: number
  /** Pénaltys (en cas de tirs au but). */
  penaltyGoals?: number
}

export type WcMatchEvent = {
  minute: number
  /** Affichage type 90+3'. */
  addedTime?: number
  type: 'goal' | 'own-goal' | 'penalty' | 'penalty-missed' | 'yellow' | 'red' | 'sub-in' | 'sub-out' | 'var'
  /** ISO de l'équipe à laquelle se rattache l'événement. */
  teamIso: string
  /** Nom joueur affiché. */
  player?: string
  /** Joueur remplacé (events sub). */
  relatedPlayer?: string
}

export type WcMatchLineupSlot = {
  player: string
  number?: number
  position?: 'GK' | 'DF' | 'MF' | 'FW'
  captain?: boolean
}

export type WcMatchLineup = {
  formation?: string // « 4-3-3 », « 4-2-3-1 »…
  starters: WcMatchLineupSlot[]
  substitutes?: WcMatchLineupSlot[]
  coach?: string
}

export type WcMatchKeyStats = {
  possession?: [number, number]
  shots?: [number, number]
  shotsOnTarget?: [number, number]
  corners?: [number, number]
  fouls?: [number, number]
  yellowCards?: [number, number]
  redCards?: [number, number]
  xg?: [number, number]
}

export type WcMatch = {
  id: WcMatchId
  round: WcRoundId
  /** Référence au groupe pour la phase de poules (sinon `undefined`). */
  groupId?: WcGroupId
  /** Tag bracket pour les éliminatoires (« R16-1 », « QF-2 »…) — utile pour relier dans l'arbre. */
  bracketSlot?: string
  /** Date / heure du coup d'envoi en ISO (UTC). */
  kickoffAt: string
  status: WcMatchStatus
  /** Minute live si `status === 'live'`. */
  minute?: number
  home: WcMatchTeam
  away: WcMatchTeam
  venueId?: string
  /** Évènements clés du live ou du résumé final. */
  events?: WcMatchEvent[]
  /** Compositions de départ. */
  lineups?: { home?: WcMatchLineup; away?: WcMatchLineup }
  /** Stats clés affichables. */
  stats?: WcMatchKeyStats
  /** Résumé prose court (utilisé sur fiche match terminé). */
  summary?: string
  /** Lien officiel highlight vidéo, si dispo (YouTube embed-ready). */
  highlightUrl?: string
  /** Chaîne TV / streaming par marché (clé = pays, valeur = chaîne). */
  broadcasters?: Record<string, string>
}

// ────────────────────────── BRACKET ──────────────────────────

export type WcBracketSlotId = string // ex. 'R16-1', 'QF-2', 'SF-1', 'F', '3RD'

export type WcBracketSlot = {
  id: WcBracketSlotId
  round: Exclude<WcRoundId, 'group'>
  /** Match associé (peut être `null` tant que les équipes ne sont pas définies). */
  matchId?: WcMatchId
  /** Description libre du « slot » (« Vainqueur Groupe A vs 2e Groupe C »). */
  description?: string
  /** ID du slot précédent (pour relier l'arbre visuellement). */
  prevHomeSlotId?: WcBracketSlotId
  prevAwaySlotId?: WcBracketSlotId
}

export type WcBracket = {
  /** Tableau final : 32 → 16 → 8 → 4 → 2 → 1, plus la « petite finale ». */
  slots: WcBracketSlot[]
}

// ────────────────────────── PLAYERS / SQUADS ──────────────────────────

export type WcPosition = 'GK' | 'DF' | 'MF' | 'FW'

export type WcPlayer = {
  id: string
  name: string
  /** ISO de la sélection. */
  nationIso: string
  position: WcPosition
  /** Numéro de maillot. */
  shirtNumber?: number
  /** Date de naissance ISO (YYYY-MM-DD). */
  dateOfBirth?: string
  /** Club actuel. */
  club?: string
  /** Capitaine. */
  captain?: boolean
}

export type WcSquad = {
  nationIso: string
  /** Liste officielle (26 joueurs réglementaires en 2026). */
  players: WcPlayer[]
  coach?: { name: string; nationality?: string }
  /** Date d'annonce officielle. */
  announcedAt?: string
}

// ────────────────────────── STADIUMS ──────────────────────────

export type WcVenue = {
  id: string
  /** Nom officiel (ex. « SoFi Stadium »). */
  name: string
  /** Nom marketing FIFA (parfois différent du nom commercial). */
  fifaName?: string
  city: string
  /** Pays hôte : US / CA / MX. */
  country: 'US' | 'CA' | 'MX'
  capacity: number
  /** Type : ouvert / fermé / mixte. */
  roof?: 'open' | 'closed' | 'retractable'
  /** Fuseau horaire IANA. */
  timeZone?: string
  /** Image stade (URL). */
  imageUrl?: string
}

// ────────────────────────── STATS COMPÉTITION ──────────────────────────

export type WcTopScorerRow = {
  player: WcPlayer
  goals: number
  penalties?: number
  /** Nombre d'apparitions. */
  appearances?: number
  /** Minutes jouées par but. */
  minutesPerGoal?: number
}

export type WcTopAssisterRow = {
  player: WcPlayer
  assists: number
  appearances?: number
}

export type WcTeamStatRow = {
  iso: string
  goalsFor: number
  goalsAgainst: number
  cleanSheets: number
  possessionAvg?: number
  xgFor?: number
  xgAgainst?: number
}

export type WcTournamentStats = {
  topScorers: WcTopScorerRow[]
  topAssisters: WcTopAssisterRow[]
  teams: WcTeamStatRow[]
  /** Compteurs globaux compétition. */
  totals?: {
    goals: number
    penalties: number
    redCards: number
    yellowCards: number
  }
}

// ────────────────────────── AGGREGAT API ──────────────────────────

/**
 * Forme agrégée du backend / mock data. Un seul objet, branchable en 1 ligne :
 *  · API SportMonks → transformer dans `src/api/wc2026/sportmonks.ts`
 *  · API FIFA → transformer dans `src/api/wc2026/fifa.ts`
 *  · Mock data → `src/data/wc2026Mock.ts`
 */
export type WcDataset = {
  /** Sélections participantes (référence vers `NATIONS`). */
  nations: Nation[]
  groups: WcGroup[]
  standings: Record<WcGroupId, WcStandingRow[]>
  matches: WcMatch[]
  bracket: WcBracket
  venues: WcVenue[]
  squads: WcSquad[]
  stats: WcTournamentStats
  /** Méta : date de mise à jour ISO. */
  updatedAt: string
}
