/** Entités SportMonks v3 (sous-ensemble strictement typé + champs optionnels). */

export type SmState = {
  id?: number
  state?: string
  name?: string
  short_name?: string
  developer_name?: string
}

export type SmScoreRow = {
  description?: string
  type?: { developer_name?: string; name?: string }
  score?: { goals?: number; participant?: string }
}

export type SmParticipant = {
  id?: number
  name?: string
  meta?: { location?: string }
}

export type SmLeague = {
  /** Identifiant ligue côté SportMonks (v3), indispensable pour classer le match dans le bon championnat. */
  id?: number
  name?: string
  short_code?: string
  country?: { name?: string; image_path?: string }
}

export type SmFixtureStatistic = {
  team_id?: number | string | null
  participant_id?: number | string | null
  location?: string | null
  type_id?: number
  type?: { id?: number; developer_name?: string; name?: string }
  data?: { value?: number | string | null; total?: number | string | null }
  value?: number | string | null
}

/** Ligne `trends` sur détail fixture (`include` trends.type, trends.participant). */
export type SmFixtureTrend = {
  participant_id?: number
  type_id?: number
  type?: { id?: number; developer_name?: string; name?: string }
  participant?: { id?: number }
  value?: number | string | null
  data?: { value?: number | string | null }
}

export type SmXGFixtureRow = {
  participant_id?: number | null
  team_id?: number | null
  location?: string | null
  value?: string | number | null
  type?: { id?: number; developer_name?: string; name?: string }
}

export type SmOdd = {
  id?: number
  fixture_id?: number
  market_id?: number
  bookmaker_id?: number
  label?: string | null
  name?: string | null
  value?: string | number | null
  /** Cote décimale formatée (souvent présente si `value` est vide). */
  dp3?: string | null
  /** Id participant SM (domicile / extérieur) ; souvent `null` pour le nul. */
  participants?: string | number | null
  stopped?: boolean
  market?: { id?: number; name?: string; developer_name?: string }
  bookmaker?: { id?: number; name?: string }
}

/** Ligne `comments` sur `GET /fixtures/{id}?include=…;comments` (commentaires texte live). */
export type SmFixtureCommentRow = {
  id?: number
  fixture_id?: number
  comment?: string | null
  minute?: number | null
  extra_minute?: number | null
  is_goal?: boolean
  is_important?: boolean
  order?: number | null
}

export type SmFixtureEventRow = {
  id?: number
  minute?: number | null
  extra_minute?: number | null
  participant_id?: number | null
  type?: { developer_name?: string; name?: string }
  player?: { display_name?: string; name?: string }
}

export type SmFixture = {
  id: number
  name?: string | null
  starting_at?: string | null
  starting_at_timestamp?: number | string | null
  state_id?: number
  league_id?: number
  state?: SmState
  league?: SmLeague
  venue?: { name?: string; city?: string }
  /** Présent avec include `round` (calendrier / inplay). */
  round?: { id?: number; name?: string }
  participants?: SmParticipant[]
  scores?: SmScoreRow[]
  odds?: SmOdd[]
  /** Include `events.type`… sur détail fixture. */
  events?: SmFixtureEventRow[]
  /** Include `comments` sur détail fixture (texte live). */
  comments?: SmFixtureCommentRow[]
  /** Include `xGFixture.type` — clé JSON souvent en camelCase. */
  xGfixture?: SmXGFixtureRow[]
  xgfixture?: SmXGFixtureRow[]
  /** Présent sur livescores / includes `periods` */
  periods?: Array<{ ticking?: boolean; minutes?: number; description?: string }>
  minute?: number
  /** Include `statistics.type` (stats live / post). */
  statistics?: SmFixtureStatistic[]
  /** Include `lineups.player`… sur détail fixture. */
  lineups?: SmLineupRow[]
  /** Include `formations` — système par équipe (ex. 4-3-3). */
  formations?: SmFormationRow[]
  /** Include `trends.type`, `trends.participant`. */
  trends?: SmFixtureTrend[]
}

/** Ligne `formations` sur une fixture (`include=formations`). */
export type SmFormationRow = {
  id?: number
  fixture_id?: number
  participant_id?: number
  formation?: string | null
  location?: string | null
}

/** Réponse `GET /rounds/{id}` avec `fixtures.odds.*`. */
export type SmRoundWithOdds = {
  id?: number
  name?: string
  fixtures?: SmFixture[]
}

export type SmPlayer = {
  id: number
  name?: string
  display_name?: string
  firstname?: string
  lastname?: string
  nationality?: { name?: string }
}

/** Ligne de compos (`include` lineups.* sur une fixture). */
export type SmLineupRow = {
  team_id?: number | string | null
  player_id?: number
  player?: {
    id?: number
    name?: string
    display_name?: string
    firstname?: string
    lastname?: string
  }
  type_id?: number
  type?: { id?: number; developer_name?: string; name?: string }
  /** Grille tactique (ex. `2:2`) — absent pour le banc. */
  formation_field?: string | null
  formation_position?: number | null
  jersey_number?: number | null
  details?: Array<{
    type_id?: number
    type?: { developer_name?: string; name?: string }
    value?: string | number | null
  }>
}
