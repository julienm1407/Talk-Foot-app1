/**
 * Liste de mots interdits en français (gros mots, insultes, propos haineux).
 * Utilisé pour valider les noms de serveurs, groupes, etc.
 */
const BANNED_WORDS_FR = [
  'putain',
  'merde',
  'connard',
  'connasse',
  'salaud',
  'salope',
  'enculé',
  'nique',
  'fdp',
  'pd',
  'tg',
  'fils de pute',
  'ta gueule',
  'niquer',
  'enculer',
  'bordel',
  'bâtard',
  'crétin',
  'idiot',
  'debile',
  'débile',
  'taré',
  'tare',
  'con',
  'conne',
  'pute',
  'nazi',
  'hitler',
  'negre',
  'nègre',
]

/**
 * Normalise une chaîne pour la comparaison (minuscules, sans accents).
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Échappe les caractères spéciaux pour une utilisation en regex.
 */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Vérifie si le texte contient des mots interdits.
 * Utilise des limites de mot pour éviter les faux positifs (ex: "con" dans "reconnaissance").
 * @returns true si le texte est inapproprié
 */
export function containsBannedWord(text: string): boolean {
  if (!text || !text.trim()) return false
  const normalized = normalize(text.trim())

  const normalizedList = BANNED_WORDS_FR.map((w) => normalize(w))

  for (const bannedNorm of normalizedList) {
    if (bannedNorm.length < 2) continue
    // Mot entier ou avec variantes (connard/connards) - évite "con" dans "reconnaissance"
    const regex = new RegExp(
      `(^|[^a-z0-9])${escapeRegex(bannedNorm)}(s|es|e)?([^a-z0-9]|$)`,
      'i',
    )
    if (regex.test(normalized)) return true
    if (normalized === bannedNorm || normalized.startsWith(bannedNorm + ' ')) return true
  }
  return false
}
