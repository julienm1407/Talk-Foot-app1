/**
 * Ids **saison** SportMonks pour `GET /v3/football/standings/seasons/{id}` puis, si besoin,
 * `GET /v3/football/teams/seasons/{id}?include=statistics.details.type`.
 * Renseigne-les depuis le dashboard SM ou `VITE_SPORTMONKS_STANDING_SEASON_ID` (un id pour toutes les ligues en secours).
 */
export const SPORTMONKS_STANDING_SEASON_ID_BY_LEAGUE: Readonly<Partial<Record<string, number>>> = {}
