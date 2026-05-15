/**
 * Ids équipe SportMonks (participant) pour clubs du catalogue — utilisés tant que le
 * calendrier global n’a pas encore renvoyé ce club dans une fixture.
 * Ligue 1 : ids vérifiés via `fixtures/between` + `teams/search` (jan. 2026).
 * @see https://api.sportmonks.com/v3/football/schedules/teams/{team_id}
 */
export const SPORTMONKS_TEAM_ID_BY_CLUB_ID: Readonly<Record<string, number>> = {
  psg: 591,
  om: 44,
  monaco: 6789,
  nice: 450,
  lille: 690,
  lyon: 79,
  lens: 271,
  rennes: 598,
  brest: 266,
  nantes: 59,
  strasbourg: 686,
  montpellier: 581,
  reims: 1028,
  toulouse: 289,
  lorient: 9257,
  lehavre: 1055,
  metz: 3513,
  auxerre: 3682,
  angers: 776,
  stetienne: 108,
  /** Participant SM « Paris » en L1 — Paris FC. */
  parisfc: 4508,
  mci: 9,
  liv: 8,
  ars: 19,
  che: 7,
  mun: 14,
  tot: 6,
  new: 20,
  avl: 15,
  rma: 3468,
  fcb: 83,
  atleti: 7980,
  sevilla: 676,
  villarreal: 3477,
  bayern: 503,
  bay: 503,
  bvb: 68,
  leverkusen: 3321,
  leipzig: 277,
  inter: 2930,
  milan: 113,
  juve: 625,
  napoli: 597,
  roma: 37,
  lazio: 43,
}

/**
 * Id **saison** SportMonks (`season_id`) par club — optionnel : la page club résout sinon la saison via
 * `GET /teams/{teamId}?include=activeSeasons`, puis charge les stats avec `teamstatisticSeasons:{season_id}`.
 * Sert de forçage si `activeSeasons` est vide ou pour cibler une saison précise.
 */
export const SPORTMONKS_TEAM_SEASON_ID_BY_CLUB_ID: Readonly<Partial<Record<string, number>>> = {}

/**
 * Filtre `playerstatisticSeasons` pour `GET /squads/teams/{team_id}` (stats joueurs par saison SM).
 * Ex. `25583` — distinct du `team_season_id`.
 */
export const SPORTMONKS_SQUAD_PLAYER_STAT_SEASON_BY_CLUB_ID: Readonly<Partial<Record<string, number>>> = {}
