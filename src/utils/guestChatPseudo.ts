const STORAGE_KEY = 'tf:guest-chat-pseudo'

export function isValidGuestChatPseudo(raw: string): boolean {
  const t = raw.replace(/\s+/g, ' ').trim()
  return t.length >= 2 && t.length <= 20
}

export function readGuestChatPseudo(): string | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const t = localStorage.getItem(STORAGE_KEY)?.replace(/\s+/g, ' ').trim() ?? ''
    return isValidGuestChatPseudo(t) ? t : null
  } catch {
    return null
  }
}

export function writeGuestChatPseudo(raw: string): string | null {
  const t = raw.replace(/\s+/g, ' ').trim()
  if (!isValidGuestChatPseudo(t)) return null
  try {
    localStorage.setItem(STORAGE_KEY, t)
  } catch {
    /* ignore */
  }
  return t
}
