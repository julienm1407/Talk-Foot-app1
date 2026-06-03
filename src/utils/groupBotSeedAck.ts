import type { Message } from '../types/chat'

/** Tribunes dont l’utilisateur a déjà vu les messages d’accueil bot (évite le re-seed au refresh). */
function storageKey(userId: string) {
  return `talkfoot.groupBotSeedsAck.v1.${userId}`
}

function readAckedThreadKeys(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.every((x) => typeof x === 'string')) return new Set()
    return new Set(parsed)
  } catch {
    return new Set()
  }
}

function writeAckedThreadKeys(userId: string, keys: Set<string>) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify([...keys]))
  } catch {
    /* quota / private mode */
  }
}

export function isGroupBotThreadAcked(userId: string | null | undefined, threadKey: string): boolean {
  if (!userId || !threadKey) return false
  return readAckedThreadKeys(userId).has(threadKey)
}

export function markGroupBotThreadAcked(userId: string | null | undefined, threadKey: string): void {
  if (!userId || !threadKey) return
  const set = readAckedThreadKeys(userId)
  if (set.has(threadKey)) return
  set.add(threadKey)
  writeAckedThreadKeys(userId, set)
}

/** Messages seed locaux (bot bienvenue + aperçu débat), pas les UUID cloud. */
export function isGroupBotSeedMessageId(id: string): boolean {
  return id.startsWith('seed-')
}

export function mergeGroupThreadWithOptionalSeed(
  userId: string | null | undefined,
  threadKey: string,
  cloudMessages: Message[],
  buildSeed: () => Message[],
  maxMessages: number,
): Message[] {
  const cloud = cloudMessages
    .filter((m) => !isGroupBotSeedMessageId(m.id))
    .sort((a, b) => a.createdAt - b.createdAt)

  let seed: Message[] = []
  if (!isGroupBotThreadAcked(userId, threadKey)) {
    seed = buildSeed()
    if (seed.length) markGroupBotThreadAcked(userId, threadKey)
  }

  return [...seed, ...cloud]
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(-maxMessages)
}
