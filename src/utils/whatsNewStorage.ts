const STORAGE_KEY = 'tf.whatsNew.seenId'

export function hasSeenWhatsNew(id: string): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(STORAGE_KEY) === id
  } catch {
    return true
  }
}

export function markWhatsNewSeen(id: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* quota / private mode */
  }
}
