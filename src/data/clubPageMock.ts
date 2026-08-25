import type { Team } from '../types/match'
import { ALL_CLUBS_BY_ID } from './allClubsCatalog'

export type ClubSquadNode = {
  id: string
  label: string
  number: string
  /** position % sur le terrain (0–100) */
  x: number
  y: number
  /** note mock */
  rating: number
}

/** Positions 4-3-3 + GK (haut = attaque). */
export const CLUB_PITCH_433_LAYOUT: ReadonlyArray<{ x: number; y: number; number: string; role: string }> = [
  { x: 50, y: 20, number: '9', role: 'att' },
  { x: 24, y: 26, number: '11', role: 'att' },
  { x: 76, y: 26, number: '7', role: 'att' },
  { x: 32, y: 46, number: '8', role: 'mid' },
  { x: 50, y: 48, number: '6', role: 'mid' },
  { x: 68, y: 46, number: '10', role: 'mid' },
  { x: 18, y: 70, number: '3', role: 'def' },
  { x: 40, y: 72, number: '4', role: 'def' },
  { x: 60, y: 72, number: '5', role: 'def' },
  { x: 82, y: 70, number: '2', role: 'def' },
  { x: 50, y: 90, number: '1', role: 'gk' },
]

/** 11 nœuds du onze type (placeholders jusqu’à l’effectif API). */
export function defaultClubPitchFormation(pfx = 'club'): ClubSquadNode[] {
  return CLUB_PITCH_433_LAYOUT.map((p, i) => ({
    id: `${pfx}-p${i + 1}`,
    label: 'Joueur',
    number: p.number,
    x: p.x,
    y: p.y,
    rating: 0,
  }))
}

export type ClubDebateItem = {
  id: string
  title: string
  yesPct: number
  comments: number
  isLive: boolean
}

export type ClubShopItem = {
  id: string
  label: string
  price: string
  emoji: string
  /** effet / skin générique */
  kind: 'skin' | 'badge' | 'fx' | 'wear'
}

export type ClubPageMock = {
  heroTag: string
  /** Mode match (live) */
  matchMode: boolean
  /** Pic d’activité */
  onFire: boolean
  popularityLabel: string
  liveMsgPerMin: string
  openRooms: number
  activitySpike: string
  globalRank: string
  topFan: { name: string; handle: string; seed: string }
  squad: ClubSquadNode[]
  hotPlayerId: string
  debates: ClubDebateItem[]
  shop: ClubShopItem[]
  stats: { label: string; value: string; sub?: string }[]
  topFans: { rank: number; name: string; seed: string; pts: string }[]
  mvpTitle: string
  /** Palmarès / histoire (secondaire) */
  trophies: { label: string; count: string }[]
  /** Info tiroir : résumé */
  infoSummary: { coach: string; stadium: string; nextOpponent: string }
  /** Prochain match (mock) — remplit l’encart calendrier */
  upcoming: {
    league: string
    matchday: string
    opponent: string
    kickoff: string
    venue: 'dom' | 'ext'
    /** Id Talk Foot (`/channel/:id`) quand connu. */
    matchId?: string
    homeName?: string
    awayName?: string
    homeLogoUrl?: string
    awayLogoUrl?: string
    homeCrest?: {
      id: string
      shortName: string
      colors: { primary: string; secondary: string }
      sportMonksTeamId?: number
    }
    awayCrest?: {
      id: string
      shortName: string
      colors: { primary: string; secondary: string }
      sportMonksTeamId?: number
    }
  }
  /** 5 dernières (V/N/D) */
  formStrip: Array<'V' | 'N' | 'D'>
  /** Renseigné quand `formStrip` provient du schedule SportMonks (pas le mock). */
  formStripFromApi?: boolean
  /** Les noms sur le terrain 4-3-3 viennent de `squads/teams` (SportMonks). */
  squadFromSportMonks?: boolean
  /** Mini classement (mock) */
  tableSnapshot: { position: string; points: string; line: string }
  /** Monnaie & déco (boutique) */
  shopWallet: { balance: string; owned: string }
  /** Encart colonne droite (sous Top fans) */
  hubPulse: { label: string; value: string; sub?: string }[]
}

/** Coquille vide : données SM + groupes/débats réels remplissent la page (plus de générateur mock). */
export function buildEmptyClubPageShell(team: Team): ClubPageMock {
  const meta = ALL_CLUBS_BY_ID[team.id]
  const leagueLabel = meta?.leagueName ?? '—'
  return {
    heroTag: team.shortName,
    matchMode: false,
    onFire: false,
    popularityLabel: 'Communauté Talk Foot',
    liveMsgPerMin: '0',
    openRooms: 0,
    activitySpike: '—',
    globalRank: '—',
    topFan: { name: '—', handle: '@—', seed: team.id },
    squad: defaultClubPitchFormation(team.id),
    hotPlayerId: `${team.id}-p1`,
    debates: [],
    shop: [],
    stats: [],
    topFans: [],
    mvpTitle: 'MVP saison',
    trophies: [],
    infoSummary: {
      coach: '—',
      stadium: '—',
      nextOpponent: 'À venir (calendrier SM)',
    },
    upcoming: {
      league: leagueLabel,
      matchday: '',
      opponent: '—',
      kickoff: '—',
      venue: 'dom',
      homeName: team.name,
      awayName: '—',
    },
    formStrip: [],
    tableSnapshot: { position: '—', points: '—', line: 'Classement SportMonks' },
    shopWallet: { balance: '—', owned: '0' },
    hubPulse: [],
  }
}

/** @deprecated Utiliser `buildEmptyClubPageShell`. */
export function getClubPageMock(team: Team): ClubPageMock {
  return buildEmptyClubPageShell(team)
}
