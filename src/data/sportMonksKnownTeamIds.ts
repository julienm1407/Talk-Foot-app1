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
}
