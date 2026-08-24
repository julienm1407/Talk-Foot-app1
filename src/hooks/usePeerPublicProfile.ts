import { useEffect, useState } from 'react'
import type { User } from '../types/chat'
import type { UserProfile } from '../types/profile'
import { fetchTalkfootPublicProfiles } from '../lib/supabase/profileAppState'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { buildChatPeerProfile } from '../utils/chatPeerProfile'
import {
  modularAvatarFromPublicRow,
  profilePhotoFromPublicRow,
  shouldFetchCloudChatAvatar,
} from '../utils/chatAuthorModularAvatar'

const PEER_PROFILE_REFRESH_MS = 12_000

/** Charge le profil public (pseudo + avatar modulaire) d’un autre joueur depuis Supabase. */
export function usePeerPublicProfile(peer: User | undefined, selfUserId: string | undefined) {
  const [cloudProfile, setCloudProfile] = useState<UserProfile | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    if (!peer?.id) return
    const id = window.setInterval(() => setRefreshTick((n) => n + 1), PEER_PROFILE_REFRESH_MS)
    const onVis = () => {
      if (document.visibilityState === 'visible') setRefreshTick((n) => n + 1)
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [peer?.id])

  useEffect(() => {
    if (refreshTick === 0) {
      setCloudProfile(null)
      setDisplayName(null)
    }
    if (!peer || peer.isTalkFootBot || !isSupabaseConfigured()) {
      setLoading(false)
      return
    }
    if (!shouldFetchCloudChatAvatar(peer.id, selfUserId ?? '')) {
      setLoading(false)
      return
    }

    const sb = getSupabaseBrowserClient()
    if (!sb) {
      setLoading(false)
      return
    }

    let cancelled = false
    if (refreshTick === 0) setLoading(true)

    void fetchTalkfootPublicProfiles(sb, [peer.id])
      .then((rows) => {
        if (cancelled) return
        const row = rows[0]
        const modular = row ? modularAvatarFromPublicRow(row.modularAvatar) : undefined
        const profilePhotoDataUrl = row ? profilePhotoFromPublicRow(row.profilePhotoDataUrl) : undefined
        const cloudName = row?.displayName?.trim() || null
        const base = buildChatPeerProfile({
          ...peer,
          ...(modular ? { modularAvatar: modular } : {}),
          ...(profilePhotoDataUrl ? { profilePhotoDataUrl } : {}),
        })
        setDisplayName(cloudName)
        setCloudProfile({
          ...base,
          ...(modular ? { modularAvatar: modular } : {}),
          ...(profilePhotoDataUrl ? { profilePhotoDataUrl } : {}),
          cdmBetaParticipant: row?.cdmBetaParticipant === true,
        })
      })
      .catch(() => {
        if (!cancelled && refreshTick === 0) {
          setCloudProfile(null)
          setDisplayName(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [peer?.id, peer?.isTalkFootBot, selfUserId, refreshTick, peer])

  return { cloudProfile, displayName, loading }
}
