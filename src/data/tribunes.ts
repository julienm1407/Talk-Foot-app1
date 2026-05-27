import type { TribuneId } from '../types/tribune'

export const TRIBUNE_TAGLINE = 'TalkFoot — Le stade dans ta poche.'
export const TRIBUNE_PROMISE =
  'Choisis une zone d’ambiance pour le chat de ce match (tribune de groupe = autre page).'

/** Filtre Profil uniquement (pas de bouton doublon sur le live). */
export const LIVE_FIL_EQUIPE_COEUR = {
  label: 'Fil équipe de cœur',
  labelOn: 'Même club · ON',
  title:
    'Réglage dans Profil : n’afficher que les messages des supporters qui partagent un de tes clubs favoris.',
} as const


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
    mood: 'Ambiance intense — chat public du match',
    dominant: 'vocal',
    objective: "Recréer l'énergie des supporters les plus actifs dans le chat public",
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
    mood: 'Chat posé : texte seulement ici, pas de GIF/emotes ni effets flottants',
    dominant: 'mixte',
    objective: 'Lecture confortable, ambiance calme (mock : comptes vérifiés à brancher)',
    features: ['Discussions légères', 'Réactions réduites', 'Sans animations overlay'],
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
