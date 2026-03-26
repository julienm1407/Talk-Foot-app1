import type { TribuneId } from '../types/tribune'

export const TRIBUNE_TAGLINE = 'TalkFoot — Le stade dans ta poche.'
export const TRIBUNE_PROMISE = 'Ne regarde plus les matchs seul. Choisis ta tribune et vis le match avec les autres.'

export type TribuneMeta = {
  id: TribuneId
  label: string
  emoji: string
  mood: string
  dominant: 'vocal' | 'écrit' | 'mixte'
  objective: string
  features: string[]
  /** Couleurs UI (bordure / accents) */
  ring: string
  bg: string
  text: string
}

export const TRIBUNES: TribuneMeta[] = [
  {
    id: 'virage',
    label: 'Virage',
    emoji: '🔥',
    mood: 'Intense, émotionnelle, bruyante',
    dominant: 'vocal',
    objective: "Recréer l'énergie des supporters actifs",
    features: ['Réactions en direct', 'Interactions rapides', 'Forte activité en continu'],
    ring: 'ring-rose-500/50',
    bg: 'from-rose-500/12 via-white to-amber-50/40',
    text: 'text-rose-800',
  },
  {
    id: 'analyse',
    label: 'Analyse',
    emoji: '📊',
    mood: 'Posée, structurée',
    dominant: 'écrit',
    objective: 'Échanges construits autour du match',
    features: ['Discussions argumentées', 'Analyse tactique', 'Débats organisés'],
    ring: 'ring-slate-500/45',
    bg: 'from-slate-500/10 via-white to-sky-50/35',
    text: 'text-slate-800',
  },
  {
    id: 'chill',
    label: 'Chill',
    emoji: '😌',
    mood: 'Détendue',
    dominant: 'mixte',
    objective: 'Expérience accessible et sans pression',
    features: ['Réactions simples', 'Humour', 'Discussions légères'],
    ring: 'ring-teal-500/45',
    bg: 'from-teal-500/10 via-white to-emerald-50/30',
    text: 'text-teal-900',
  },
]

export const tribuneById: Record<TribuneId, TribuneMeta> = Object.fromEntries(
  TRIBUNES.map((t) => [t.id, t]),
) as Record<TribuneId, TribuneMeta>

/** Répartition mock des bots (plus de flux côté Virage). */
export function randomTribuneForBot(): TribuneId {
  const r = Math.random()
  if (r < 0.5) return 'virage'
  if (r < 0.82) return 'analyse'
  return 'chill'
}
