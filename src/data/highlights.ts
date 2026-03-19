export type Highlight = {
  id: string
  matchId: string
  minute: number
  type: 'But' | 'Occasion' | 'Carton' | 'VAR' | 'Arrêt' | 'Info'
  title: string
  detail: string
}

export const mockHighlights: Highlight[] = [
  {
    id: 'h-1',
    matchId: 'm-rma-fcb',
    minute: 3,
    type: 'Occasion',
    title: 'Première frappe cadrée',
    detail: 'Une transition rapide et une frappe aux 18m: ça lance le match.',
  },
  {
    id: 'h-2',
    matchId: 'm-rma-fcb',
    minute: 8,
    type: 'Arrêt',
    title: 'Gros arrêt du gardien',
    detail: 'Main ferme sur une frappe placée — le stade s’enflamme.',
  },
  {
    id: 'h-3',
    matchId: 'm-rma-fcb',
    minute: 12,
    type: 'But',
    title: 'BUT !',
    detail: 'Centre tendu, reprise: ça fait 0-1. Réactions en chaîne sur le live.',
  },
  {
    id: 'h-4',
    matchId: 'm-psg-om',
    minute: 0,
    type: 'Info',
    title: 'Compos annoncées',
    detail: 'Les onze sont sortis: gros duel au milieu, match sous tension.',
  },
  {
    id: 'h-d1',
    matchId: 'm-demo-live',
    minute: 12,
    type: 'Occasion',
    title: 'Occasion',
    detail: 'Frappe de l’OM repoussée par Donnarumma.',
  },
  {
    id: 'h-d2',
    matchId: 'm-demo-live',
    minute: 23,
    type: 'But',
    title: 'But',
    detail: 'PSG 1-0 — Frappe lointaine parfaite de #9.',
  },
  {
    id: 'h-d3',
    matchId: 'm-demo-live',
    minute: 35,
    type: 'Carton',
    title: 'Carton',
    detail: 'Carton jaune côté OM après une faute dangereuse.',
  },
]

