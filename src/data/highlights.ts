export type Highlight = {
  id: string
  matchId: string
  minute: number
  /** Ordre SM (`comments.order`) pour tri stable si même minute. */
  order?: number
  type: 'But' | 'Occasion' | 'Carton' | 'VAR' | 'Arrêt' | 'Info'
  title: string
  detail: string
}

/** Plus de moments clés seed pour des matchs fictifs ; les vrais salons pourront s’enrichir via l’API. */
export const mockHighlights: Highlight[] = []
