export type FanPreferencesStoredShape = {
  favoriteLeagueId?: string | null
  favoriteClubId?: string | null
  favoriteClubIds?: string[]
  /**
   * Sélections nationales suivies (ISO-3). Saison CDM 2026 → mise en avant
   * sur la home, alertes match imminent, badge sur les matchs concernés.
   */
  favoriteNationIsos?: string[]
  preferencesComplete?: boolean
  hideRivalSalons?: boolean
  virageMode?: boolean
  /** Pop-up native : 1 h avant, coup d’envoi, buts et cartons des matchs suivis. */
  kickoffAlertsEnabled?: boolean
  /** Matchs suivis unitairement (étoile) — alertes même hors clubs favoris. */
  favoriteMatchIds?: string[]
  /** Cases notif par match suivi. */
  favoriteMatchAlertPrefs?: Record<string, MatchAlertPrefs>
  /** Joueurs suivis : alertes des matchs de leur club. */
  favoritePlayers?: FavoritePlayerFollow[]
}

export type MatchAlertKind = 'kickoff' | 'goal' | 'scorer' | 'card' | 'halftime' | 'fulltime'

export type MatchAlertPrefs = Partial<Record<MatchAlertKind, boolean>>

export const DEFAULT_MATCH_ALERT_PREFS: Record<MatchAlertKind, boolean> = {
  kickoff: true,
  goal: true,
  scorer: true,
  card: true,
  halftime: true,
  fulltime: true,
}

export const MATCH_ALERT_PREF_LABELS: Record<MatchAlertKind, string> = {
  kickoff: 'Rappel avant coup d’envoi',
  goal: 'But',
  scorer: 'Buteur (joueur suivi)',
  card: 'Carton',
  halftime: 'Score mi-temps',
  fulltime: 'Résultat final',
}

export type FavoritePlayerFollow = {
  playerId: number
  name: string
  teamId: string
}
