export type EmoteDef = {
  id: string
  emoji: string
  label: string
  cost: number
}

export const EMOTE_CATALOG: EmoteDef[] = [
  { id: 'fire', emoji: '🔥', label: 'Feu', cost: 30 },
  { id: 'goal', emoji: '⚽', label: 'But', cost: 25 },
  { id: 'trophy', emoji: '🏆', label: 'Trophée', cost: 100 },
  { id: 'clap', emoji: '👏', label: 'Applaudissements', cost: 20 },
  { id: 'heart', emoji: '❤️', label: 'Coeur', cost: 40 },
  { id: 'star', emoji: '⭐', label: 'Étoile', cost: 50 },
  { id: 'crown', emoji: '👑', label: 'Couronne', cost: 150 },
  { id: 'explode', emoji: '💥', label: 'Explosion', cost: 80 },
  { id: 'muscle', emoji: '💪', label: 'Muscle', cost: 45 },
  { id: 'celebrate', emoji: '🎉', label: 'Célébration', cost: 60 },
]

export function getEmoteById(id: string): EmoteDef | undefined {
  return EMOTE_CATALOG.find((e) => e.id === id)
}
