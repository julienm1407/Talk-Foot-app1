import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { syncClerkProfileToChatActor } from '../lib/supabase/chatActorProfile'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { useTalkFootCloudSession } from './useTalkFootCloudSession'

/**
 * UUID Supabase (`auth.uid()`) utilisé pour tribunes, amis et MP.
 * En mode Clerk, distinct de `authUser.id` (identifiant Clerk).
 */
export function useTalkFootChatActorId(): string | null {
  const { user: authUser } = useAuth()
  const { ensureCloudSession } = useTalkFootCloudSession()
  const [actorId, setActorId] = useState<string | null>(null)

  useEffect(() => {
    if (!authUser?.id || !isSupabaseConfigured()) {
      setActorId(null)
      return
    }
    const sb = getSupabaseBrowserClient()
    if (!sb) {
      setActorId(null)
      return
    }

    let cancelled = false
    void (async () => {
      const session = await ensureCloudSession()
      if (cancelled) return
      const chatActorId = session?.user.id ?? null
      setActorId(chatActorId)
      if (!chatActorId || chatActorId === authUser.id) return
      try {
        await syncClerkProfileToChatActor(sb, authUser.id, chatActorId, authUser.displayName)
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[TalkFoot] sync profil chat actor:', err)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authUser?.id, authUser?.displayName, ensureCloudSession])

  return actorId
}
