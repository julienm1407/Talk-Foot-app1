import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { ensureTalkFootSupabaseSession } from '../lib/supabase/talkfootSession'

/**
 * UUID Supabase (`auth.uid()`) utilisé pour tribunes, amis et MP.
 * En mode Clerk, distinct de `authUser.id` (identifiant Clerk).
 */
export function useTalkFootChatActorId(): string | null {
  const { user: authUser } = useAuth()
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
    void ensureTalkFootSupabaseSession(sb).then((session) => {
      if (!cancelled) setActorId(session?.user.id ?? null)
    })

    return () => {
      cancelled = true
    }
  }, [authUser?.id])

  return actorId
}
