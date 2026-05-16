export type Highlight = {
  id: string
  matchId: string
  minute: number
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

/** Plus de moments clés seed pour des matchs fictifs ; les vrais salons pourront s’enrichir via l’API. */
export const mockHighlights: Highlight[] = []
