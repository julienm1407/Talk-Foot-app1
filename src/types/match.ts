export type Team = {
  id: string
  name: string
  shortName: string
  colors: { primary: string; secondary: string }
  /** Logo réel club (SportMonks `image_path`/`logo_path`) quand disponible. */
  logoUrl?: string
  /** Renseigné quand le club apparaît dans une fixture SportMonks (calendrier / club). */
  sportMonksTeamId?: number
}

export type Competition = {
  id: string
  name: string
  shortName: string
}

export type MatchStatus = 'upcoming' | 'live' | 'finished'

export type Match = {
  id: string
  competition: Competition
  home: Team
  away: Team
  kickoffAt: string // ISO
  status: MatchStatus
  minute?: number
  score?: { home: number; away: number }
  /** Origine des données (agrégation multi-fournisseurs). */
  provider?: 'sportmonks' | 'demo'
  /** Identifiant fixture SportMonks (détail xG, compos, etc.). */
  sportMonksFixtureId?: number
  /** Journée SM — pour charger les cotes `/rounds/{id}` (prématch). */
  sportMonksRoundId?: number
  /** Mi-temps / pause : la minute affichée ne doit pas continuer à défiler entre deux polls API. */
  liveClockPaused?: boolean
  /** 2e période (SM) — distingue 46' de 45+1 en temps additionnel 1re mi-temps. */
  liveInSecondHalf?: boolean
  /** Horloge SM en cours (période `ticking`) — pas de défilement client si false. */
  livePeriodTicking?: boolean
  /** Journée / tour (SportMonks `round.name`) — calendrier CDM. */
  roundName?: string
  /** Phase (SportMonks `stage.name`) — ex. groupe A, huitièmes. */
  stageName?: string
  /** Stade (SportMonks `venue.name`). */
  venueName?: string
}

