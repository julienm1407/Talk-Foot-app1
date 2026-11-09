import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { ensureTalkFootSupabaseSession } from '../lib/supabase/talkfootSession'
import { syncRealtimeAuth } from '../lib/supabase/syncRealtimeAuth'
import {
  fetchFriendshipsForUser,
  fetchProfilesByIds,
  peerIdFromFriendshipRow,
  p2pKeysForPeers,
  type FriendshipRow,
} from '../lib/supabase/friendships'
import { useTalkFootChatActorId } from './useTalkFootChatActorId'

export type CloudFriendPeer = {
  id: string
  displayName: string
}

/**
 * Amis Supabase (friendships + profils) — utilisé pour la liste MP et la synchro des fils p2p.
 */
export function useCloudFriends() {
  const { user: authUser } = useAuth()
  const chatActorId = useTalkFootChatActorId()
  const myId = chatActorId
  const [rows, setRows] = useState<FriendshipRow[]>([])
  const [profiles, setProfiles] = useState<Map<string, { display_name: string | null }>>(new Map())
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!myId || !isSupabaseConfigured()) {
      setRows([])
      setProfiles(new Map())
      return
    }
    const sb = getSupabaseBrowserClient()
    if (!sb) return

    setLoading(true)
    try {
      const list = await fetchFriendshipsForUser(sb, myId)
      setRows(list)
      const peerIds = list.map((r) => peerIdFromFriendshipRow(r, myId))
      const pmap = await fetchProfilesByIds(sb, peerIds)
      setProfiles(pmap)
    } catch {
      setRows([])
      setProfiles(new Map())
    } finally {
      setLoading(false)
    }
  }, [myId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!myId || !isSupabaseConfigured()) return
    const sb = getSupabaseBrowserClient()
    if (!sb) return

    let cancelled = false
    const mountId = Date.now()

    const run = async () => {
      await ensureTalkFootSupabaseSession(sb)
      if (cancelled) return
      await syncRealtimeAuth(sb)
      if (cancelled) return

      const channel = sb
        .channel(`friendships:${myId}:${mountId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'friendships' },
          (payload) => {
            const row = (payload.new ?? payload.old) as {
              user_low?: string
              user_high?: string
            } | null
            if (!row) {
              void refresh()
              return
            }
            if (row.user_low === myId || row.user_high === myId) void refresh()
          },
        )
        .subscribe((status) => {
          if (import.meta.env.DEV && status === 'CHANNEL_ERROR') {
            console.warn('[Talk Foot] friendships realtime:', status)
          }
          if (status === 'SUBSCRIBED') void refresh()
        })

      if (cancelled) {
        void sb.removeChannel(channel)
        return
      }
      return channel
    }

    let channel: ReturnType<typeof sb.channel> | undefined
    void run().then((ch) => {
      channel = ch
    })

    return () => {
      cancelled = true
      if (channel) void sb.removeChannel(channel)
    }
  }, [myId, refresh])

  useEffect(() => {
    if (!myId || !isSupabaseConfigured()) return
    const onVis = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    const onFocus = () => void refresh()
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', onFocus)
    const pollId = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, 8_000)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('focus', onFocus)
      window.clearInterval(pollId)
    }
  }, [myId, refresh])

  const acceptedPeers = useMemo((): CloudFriendPeer[] => {
    if (!myId) return []
    return rows
      .filter((r) => r.status === 'accepted')
      .map((r) => {
        const pid = peerIdFromFriendshipRow(r, myId)
        const p = profiles.get(pid)
        return {
          id: pid,
          displayName: (p?.display_name && p.display_name.trim()) || 'Supporter',
        }
      })
  }, [rows, profiles, myId])

  const incomingPendingFrom = useMemo(() => {
    if (!myId) return [] as { requesterId: string; displayName: string }[]
    return rows
      .filter((r) => r.status === 'pending' && r.requested_by !== myId)
      .map((r) => {
        const rid = r.requested_by
        const p = profiles.get(rid)
        return { requesterId: rid, displayName: (p?.display_name && p.display_name.trim()) || 'Supporter' }
      })
  }, [rows, profiles, myId])

  const outgoingPendingTo = useMemo(() => {
    if (!myId) return [] as string[]
    return rows
      .filter((r) => r.status === 'pending' && r.requested_by === myId)
      .map((r) => peerIdFromFriendshipRow(r, myId))
  }, [rows, myId])

  const p2pThreadKeys = useMemo(() => (myId ? p2pKeysForPeers(myId, acceptedPeers.map((p) => p.id)) : []), [myId, acceptedPeers])

  return {
    loading,
    refresh,
    acceptedPeers,
    incomingPendingFrom,
    outgoingPendingTo,
    friendshipRows: rows,
    p2pThreadKeys,
    chatActorId: myId,
    hasSupabaseFriends: isSupabaseConfigured() && Boolean(authUser?.id && myId),
  }
}
