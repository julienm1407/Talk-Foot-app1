import {
  TALKFOOT_BOT_DM_THREAD_ID,
  friendDmThreadId,
  parseFriendPeerIdFromThreadId,
} from '../data/directMessageConstants'
import type { DirectMessageLine, DirectThread } from '../data/directMessagesMock'
import { peerIdFromP2pThreadKey, uiThreadIdFromCloudKey } from './cloudDmThread'

export function enrichDirectThread(
  thread: DirectThread,
  lines: DirectMessageLine[],
  lastReadByThread: Record<string, string | undefined>,
  activeUiThreadId: string | null,
): DirectThread {
  const last = lines[lines.length - 1]
  const lastReadId = lastReadByThread[thread.id]
  const unread = Boolean(
    last &&
      !last.fromMe &&
      last.id !== lastReadId &&
      activeUiThreadId !== thread.id,
  )
  return {
    ...thread,
    lastPreview: last?.body ?? thread.lastPreview,
    lastAtLabel: last?.atLabel ?? thread.lastAtLabel,
    unread,
  }
}

export function sortDirectThreadsForInbox(threads: DirectThread[]): DirectThread[] {
  return [...threads].sort((a, b) => {
    if (a.unread !== b.unread) return a.unread ? -1 : 1
    const aBot = a.id === TALKFOOT_BOT_DM_THREAD_ID
    const bBot = b.id === TALKFOOT_BOT_DM_THREAD_ID
    if (aBot !== bBot) return aBot ? 1 : -1
    return 0
  })
}

/** Ouvre en priorité une conversation humaine non lue (pas le Coach). */
export function pickThreadIdToOpenOnInbox(threads: DirectThread[]): string | undefined {
  const humanUnread = threads.find(
    (t) => t.unread && t.id !== TALKFOOT_BOT_DM_THREAD_ID,
  )
  if (humanUnread) return humanUnread.id
  const anyUnread = threads.find((t) => t.unread)
  return anyUnread?.id
}

export function discoverThreadsFromCloudKeys(
  cloudByKey: Record<string, DirectMessageLine[]>,
  myAuthId: string,
  existingThreadIds: Set<string>,
  peerDisplayName: (peerId: string) => string | undefined,
): DirectThread[] {
  const out: DirectThread[] = []
  for (const key of Object.keys(cloudByKey)) {
    const uiId = uiThreadIdFromCloudKey(key, myAuthId)
    if (!uiId || existingThreadIds.has(uiId) || uiId === TALKFOOT_BOT_DM_THREAD_ID) continue
    const peerId = parseFriendPeerIdFromThreadId(uiId) ?? peerIdFromP2pThreadKey(key, myAuthId)
    if (!peerId) continue
    const name = peerDisplayName(peerId) ?? 'Supporter'
    out.push({
      id: friendDmThreadId(peerId),
      peer: {
        id: peerId,
        username: name,
        avatarSeed: peerId.replace(/-/g, '').slice(0, 12),
        accent: 'violet',
      },
      lastPreview: 'Nouveau message',
      lastAtLabel: '—',
      unread: false,
    })
    existingThreadIds.add(uiId)
  }
  return out
}
