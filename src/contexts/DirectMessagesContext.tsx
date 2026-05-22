import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { friendDmThreadId } from '../data/directMessageConstants'
import { coachDirectThread } from '../data/directMessagesMock'
import type { DirectThread } from '../data/directMessagesMock'
import { useDirectMessages } from '../hooks/useDirectMessages'
import { useCloudFriends } from '../hooks/useCloudFriends'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { ensureSupabaseChatSession } from '../lib/supabase/ensureSession'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import {
  acceptFriendRequest as acceptFriendRequestApi,
  sendFriendRequest as sendFriendRequestApi,
} from '../lib/supabase/friendships'

type DirectMessagesApi = ReturnType<typeof useDirectMessages> & {
  setActiveDmUiThreadId: (id: string | null) => void
  /** Liste des conversations (Coach + amis démo ou amis cloud). */
  directThreads: DirectThread[]
  friendsLoading: boolean
  refreshFriends: () => Promise<void>
  /** Ami accepté côté Supabase (UUID). */
  isCloudFriend: (peerId: string) => boolean
  /** Demandes reçues (pending, l’autre a initié). */
  incomingFriendRequests: { requesterId: string; displayName: string }[]
  sendFriendRequest: (peerId: string) => Promise<{ ok: boolean; error?: string }>
  acceptFriendRequest: (requesterId: string) => Promise<{ ok: boolean; error?: string }>
}

const DirectMessagesContext = createContext<DirectMessagesApi | null>(null)

export function DirectMessagesProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth()
  const [activeDmUiThreadId, setActiveDmUiThreadId] = useState<string | null>(null)
  const cf = useCloudFriends()

  const directThreads = useMemo((): DirectThread[] => {
    const bot = coachDirectThread

    if (!isSupabaseConfigured() || !cf.hasSupabaseFriends) {
      return [bot]
    }
    if (cf.loading) {
      return [bot]
    }

    const cloudPart: DirectThread[] = cf.acceptedPeers.map((p) => ({
      id: friendDmThreadId(p.id),
      peer: {
        id: p.id,
        username: p.displayName,
        avatarSeed: p.id.replace(/-/g, '').slice(0, 12),
        accent: 'violet',
      },
      lastPreview: 'Ouvrir la conversation',
      lastAtLabel: '—',
      unread: false,
    }))
    return [bot, ...cloudPart]
  }, [cf.hasSupabaseFriends, cf.loading, cf.acceptedPeers])

  const p2pKeys = cf.p2pThreadKeys
  const dm = useDirectMessages(activeDmUiThreadId, p2pKeys)

  const refreshFriends = useCallback(async () => {
    await cf.refresh()
  }, [cf])

  const isCloudFriend = useCallback(
    (peerId: string) => cf.acceptedPeers.some((p) => p.id === peerId),
    [cf.acceptedPeers],
  )

  const sendFriendRequest = useCallback(
    async (peerId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!authUser?.id || !isSupabaseConfigured()) return { ok: false, error: 'offline' }
      const sb = getSupabaseBrowserClient()
      if (!sb) return { ok: false, error: 'no_client' }
      const session = await ensureSupabaseChatSession(sb)
      if (!session) return { ok: false, error: 'session' }
      const out = await sendFriendRequestApi(sb, authUser.id, peerId)
      if (out.ok) await cf.refresh()
      return out
    },
    [authUser?.id, cf.refresh],
  )

  const acceptFriendRequest = useCallback(
    async (requesterId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!authUser?.id || !isSupabaseConfigured()) return { ok: false, error: 'offline' }
      const sb = getSupabaseBrowserClient()
      if (!sb) return { ok: false, error: 'no_client' }
      const session = await ensureSupabaseChatSession(sb)
      if (!session) return { ok: false, error: 'session' }
      const out = await acceptFriendRequestApi(sb, authUser.id, requesterId)
      if (out.ok) await cf.refresh()
      return out
    },
    [authUser?.id, cf.refresh],
  )

  const value = useMemo(
    () => ({
      ...dm,
      setActiveDmUiThreadId,
      directThreads,
      friendsLoading: cf.loading,
      refreshFriends,
      isCloudFriend,
      incomingFriendRequests: cf.incomingPendingFrom,
      sendFriendRequest,
      acceptFriendRequest,
    }),
    [
      dm,
      directThreads,
      cf.loading,
      cf.incomingPendingFrom,
      refreshFriends,
      isCloudFriend,
      sendFriendRequest,
      acceptFriendRequest,
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
