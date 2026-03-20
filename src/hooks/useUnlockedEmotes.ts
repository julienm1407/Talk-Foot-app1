import { useCallback } from 'react'
import { useLocalStorageState } from './useLocalStorage'
import { getEmoteById } from '../data/emotes'

const UNLOCKED_KEY = 'talkfoot.unlockedEmotes.v1'

export function useUnlockedEmotes() {
  const [unlockedIds, setUnlockedIds] = useLocalStorageState<string[]>(
    UNLOCKED_KEY,
    ['fire', 'goal', 'clap'],
    (p): p is string[] => Array.isArray(p) && p.every((x) => typeof x === 'string'),
  )

  const isUnlocked = useCallback(
    (emoteId: string) => unlockedIds.includes(emoteId),
    [unlockedIds],
  )

  const unlock = useCallback(
    (emoteId: string) => {
      if (unlockedIds.includes(emoteId)) return true
      const def = getEmoteById(emoteId)
      if (!def) return false
      setUnlockedIds((prev) => [...prev, emoteId])
      return true
    },
    [unlockedIds, setUnlockedIds],
  )

  return { unlockedIds, isUnlocked, unlock }
}
