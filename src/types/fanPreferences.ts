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
}
