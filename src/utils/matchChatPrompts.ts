export type MatchChatPromptId = 'exact_score' | 'dream_xi' | 'first_scorer'

export type MatchChatPromptDef = {
  id: MatchChatPromptId
  label: string
  icon: string
}

export const MATCH_CHAT_PROMPTS: readonly MatchChatPromptDef[] = [
  { id: 'exact_score', label: 'Ton score exact ?', icon: '🎯' },
  { id: 'dream_xi', label: 'Ta compo rêvée ?', icon: '📋' },
  { id: 'first_scorer', label: 'Qui marque en premier ?', icon: '⚡' },
] as const

export type MatchChatPromptStarter = {
  text: string
  /** Index du curseur ; pour le score, sur le premier « ? ». */
  cursor: number
  selectNext?: number
}

function norm(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export function matchChatPromptStarter(
  id: MatchChatPromptId,
  homeShort: string,
  awayShort: string,
): MatchChatPromptStarter {
  if (id === 'exact_score') {
    const home = homeShort.trim() || 'Domicile'
    const away = awayShort.trim() || 'Extérieur'
    const text = `Mon score : ${home} ? - ? ${away}`
    const cursor = text.indexOf('?')
    return { text, cursor: cursor >= 0 ? cursor : text.length, selectNext: cursor >= 0 ? cursor + 1 : undefined }
  }
  if (id === 'dream_xi') {
    const text = 'Ma compo : '
    return { text, cursor: text.length }
  }
  const text = 'Le premier buteur : '
  return { text, cursor: text.length }
}

/** Libellé de chip / question — ne doit jamais être publié comme message joueur. */
export function isBareMatchChatPromptQuestion(raw: string): boolean {
  const t = norm(raw).replace(/[?？]/g, '?')
  if (!t) return false
  const labels = MATCH_CHAT_PROMPTS.map((p) => norm(p.label).replace(/[?？]/g, '?'))
  if (labels.includes(t)) return true
  const folded = t.toLowerCase()
  return (
    folded === 'ton score exact ?' ||
    folded === 'ta compo revee ?' ||
    folded === 'ta compo rêvée ?' ||
    folded === 'qui marque en premier ?'
  )
}

export function matchChatPromptIdFromReply(raw: string): MatchChatPromptId | null {
  const t = norm(raw)
  if (!t) return null
  if (/^mon score\s*:/i.test(t)) return 'exact_score'
  if (/^ma compo\s*:/i.test(t)) return 'dream_xi'
  if (/^(le premier buteur|premier buteur)\s*:/i.test(t)) return 'first_scorer'
  if (/^mon homme du match\s*:/i.test(t)) return 'first_scorer'
  return null
}

export function isUnfilledMatchChatPromptDraft(raw: string, homeShort: string, awayShort: string): boolean {
  const t = norm(raw)
  if (!t) return true
  for (const p of MATCH_CHAT_PROMPTS) {
    const starter = matchChatPromptStarter(p.id, homeShort, awayShort).text
    if (norm(starter) === t) return true
  }
  if (/^mon score\s*:/i.test(t) && t.includes('?')) return true
  if (/^ma compo\s*:\s*$/i.test(t)) return true
  if (/^(le premier buteur|mon homme du match)\s*:\s*$/i.test(t)) return true
  return false
}

const storageKey = (matchId: string, userId: string) => `tf:chat-prompt-used:${matchId}:${userId}`

export function readUsedMatchChatPrompts(matchId: string, userId: string): Set<MatchChatPromptId> {
  const out = new Set<MatchChatPromptId>()
  if (!matchId || !userId || typeof localStorage === 'undefined') return out
  try {
    const raw = localStorage.getItem(storageKey(matchId, userId))
    if (!raw) return out
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return out
    for (const id of parsed) {
      if (id === 'exact_score' || id === 'dream_xi' || id === 'first_scorer') out.add(id)
    }
  } catch {
    /* ignore */
  }
  return out
}

export function rememberUsedMatchChatPrompt(matchId: string, userId: string, id: MatchChatPromptId): Set<MatchChatPromptId> {
  const next = readUsedMatchChatPrompts(matchId, userId)
  next.add(id)
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey(matchId, userId), JSON.stringify([...next]))
    }
  } catch {
    /* ignore */
  }
  return next
}

export function usedMatchChatPromptsFromOwnMessages(texts: string[]): Set<MatchChatPromptId> {
  const out = new Set<MatchChatPromptId>()
  for (const text of texts) {
    const id = matchChatPromptIdFromReply(text)
    if (id) out.add(id)
  }
  return out
}

export function salonScoreExactOfficialBody(): string {
  return 'Question du salon 🎯 : ton score exact ?'
}
