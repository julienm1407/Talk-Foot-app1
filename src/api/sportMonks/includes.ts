/** Chaînes `include` alignées sur la doc SportMonks (séparateur `;`). */

export const SM_INCLUDE_INPLAY =
  'participants;scores;periods;events;league.country;round' as const

/** GET `/rounds/{id}` — cotes prématch (marché 1 = 1N2 typique, bookmaker filtré côté `filters`). */
export const SM_INCLUDE_ROUND_ODDS =
  'fixtures.odds.market;fixtures.odds.bookmaker;fixtures.participants;league.country' as const

/** Marché SportMonks « résultat fin de match » (1N2). */
export const SM_ODDS_1X2_MARKET_ID = 1 as const

/**
 * Bookmaker unique pour tout le site (cotes 1N2 cohérentes : domicile / nul / extérieur).
 * Défaut **2** (souvent bet365 côté doc / jeux d’exemples SM) — surcharge : `VITE_SPORTMONKS_ODDS_BOOKMAKER_ID`.
 */
export function sportMonksOddsBookmakerId(): number {
  const raw = import.meta.env.VITE_SPORTMONKS_ODDS_BOOKMAKER_ID
  if (raw == null || String(raw).trim() === '') return 2
  const n = Number(String(raw).trim())
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 2
}

/** Filtre `filters` pour `GET /rounds/{id}` — bookmaker ciblé, sans bloquer les marchés. */
export function smRoundOddsFiltersDefault(): string {
  return `bookmakers:${sportMonksOddsBookmakerId()}`
}

/** `GET /fixtures/{id}` — cotes 1N2 seules (repli si la fixture n’est pas dans `/rounds/{id}`). */
export const SM_INCLUDE_FIXTURE_PREMATCH_ODDS =
  'odds.market;odds.bookmaker;participants;predictions.type' as const

/** Repli sans `odds` (plans API restreints) : récupère participants + predictions uniquement. */
export const SM_INCLUDE_FIXTURE_PREDICTIONS_ONLY =
  'participants;predictions.type' as const

/** Liste calendrier / agrégation (léger + état + scores + phase / lieu). */
export const SM_INCLUDE_FIXTURE_LIST =
  'participants;scores.type;league;state;round;stage;venue;periods' as const

/** Timeline live légère : événements + score + minute (périodes pour le chrono). */
export const SM_INCLUDE_FIXTURE_EVENTS_TIMELINE =
  'participants;league;venue;state;scores;periods;events.type;events.period;events.player;events.relatedPlayer' as const

/** Détail match : xG, events, compos. */
export const SM_INCLUDE_FIXTURE_XG =
  'participants;league;venue;state;scores;events.type;events.period;events.player;events.relatedPlayer;xGFixture.type;lineups.player;lineups.xGlineup.type;lineups.details.type' as const

export const SM_INCLUDE_FIXTURE_EVENTS =
  'participants;league;venue;state;scores;events.type;events.period;events.player;events.relatedPlayer;statistics.type;sidelined.sideline.player;sidelined.sideline.type;weatherReport' as const

/** Même base que `SM_INCLUDE_FIXTURE_EVENTS` + textes commentaire live (include `comments` sur la fixture). */
export const SM_INCLUDE_FIXTURE_EVENTS_COMMENTS =
  `${SM_INCLUDE_FIXTURE_EVENTS};comments` as const

/**
 * GET `/fixtures/{id}` — tendances par participant (ex. probas / momentum).
 * @example `…/fixtures/19427199?include=…;trends.type;trends.participant`
 */
export const SM_INCLUDE_FIXTURE_TRENDS =
  'participants;league;venue;state;scores;events.type;events.period;events.player;events.relatedPlayer;trends.type;trends.participant' as const

/**
 * GET `/fixtures/{id}` — compos, systèmes, staff + **tendances** (forme récente par équipe).
 * `trends` : même chaîne que `SM_INCLUDE_FIXTURE_TRENDS` (évite un 2ᵉ appel pour l’avant-match).
 */
export const SM_INCLUDE_FIXTURE_LINEUPS =
  'participants;league;venue;state;scores;lineups.player;lineups.type;lineups.details.type;metadata.type;coaches;formations;trends.type;trends.participant' as const

export const SM_INCLUDE_TEAM_FORM =
  'latest.statistics.type;latest.xgfixture.type;latest.participants;latest.scores.type' as const

/** GET `/teams/{id}` — à venir + derniers matchs (`upcoming` + `latest`). */
export const SM_INCLUDE_TEAM_UPCOMING_AND_LATEST =
  'upcoming.participants;upcoming.league;latest.participants;latest.league;latest.state;latest.scores.type' as const

/** Stats équipe : avec `GET /teams/{id}` + `filters=teamstatisticSeasons:{seasonId}` (ou ancienne route listes `/teams/seasons/{seasonId}`). */
export const SM_INCLUDE_TEAM_SEASON_STATS = 'statistics.details.type' as const

/**
 * GET `/leagues/date/{YYYY-MM-DD}` — grilles du jour + état + TV FR (résumé calendrier).
 * @example `…/leagues/date/2026-04-24?include=today.scores;today.participants;today.stage;…`
 */
export const SM_INCLUDE_LEAGUE_BY_DATE =
  'today.scores;today.participants;today.stage;today.group;today.round;today.state;today.tvstations.tvstation;today.tvstations.country;country' as const

/** GET `/squads/teams/{teamId}` — effectif + joueurs (nationalité, stats, poste). */
export const SM_INCLUDE_TEAM_SQUAD =
  'team;player.nationality;player.statistics.details.type;player.position' as const

/** Classements : équipe, détail par type, forme récente. */
export const SM_INCLUDE_STANDINGS =
  'participant;rule.type;details.type;form;stage;league;group' as const
