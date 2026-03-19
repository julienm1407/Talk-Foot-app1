import type { ReactionType } from '../../types/chat'

export const reactionMeta: Record<
  ReactionType,
  { emoji: string; label: string; hint: string; cost: number }
> = {
  flare: { emoji: '🔥', label: 'Flare', hint: 'Fumigène', cost: 15 },
  confetti: { emoji: '🎉', label: 'Confetti', hint: 'Celebrate', cost: 20 },
  goal: { emoji: '⚽', label: 'GOAL', hint: 'But!', cost: 25 },
  rage: { emoji: '😡', label: 'Rage', hint: 'Frustration', cost: 10 },
}

