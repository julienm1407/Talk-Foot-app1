import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import {
  fetchFriendshipsForUser,
  fetchProfilesByIds,
  peerIdFromFriendshipRow,
  p2pKeysForPeers,
  type FriendshipRow,
} from '../lib/supabase/friendships'

export type CloudFriendPeer = {
  id: string
  displayName: string
}

/**
 * Amis Supabase (friendships + profils) — utilisé pour la liste MP et la synchro des fils p2p.
 */
export function useCloudFriends() {
  const { user: authUser } = useAuth()
  const myId = authUser?.id
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

  const p2pThreadKeys = useMemo(() => (myId ? p2pKeysForPeers(myId, acceptedPeers.map((p) => p.id)) : []), [myId, acceptedPeers])

  return {
    loading,
    refresh,
    acceptedPeers,
    incomingPendingFrom,
    p2pThreadKeys,
    hasSupabaseFriends: isSupabaseConfigured() && Boolean(myId),
  }
}
