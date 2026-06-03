const GENERIC_CHAT_LABELS = new Set(['supporteur', 'supporter', 'inconnu'])

/** Nom affiché dans le fil : évite d’écraser un vrai pseudo par le placeholder générique. */
export function resolveChatDisplayLabel(
  authorDisplayName?: string | null,
  userUsername?: string | null,
  fallback = 'Supporteur',
): string {
  const fromMsg = authorDisplayName?.trim()
  const fromUser = userUsername?.trim()
  if (fromMsg && !GENERIC_CHAT_LABELS.has(fromMsg.toLowerCase())) return fromMsg
  if (fromUser && !GENERIC_CHAT_LABELS.has(fromUser.toLowerCase())) return fromUser
  return fromMsg || fromUser || fallback
}
