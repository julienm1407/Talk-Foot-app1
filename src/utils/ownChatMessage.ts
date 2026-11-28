import type { Message } from '../types/chat'

export function isOwnChatTextEditable(
  m: Pick<Message, 'gifUrl' | 'emoteId' | 'groupScarf' | 'text'>,
): boolean {
  if (m.gifUrl || m.emoteId || m.groupScarf) return false
  const text = typeof m.text === 'string' ? m.text.trim() : ''
  if (!text) return false
  if (text === '[GIF]' || text === '[Emote]') return false
  return true
}
