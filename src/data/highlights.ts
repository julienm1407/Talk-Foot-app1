export type Highlight = {
  id: string
  matchId: string
  minute: number
  /** 2e période — pour afficher 45+5 vs 50' cumulé. */
  inSecondHalf?: boolean
  /** Ordre SM (`comments.order`) pour tri stable si même minute. */
  order?: number
  type: 'But' | 'Occasion' | 'Carton' | 'VAR' | 'Arrêt' | 'Info'
  title: string
  detail: string
  /** Camp buteur (événements structurés SM). */
  side?: 'home' | 'away'
  /** Nom du buteur si connu (événements SM). */
  scorerName?: string
  /** Passeur décisif si connu (related_player SM ou texte commentaire). */
  assistName?: string
}

/** Plus de moments clés seed pour des matchs fictifs ; les vrais tribunes pourront s’enrichir via l’API. */
export const mockHighlights: Highlight[] = []
