/**
 * Filtre de modération (contenus utilisateur) — aligné exigences UGC / Google Play :
 * pas d’insultes, vulgarité, haine, harcèlement ni contenus sexuellement explicites dans les entrées texte.
 * Liste volontairement ciblée (pas de termes trop génériques type « idiot ») pour limiter les faux positifs foot.
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
  'trou du cul',
  'va crever',
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

/** Message utilisateur quand le filtre bloque une saisie. */
export const MODERATION_REFUSED_MESSAGE_FR =
  'Ce contenu n’est pas autorisé sur Talk Foot (insultes, vulgarité ou propos haineux).'

/** Message quand un lien / URL est détecté dans un chat. */
export const CHAT_LINKS_REFUSED_MESSAGE_FR =
  'Les liens et adresses web ne sont pas autorisés dans le chat Talk Foot.'

const COMMON_TLDS =
  'com|fr|net|org|io|co|uk|de|es|it|be|ch|app|dev|link|me|tv|xyz|info|biz|eu|nl|pt|ca|us|gg|ly|to|sh|cc|ws'

const URL_PROTOCOL_RE = /(?:https?|ftp|hxxps?):\/\//i
const WWW_RE = /(?:^|[\s([{"'`])www\./i
const DOMAIN_RE = new RegExp(
  `(?:^|[\\s([{"'\`])[-a-z0-9]{1,63}\\.(?:${COMMON_TLDS})(?:[/:?#]|[^a-z0-9_]|$)`,
  'i',
)
const DOMAIN_PATH_RE = new RegExp(
  `[-a-z0-9]{1,63}\\.(?:${COMMON_TLDS})/[^\\s]+`,
  'i',
)

/** Rappel charte / signalement (Google Play UGC, section User Generated Content). */
export const MODERATION_POLICY_SUMMARY_FR =
  'Talk Foot filtre automatiquement les insultes et propos haineux à l’envoi. Tu peux signaler un abus depuis ton profil (section Modération).'

export type ModerationResult = { ok: true } | { ok: false; message: string }

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

/** Détecte URLs, domaines et formes obfusquées (hxxp, www., site point com). */
export function containsBlockedLink(text: string): boolean {
  if (!text?.trim()) return false
  let t = text
    .replace(/\s*\[\s*\.\s*\]\s*/gi, '.')
    .replace(/\s*\(\s*dot\s*\)\s*/gi, '.')
    .replace(/\s+dot\s+/gi, '.')
    .replace(/\s+point\s+/gi, '.')
    .trim()
  if (URL_PROTOCOL_RE.test(t)) return true
  if (WWW_RE.test(t)) return true
  if (DOMAIN_RE.test(t)) return true
  if (DOMAIN_PATH_RE.test(t)) return true
  const compact = t.replace(/\s+/g, '')
  if (URL_PROTOCOL_RE.test(compact)) return true
  if (/^www\./i.test(compact)) return true
  return false
}

export function moderateUserText(text: string | null | undefined): ModerationResult {
  if (!text?.trim()) return { ok: true }
  if (containsBannedWord(text)) return { ok: false, message: MODERATION_REFUSED_MESSAGE_FR }
  return { ok: true }
}

/** Modération des messages de chat (insultes + liens). */
export function moderateChatText(text: string | null | undefined): ModerationResult {
  if (!text?.trim()) return { ok: true }
  if (containsBannedWord(text)) return { ok: false, message: MODERATION_REFUSED_MESSAGE_FR }
  if (containsBlockedLink(text)) return { ok: false, message: CHAT_LINKS_REFUSED_MESSAGE_FR }
  return { ok: true }
}

export function moderateDebateInput(input: {
  title: string
  excerpt?: string
}): ModerationResult {
  const title = moderateUserText(input.title)
  if (!title.ok) return title
  if (input.excerpt?.trim()) {
    const excerpt = moderateUserText(input.excerpt)
    if (!excerpt.ok) return excerpt
  }
  return { ok: true }
}

export function validateOutgoingChatPayload(msg: {
  text: string
  groupScarf?: { text?: string; groupName?: string }
}): ModerationResult {
  const t = msg.text ?? ''
  if (t !== '[GIF]' && t !== '[Emote]' && t.trim() !== '') {
    const body = moderateChatText(t)
    if (!body.ok) return body
  }
  if (msg.groupScarf) {
    const scarfText = moderateChatText(msg.groupScarf.text)
    if (!scarfText.ok) return scarfText
    if (msg.groupScarf.groupName && containsBannedWord(msg.groupScarf.groupName)) {
      return { ok: false, message: MODERATION_REFUSED_MESSAGE_FR }
    }
  }
  return { ok: true }
}

/** Erreur Postgres levée par les triggers `content_moderation_rejected`. */
export function isSupabaseModerationError(message: string | null | undefined): boolean {
  if (!message) return false
  const m = message.toLowerCase()
  return m.includes('content_moderation_rejected') || m.includes('check_violation')
}
