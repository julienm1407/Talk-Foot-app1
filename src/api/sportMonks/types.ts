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
  participants?: SmParticipant[]
  scores?: SmScoreRow[]
  /** Présent sur livescores / includes `periods` */
  periods?: Array<{ ticking?: boolean; minutes?: number; description?: string }>
  minute?: number
}

export type SmPlayer = {
  id: number
  name?: string
  display_name?: string
  nationality?: { name?: string }
}
