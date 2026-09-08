/** Vrai si la chaîne ressemble à une adresse email (à ne pas afficher comme pseudo). */
export function isEmailLikeDisplayName(value: string | null | undefined): boolean {
  if (!value) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value.trim())
}

/**
 * Choisit un nom d’affichage humain.
 * Ignore les emails complets ; en dernier recours prend la partie avant @.
 */
export function pickHumanDisplayName(
  ...candidates: Array<string | null | undefined>
): string {
  for (const c of candidates) {
    const t = typeof c === 'string' ? c.trim() : ''
    if (t && !isEmailLikeDisplayName(t)) return t
  }
  for (const c of candidates) {
    const t = typeof c === 'string' ? c.trim() : ''
    if (t.includes('@')) {
      const local = t.split('@')[0]?.trim()
      if (local) return local
    }
  }
  return 'Supporteur'
}
