/**
 * Ids **saison** SportMonks pour `GET /v3/football/standings/seasons/{id}` puis, si besoin,
 * `GET /v3/football/teams/seasons/{id}?include=statistics.details.type`.
 * Repli statique si `GET /leagues/{id}` échoue — saisons 2026/2027 (reprise fin août).
 */
export const SPORTMONKS_STANDING_SEASON_ID_BY_LEAGUE: Readonly<Partial<Record<string, number>>> = {
  'ligue-1': 28082,
  epl: 28083,
  laliga: 27965,
  'serie-a': 27895,
  bund: 28321,
}
