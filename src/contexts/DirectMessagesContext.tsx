import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { friendDmThreadId } from '../data/directMessageConstants'
import { coachDirectThread } from '../data/directMessagesMock'
import type { DirectThread } from '../data/directMessagesMock'
import { useDirectMessages } from '../hooks/useDirectMessages'
import { useCloudFriends } from '../hooks/useCloudFriends'
import { useTalkFootChatActorId } from '../hooks/useTalkFootChatActorId'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { ensureTalkFootSupabaseSession } from '../lib/supabase/talkfootSession'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { p2pKeysForPeers } from '../lib/supabase/friendships'
import {
  discoverThreadsFromCloudKeys,
  enrichDirectThread,
  sortDirectThreadsForInbox,
} from '../utils/directThreadEnrichment'
import {
  acceptFriendRequest as acceptFriendRequestApi,
  sendFriendRequest as sendFriendRequestApi,
  declineFriendRequest as declineFriendRequestApi,
} from '../lib/supabase/friendships'

export type RegisterPeerForPrivateChatInput = {
  id: string
  username: string
  avatarSeed?: string
  accent?: string
}

type DirectMessagesApi = ReturnType<typeof useDirectMessages> & {
  setActiveDmUiThreadId: (id: string | null) => void
  /** Liste des conversations (Coach + amis démo ou amis cloud). */
  directThreads: DirectThread[]
  friendsLoading: boolean
  refreshFriends: () => Promise<void>
  /** Ami accepté côté Supabase (UUID). */
  isCloudFriend: (peerId: string) => boolean
  hasOutgoingFriendRequestTo: (peerId: string) => boolean
  hasIncomingFriendRequestFrom: (peerId: string) => boolean
  /** Demandes reçues (pending, l’autre a initié). */
  incomingFriendRequests: { requesterId: string; displayName: string }[]
  /** Prépare le fil MP cloud (ami ou non) avant ouverture du panneau. */
  registerPeerForPrivateChat: (peer: RegisterPeerForPrivateChatInput) => void
  sendFriendRequest: (peerId: string) => Promise<{ ok: boolean; error?: string }>
  acceptFriendRequest: (requesterId: string) => Promise<{ ok: boolean; error?: string }>
  declineFriendRequest: (requesterId: string) => Promise<{ ok: boolean; error?: string }>
}

const DirectMessagesContext = createContext<DirectMessagesApi | null>(null)

function peerToThread(peer: RegisterPeerForPrivateChatInput): DirectThread {
  return {
    id: friendDmThreadId(peer.id),
    peer: {
      id: peer.id,
      username: peer.username,
      avatarSeed: peer.avatarSeed ?? peer.id.replace(/-/g, '').slice(0, 12),
      accent: (peer.accent as DirectThread['peer']['accent']) ?? 'violet',
    },
    lastPreview: 'Ouvrir la conversation',
    lastAtLabel: '—',
    unread: false,
  }
}

export function DirectMessagesProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth()
  const chatActorId = useTalkFootChatActorId()
  const [activeDmUiThreadId, setActiveDmUiThreadId] = useState<string | null>(null)
  const [extraPeerThreads, setExtraPeerThreads] = useState<DirectThread[]>([])
  const cf = useCloudFriends()

  const directThreads = useMemo((): DirectThread[] => {
    const bot = coachDirectThread

    if (!isSupabaseConfigured() || !cf.hasSupabaseFriends) {
      return [bot, ...extraPeerThreads]
    }
    if (cf.loading) {
      return [bot, ...extraPeerThreads]
    }

    const cloudPart: DirectThread[] = cf.acceptedPeers.map((p) =>
      peerToThread({ id: p.id, username: p.displayName }),
    )
    const byId = new Map<string, DirectThread>()
    for (const t of [bot, ...cloudPart, ...extraPeerThreads]) {
      byId.set(t.id, t)
    }
    return [...byId.values()]
  }, [cf.hasSupabaseFriends, cf.loading, cf.acceptedPeers, extraPeerThreads])

  const allP2pPeerIds = useMemo(() => {
    const ids = new Set(cf.acceptedPeers.map((p) => p.id))
    for (const t of extraPeerThreads) {
      if (t.peer.id) ids.add(t.peer.id)
    }
    return [...ids]
  }, [cf.acceptedPeers, extraPeerThreads])

  const p2pKeys = useMemo(
    () => (chatActorId ? p2pKeysForPeers(chatActorId, allP2pPeerIds) : []),
    [chatActorId, allP2pPeerIds],
  )

  const dm = useDirectMessages(activeDmUiThreadId, p2pKeys, chatActorId)

  const directThreadsEnriched = useMemo((): DirectThread[] => {
    const baseIds = new Set(directThreads.map((t) => t.id))
    const discovered = chatActorId
      ? discoverThreadsFromCloudKeys(dm.cloudByKey, chatActorId, baseIds, (peerId) =>
          cf.acceptedPeers.find((p) => p.id === peerId)?.displayName,
        )
      : []
    const merged = [...directThreads, ...discovered].map((t) =>
      enrichDirectThread(t, dm.mergedFor(t.id), dm.visitedIds, activeDmUiThreadId),
    )
    return sortDirectThreadsForInbox(merged)
  }, [
    directThreads,
    dm.cloudByKey,
    dm.mergedFor,
    dm.visitedIds,
    activeDmUiThreadId,
    chatActorId,
    cf.acceptedPeers,
  ])

  const refreshFriends = useCallback(async () => {
    await cf.refresh()
  }, [cf])

  const isCloudFriend = useCallback(
    (peerId: string) => cf.acceptedPeers.some((p) => p.id === peerId),
    [cf.acceptedPeers],
  )

  const hasOutgoingFriendRequestTo = useCallback(
    (peerId: string) => cf.outgoingPendingTo.includes(peerId),
    [cf.outgoingPendingTo],
  )

  const hasIncomingFriendRequestFrom = useCallback(
    (peerId: string) => cf.incomingPendingFrom.some((r) => r.requesterId === peerId),
    [cf.incomingPendingFrom],
  )

  const registerPeerForPrivateChat = useCallback((peer: RegisterPeerForPrivateChatInput) => {
    const thread = peerToThread(peer)
    setExtraPeerThreads((prev) => {
      if (prev.some((t) => t.id === thread.id)) return prev
      return [...prev, thread]
    })
  }, [])

  const sendFriendRequest = useCallback(
    async (peerId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!authUser?.id || !isSupabaseConfigured()) return { ok: false, error: 'offline' }
      const sb = getSupabaseBrowserClient()
      if (!sb) return { ok: false, error: 'no_client' }
      const session = await ensureTalkFootSupabaseSession(sb)
      const myId = session?.user.id
      if (!myId) return { ok: false, error: 'session' }
      const out = await sendFriendRequestApi(sb, myId, peerId, {
        requesterDisplayName: authUser.displayName,
      })
      if (out.ok) await cf.refresh()
      return out
    },
    [authUser?.displayName, authUser?.id, cf.refresh],
  )

  const acceptFriendRequest = useCallback(
    async (requesterId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!authUser?.id || !isSupabaseConfigured()) return { ok: false, error: 'offline' }
      const sb = getSupabaseBrowserClient()
      if (!sb) return { ok: false, error: 'no_client' }
      const session = await ensureTalkFootSupabaseSession(sb)
      const myId = session?.user.id
      if (!myId) return { ok: false, error: 'session' }
      const out = await acceptFriendRequestApi(sb, myId, requesterId)
      if (out.ok) await cf.refresh()
      return out
    },
    [authUser?.id, cf.refresh],
  )

  const declineFriendRequest = useCallback(
    async (requesterId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!authUser?.id || !isSupabaseConfigured()) return { ok: false, error: 'offline' }
      const sb = getSupabaseBrowserClient()
      if (!sb) return { ok: false, error: 'no_client' }
      const session = await ensureTalkFootSupabaseSession(sb)
      const myId = session?.user.id
      if (!myId) return { ok: false, error: 'session' }
      const out = await declineFriendRequestApi(sb, myId, requesterId)
      if (out.ok) await cf.refresh()
      return out
    },
    [authUser?.id, cf.refresh],
  )

  const value = useMemo(
    () => ({
      ...dm,
      setActiveDmUiThreadId,
      directThreads: directThreadsEnriched,
      friendsLoading: cf.loading,
      refreshFriends,
      isCloudFriend,
      hasOutgoingFriendRequestTo,
      hasIncomingFriendRequestFrom,
      incomingFriendRequests: cf.incomingPendingFrom,
      registerPeerForPrivateChat,
      sendFriendRequest,
      acceptFriendRequest,
      declineFriendRequest,
    }),
    [
      dm,
      directThreadsEnriched,
      cf.loading,
      cf.incomingPendingFrom,
      refreshFriends,
      isCloudFriend,
      hasOutgoingFriendRequestTo,
      hasIncomingFriendRequestFrom,
      registerPeerForPrivateChat,
      sendFriendRequest,
      acceptFriendRequest,
      declineFriendRequest,
    ],
  )

  return <DirectMessagesContext.Provider value={value}>{children}</DirectMessagesContext.Provider>
}

export function useDirectMessagesContext(): DirectMessagesApi {
  const ctx = useContext(DirectMessagesContext)
  if (!ctx) {
    throw new Error('useDirectMessagesContext doit être utilisé sous DirectMessagesProvider')
  }
  return ctx
}

export function useDirectMessagesOptional(): DirectMessagesApi | null {
  return useContext(DirectMessagesContext)
}
