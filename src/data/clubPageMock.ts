import type { Team } from '../types/match'
import { buildClubPageMock } from './clubPageGenerator'

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
    homeName?: string
    awayName?: string
    homeLogoUrl?: string
    awayLogoUrl?: string
    homeCrest?: { id: string; shortName: string; colors: { primary: string; secondary: string } }
    awayCrest?: { id: string; shortName: string; colors: { primary: string; secondary: string } }
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

/** Contenu riche, déterministe par `team.id` (voir `clubPageGenerator.ts`). */
export function getClubPageMock(team: Team): ClubPageMock {
  return buildClubPageMock(team)
}
