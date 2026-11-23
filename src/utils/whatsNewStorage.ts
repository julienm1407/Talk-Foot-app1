const SNOOZE_KEY = 'tf.whatsNew.snoozeId'

export function hasSnoozedWhatsNew(id: string): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.sessionStorage.getItem(SNOOZE_KEY) === id
  } catch {
    return true
  }
}

export function markWhatsNewSnoozed(id: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(SNOOZE_KEY, id)
  } catch {
    /* quota / private mode */
  }
}
