import { useEffect, useRef, useState } from 'react'
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
import { peekChatAuthorAvatarCache } from './useChatAuthorModularAvatars'

const PEER_PROFILE_REFRESH_MS = 12_000
/** Au-delà, on lève le skeleton même si le RPC trainaille. */
const PEER_PROFILE_UI_TIMEOUT_MS = 1_200

function profileFromPeerAndCache(
  peer: User,
  cached: NonNullable<ReturnType<typeof peekChatAuthorAvatarCache>>,
): { profile: UserProfile; displayName: string | null } {
  const modular = cached.modularAvatar ?? undefined
  const photo = cached.profilePhotoDataUrl ?? undefined
  const base = buildChatPeerProfile({
    ...peer,
    ...(modular ? { modularAvatar: modular } : {}),
    ...(photo ? { profilePhotoDataUrl: photo } : {}),
  })
  return {
    displayName: cached.displayName,
    profile: {
      ...base,
      ...(modular ? { modularAvatar: modular } : {}),
      ...(photo ? { profilePhotoDataUrl: photo } : {}),
    },
  }
}

/** Charge le profil public (pseudo + avatar modulaire) d’un autre joueur depuis Supabase. */
export function usePeerPublicProfile(peer: User | undefined, selfUserId: string | undefined) {
  const [cloudProfile, setCloudProfile] = useState<UserProfile | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const peerRef = useRef(peer)
  peerRef.current = peer

  const peerId = peer?.id
  const peerIsBot = Boolean(peer?.isTalkFootBot)

  useEffect(() => {
    if (!peerId) return
    const id = window.setInterval(() => setRefreshTick((n) => n + 1), PEER_PROFILE_REFRESH_MS)
    const onVis = () => {
      if (document.visibilityState === 'visible') setRefreshTick((n) => n + 1)
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [peerId])

  useEffect(() => {
    const currentPeer = peerRef.current
    if (!peerId || !currentPeer || peerIsBot || !isSupabaseConfigured()) {
      setCloudProfile(null)
      setDisplayName(null)
      setLoading(false)
      return
    }
    if (!shouldFetchCloudChatAvatar(peerId, selfUserId ?? '')) {
      setCloudProfile(null)
      setDisplayName(null)
      setLoading(false)
      return
    }

    const cached = peekChatAuthorAvatarCache(peerId)
    if (cached) {
      const seeded = profileFromPeerAndCache(currentPeer, cached)
      setCloudProfile(seeded.profile)
      setDisplayName(seeded.displayName)
      setLoading(false)
    } else if (refreshTick === 0) {
      // Profil provisoire immédiat (pseudo du classement) — pas d’écran noir.
      setCloudProfile(buildChatPeerProfile(currentPeer))
      setDisplayName(null)
      setLoading(true)
    }

    const sb = getSupabaseBrowserClient()
    if (!sb) {
      setLoading(false)
      return
    }

    let cancelled = false
    const uiTimeout = window.setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, PEER_PROFILE_UI_TIMEOUT_MS)

    void fetchTalkfootPublicProfiles(sb, [peerId])
      .then((rows) => {
        if (cancelled) return
        const row = rows[0]
        if (!row) return
        const modular = modularAvatarFromPublicRow(row.modularAvatar)
        const profilePhotoDataUrl = profilePhotoFromPublicRow(row.profilePhotoDataUrl)
        const cloudName = row.displayName?.trim() || null
        const base = buildChatPeerProfile({
          ...currentPeer,
          id: peerId,
          ...(modular ? { modularAvatar: modular } : {}),
          ...(profilePhotoDataUrl ? { profilePhotoDataUrl } : {}),
        })
        setDisplayName(cloudName)
        setCloudProfile({
          ...base,
          ...(modular ? { modularAvatar: modular } : {}),
          ...(profilePhotoDataUrl ? { profilePhotoDataUrl } : {}),
          cdmBetaParticipant: row.cdmBetaParticipant === true,
        })
      })
      .catch(() => {
        /* garder provisoire / cache */
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
        window.clearTimeout(uiTimeout)
      })

    return () => {
      cancelled = true
      window.clearTimeout(uiTimeout)
    }
  }, [peerId, peerIsBot, selfUserId, refreshTick])

  return { cloudProfile, displayName, loading }
}
