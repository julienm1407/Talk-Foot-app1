/** Chaînes `include` alignées sur la doc SportMonks (séparateur `;`). */

export const SM_INCLUDE_INPLAY =
  'participants;scores;periods;events;league.country;round' as const

/** Liste calendrier / agrégation (léger + état + scores). */
export const SM_INCLUDE_FIXTURE_LIST = 'participants;scores.type;league;state' as const

/** Détail match : xG, events, compos. */
export const SM_INCLUDE_FIXTURE_XG =
  'participants;league;venue;state;scores;events.type;events.period;events.player;xGFixture.type;lineups.player;lineups.xGlineup.type;lineups.details.type' as const

export const SM_INCLUDE_FIXTURE_EVENTS =
  'participants;league;venue;state;scores;events.type;events.period;events.player;statistics.type;sidelined.sideline.player;sidelined.sideline.type;weatherReport' as const

export const SM_INCLUDE_FIXTURE_LINEUPS =
  'participants;league;venue;state;scores;lineups.player;lineups.type;lineups.details.type;metadata.type;coaches' as const

export const SM_INCLUDE_TEAM_FORM =
  'latest.statistics.type;latest.xgfixture.type;latest.participants;latest.scores.type' as const

export const SM_INCLUDE_LEAGUE_BY_DATE =
  'today.scores;today.participants;today.stage;today.group;today.round' as const
