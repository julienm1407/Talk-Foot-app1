/**
 * Concatène les classes. Sans fusion des utilitaires Tailwind conflictuels (ex. deux `bg-*`),
 * la dernière classe dans la feuille de style peut « gagner » de façon imprévisible — sur fond sombre,
 * préférer un `Link` ou un bouton aux classes complètes plutôt que `Button` + overrides partiels.
 */
export function cn(...parts: Array<string | undefined | null | false>) {
  return parts.filter(Boolean).join(' ')
}

