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

/** Charge le profil public (pseudo + avatar modulaire) d’un autre joueur depuis Supabase. */
export function usePeerPublicProfile(peer: User | undefined, selfUserId: string | undefined) {
  const [cloudProfile, setCloudProfile] = useState<UserProfile | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setCloudProfile(null)
    setDisplayName(null)
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
    setLoading(true)

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
        })
      })
      .catch(() => {
        if (!cancelled) {
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
  }, [peer?.id, peer?.isTalkFootBot, selfUserId])

  return { cloudProfile, displayName, loading }
}
