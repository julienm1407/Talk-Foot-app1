/**
 * Liste de termes interdits (injures fortes, vulgarité, propos haineux, abréviations usuelles).
 * Ne pas inclure d’insultes trop génériques (« idiot », etc.) pour limiter les faux positifs dans les débats foot.
 */
const BANNED_WORDS_FR = [
  // Vulgarité / insultes
  'putain',
  'putes',
  'pute',
  'merde',
  'connard',
  'connasse',
  'salaud',
  'salope',
  'enculé',
  'enculer',
  'encule',
  'nique',
  'niquer',
  'fdp',
  'pd',
  'tg',
  'tagueule',
  'fils de pute',
  'ta gueule',
  'bordel',
  'bâtard',
  'batard',
  'bite',
  'couille',
  'couilles',
  'chier',
  'chiasse',
  'foutre',
  'branleur',
  'branle',
  'suce',
  'sucer',
  'ntm',
  'nique ta',
  'niquer ta',
  'va te faire',
  'va niquer',
  'pétasse',
  'petasse',
  'grognasse',
  'tafiole',
  'pédale',
  'pedale',
  'tapette',
  'tarlouze',
  'bouffon',
  'gogole',
  'ducon',
  'conne',
  'enfoiré',
  'enfoire',
  'crève',
  'creve',
  'dégage',
  'degage',
  // Racisme / xénophobie / antisémitisme / homophobie (formes courantes)
  'negre',
  'nègre',
  'négre',
  'bicot',
  'bougnoule',
  'youpin',
  'sale juif',
  'sale arabe',
  'sale noir',
  'sale blanc',
  'raton',
  'rebeu',
  'renoi',
  'monkey',
  'nazi',
  'hitler',
  'heil',
  'kkk',
  'islamogauch',
]

export const MODERATION_REFUSED_MESSAGE_FR =
  'Ce contenu n’est pas autorisé sur Talk Foot (insultes, vulgarité ou propos haineux).'

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const NORMALIZED_BANNED = BANNED_WORDS_FR.map((w) => normalize(w))

function matchesBanned(normalizedText: string): boolean {
  for (const bannedNorm of NORMALIZED_BANNED) {
    if (bannedNorm.length < 2) continue
    const regex = new RegExp(
      `(^|[^a-z0-9])${escapeRegex(bannedNorm)}(s|es|e|x)?([^a-z0-9]|$)`,
      'i',
    )
    if (regex.test(normalizedText)) return true
    if (normalizedText === bannedNorm || normalizedText.startsWith(bannedNorm + ' ')) return true
  }
  return false
}

function scanVariants(text: string): boolean {
  const raw = normalize(text.trim())
  if (!raw) return false
  const compactSeparators = raw.replace(/[.\-_*'|\\/·:·]+/g, '')
  const leet = raw
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
  const collapsedRepeat = raw.replace(/(.)\1{2,}/g, '$1$1')
  const variants = [raw, compactSeparators, leet, collapsedRepeat]
  for (const v of variants) {
    if (matchesBanned(v)) return true
  }
  return false
}

/**
 * Vérifie si le texte contient un terme interdit (variantes simples, séparateurs, leet).
 */
export function containsBannedWord(text: string): boolean {
  if (!text || !text.trim()) return false
  return scanVariants(text)
}

export function validateOutgoingChatPayload(msg: {
  text: string
  groupScarf?: { text?: string; groupName?: string }
}): { ok: true } | { ok: false } {
  const t = msg.text ?? ''
  if (t !== '[GIF]' && t !== '[Emote]' && t.trim() !== '' && containsBannedWord(t)) {
    return { ok: false }
  }
  if (msg.groupScarf) {
    if (msg.groupScarf.text && containsBannedWord(msg.groupScarf.text)) return { ok: false }
    if (msg.groupScarf.groupName && containsBannedWord(msg.groupScarf.groupName)) return { ok: false }
  }
  return { ok: true }
}
