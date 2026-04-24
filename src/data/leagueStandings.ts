import type { FormResult } from '../types/standings'

export type LeagueStandingRow = {
  rank: number
  teamId: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  points: number
  /** 5 derniers, du plus ancien au plus récent (affichage gauche → droite) */
  form: FormResult[]
  /** Indices 0–100 (dérivés des stats / forme, ou mock historique) */
  attackIndex: number
  defenseIndex: number
  momentumIndex: number
  /** Libellé court SM si `teamId` hors catalogue (`sm-{id}`). */
  displayName?: string
  /** Tendance position (SportMonks `result`). */
  trend?: 'up' | 'down' | 'same'
  sportMonksParticipantId?: number
}

function row(
  rank: number,
  teamId: string,
  w: number,
  d: number,
  l: number,
  gf: number,
  ga: number,
  form: FormResult[],
  attackIndex: number,
  defenseIndex: number,
  momentumIndex: number,
): LeagueStandingRow {
  const played = w + d + l
  return {
    rank,
    teamId,
    played,
    won: w,
    drawn: d,
    lost: l,
    gf,
    ga,
    points: w * 3 + d,
    form,
    attackIndex,
    defenseIndex,
    momentumIndex,
  }
}

/** Big 5 — données fictives cohérentes pour la maquette */
export const standingsByLeague: Record<string, LeagueStandingRow[]> = {
  'ligue-1': [
    row(1, 'psg', 19, 5, 2, 54, 19, ['W', 'W', 'D', 'W', 'W'], 96, 72, 92),
    row(2, 'om', 17, 4, 5, 48, 28, ['W', 'L', 'W', 'W', 'D'], 88, 58, 78),
    row(3, 'monaco', 16, 5, 5, 44, 32, ['D', 'W', 'W', 'L', 'W'], 85, 52, 75),
    row(4, 'lille', 14, 7, 5, 38, 26, ['W', 'D', 'D', 'W', 'L'], 72, 68, 62),
    row(5, 'nice', 13, 8, 5, 35, 27, ['D', 'W', 'D', 'W', 'W'], 70, 65, 68),
    row(6, 'lyon', 12, 6, 8, 36, 34, ['L', 'W', 'D', 'L', 'W'], 74, 48, 52),
    row(7, 'lens', 11, 8, 7, 33, 30, ['W', 'D', 'L', 'D', 'W'], 68, 60, 55),
    row(8, 'rennes', 10, 7, 9, 31, 33, ['L', 'D', 'W', 'L', 'D'], 65, 55, 45),
    row(9, 'strasbourg', 9, 9, 8, 29, 31, ['D', 'D', 'W', 'L', 'D'], 62, 52, 48),
    row(10, 'brest', 9, 8, 9, 28, 35, ['W', 'L', 'L', 'D', 'W'], 60, 42, 42),
  ],
  epl: [
    row(1, 'mci', 18, 4, 3, 56, 22, ['W', 'W', 'W', 'D', 'W'], 98, 70, 95),
    row(2, 'ars', 17, 5, 3, 49, 21, ['W', 'D', 'W', 'W', 'W'], 90, 78, 88),
    row(3, 'liv', 16, 6, 4, 47, 26, ['W', 'W', 'L', 'W', 'D'], 88, 65, 80),
    row(4, 'che', 14, 5, 7, 42, 31, ['L', 'W', 'W', 'D', 'L'], 82, 58, 58),
    row(5, 'mun', 13, 6, 7, 39, 34, ['W', 'L', 'D', 'W', 'W'], 78, 52, 62),
    row(6, 'tot', 12, 7, 7, 38, 33, ['D', 'W', 'L', 'W', 'D'], 76, 54, 55),
    row(7, 'new', 11, 8, 7, 35, 30, ['W', 'D', 'D', 'W', 'L'], 72, 60, 52),
    row(8, 'avl', 11, 6, 9, 34, 36, ['L', 'W', 'W', 'L', 'D'], 70, 48, 48),
    row(9, 'bha', 10, 8, 8, 32, 31, ['D', 'D', 'W', 'L', 'W'], 68, 58, 50),
    row(10, 'whu', 9, 7, 10, 30, 38, ['L', 'D', 'W', 'L', 'L'], 64, 45, 38),
  ],
  laliga: [
    row(1, 'rma', 19, 4, 3, 52, 20, ['W', 'W', 'W', 'D', 'W'], 95, 75, 93),
    row(2, 'fcb', 18, 5, 3, 50, 23, ['W', 'D', 'W', 'W', 'W'], 92, 72, 90),
    row(3, 'atleti', 16, 6, 4, 41, 24, ['W', 'L', 'W', 'D', 'W'], 78, 80, 72),
    row(4, 'bilbao', 13, 8, 5, 36, 27, ['D', 'W', 'W', 'D', 'W'], 72, 68, 65),
    row(5, 'sociedad', 12, 7, 7, 34, 30, ['W', 'L', 'D', 'W', 'L'], 70, 60, 52),
    row(6, 'villarreal', 11, 8, 7, 35, 32, ['D', 'W', 'L', 'W', 'D'], 73, 55, 55),
    row(7, 'betis', 10, 9, 7, 32, 31, ['W', 'D', 'D', 'L', 'W'], 68, 58, 52),
    row(8, 'girona', 10, 6, 10, 33, 38, ['L', 'W', 'L', 'D', 'W'], 70, 45, 45),
    row(9, 'sevilla', 9, 8, 9, 30, 34, ['D', 'L', 'W', 'D', 'L'], 62, 50, 42),
    row(10, 'valencia', 8, 9, 9, 28, 35, ['D', 'D', 'L', 'W', 'L'], 58, 48, 40),
  ],
  'serie-a': [
    row(1, 'inter', 18, 5, 3, 49, 19, ['W', 'W', 'D', 'W', 'W'], 94, 76, 90),
    row(2, 'napoli', 17, 5, 4, 46, 24, ['W', 'L', 'W', 'W', 'D'], 88, 70, 78),
    row(3, 'juve', 16, 6, 4, 40, 22, ['W', 'D', 'W', 'L', 'W'], 80, 75, 72),
    row(4, 'milan', 15, 5, 6, 42, 28, ['L', 'W', 'W', 'D', 'W'], 82, 62, 68),
    row(5, 'atalanta', 14, 6, 6, 44, 30, ['W', 'W', 'L', 'D', 'W'], 86, 55, 70),
    row(6, 'roma', 12, 7, 7, 36, 31, ['D', 'W', 'L', 'W', 'D'], 72, 58, 55),
    row(7, 'lazio', 11, 8, 7, 34, 32, ['W', 'D', 'D', 'L', 'W'], 70, 54, 52),
    row(8, 'fiorentina', 10, 8, 8, 32, 33, ['L', 'D', 'W', 'W', 'L'], 68, 52, 48),
    row(9, 'bologna', 9, 9, 8, 30, 31, ['D', 'W', 'D', 'L', 'D'], 64, 55, 45),
    row(10, 'torino', 8, 10, 7, 27, 29, ['D', 'D', 'D', 'W', 'L'], 58, 58, 42),
  ],
  bund: [
    row(1, 'bayern', 18, 4, 4, 58, 24, ['W', 'W', 'L', 'W', 'W'], 98, 65, 85),
    row(2, 'leverkusen', 17, 5, 4, 51, 26, ['W', 'D', 'W', 'W', 'L'], 90, 62, 80),
    row(3, 'leipzig', 16, 5, 5, 45, 28, ['W', 'L', 'W', 'D', 'W'], 84, 58, 72),
    row(4, 'bvb', 15, 6, 5, 47, 30, ['W', 'W', 'D', 'L', 'W'], 86, 52, 70),
    row(5, 'stuttgart', 13, 6, 7, 40, 33, ['L', 'W', 'W', 'D', 'L'], 78, 50, 55),
    row(6, 'frankfurt', 12, 7, 7, 38, 34, ['D', 'W', 'L', 'W', 'D'], 75, 52, 52),
    row(7, 'freiburg', 11, 8, 7, 34, 32, ['W', 'D', 'D', 'L', 'W'], 70, 58, 50),
    row(8, 'wolfsburg', 10, 7, 9, 32, 35, ['L', 'L', 'W', 'D', 'W'], 68, 48, 42),
    row(9, 'gladbach', 9, 8, 9, 31, 36, ['D', 'L', 'W', 'D', 'L'], 65, 45, 40),
    row(10, 'hoffenheim', 9, 6, 10, 33, 40, ['W', 'L', 'L', 'D', 'L'], 70, 38, 35),
  ],
}

export const BIG_FIVE_LEAGUE_IDS = ['ligue-1', 'epl', 'laliga', 'serie-a', 'bund'] as const
export type BigFiveLeagueId = (typeof BIG_FIVE_LEAGUE_IDS)[number]

export function getStandingsForLeague(leagueId: string): LeagueStandingRow[] {
  return standingsByLeague[leagueId] ?? []
}
