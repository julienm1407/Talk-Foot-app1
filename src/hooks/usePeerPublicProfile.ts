import { useEffect, useState } from 'react'
import type { User } from '../types/chat'
import type { UserProfile } from '../types/profile'
import { mergeCharacterLook } from '../data/characterPresets'
import { mergeUserAppState } from '../data/userAppStateDefaults'
import { fetchTalkfootProfileSnapshot } from '../lib/supabase/profileAppState'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { buildChatPeerProfile } from '../utils/chatPeerProfile'
import {
  modularAvatarFromSnapshot,
  shouldFetchCloudChatAvatar,
} from '../utils/chatAuthorModularAvatar'

/** Charge le profil public (avatar modulaire, photo perso) d’un autre joueur depuis Supabase. */
export function usePeerPublicProfile(peer: User | undefined, selfUserId: string | undefined) {
  const [cloudProfile, setCloudProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setCloudProfile(null)
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

    void fetchTalkfootProfileSnapshot(sb, peer.id)
      .then((snap) => {
        if (cancelled || !snap) return
        const merged = mergeUserAppState(snap.appState)
        const modular = modularAvatarFromSnapshot(snap)
        const base = buildChatPeerProfile({
          ...peer,
          ...(modular ? { modularAvatar: modular } : {}),
        })
        setCloudProfile({
          ...base,
          ...merged.profile,
          characterLook: mergeCharacterLook(
            merged.profile.characterLook ?? base.characterLook,
          ),
          ...(modular ? { modularAvatar: modular } : {}),
          ...(merged.profile.profilePhotoDataUrl
            ? { profilePhotoDataUrl: merged.profile.profilePhotoDataUrl }
            : {}),
        })
      })
      .catch(() => {
        if (!cancelled) setCloudProfile(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [peer?.id, peer?.isTalkFootBot, selfUserId])

  return { cloudProfile, loading }
}
