export type Team = {
  id: string
  name: string
  shortName: string
  colors: { primary: string; secondary: string }
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
}

