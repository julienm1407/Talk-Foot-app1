import type { ReactionType } from '../../types/chat'

export const reactionMeta: Record<
  ReactionType,
  { emoji: string; label: string; hint: string }
> = {
  flare: { emoji: '🔥', label: 'Flare', hint: 'Fumigène' },
  confetti: { emoji: '🎉', label: 'Confetti', hint: 'Celebrate' },
  goal: { emoji: '⚽', label: 'GOAL', hint: 'But!' },
  rage: { emoji: '😡', label: 'Rage', hint: 'Frustration' },
}

