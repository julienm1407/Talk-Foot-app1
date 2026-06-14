import { useCallback, useRef } from 'react'
import { useSession } from '@clerk/clerk-react'
import { useAuth } from '../contexts/AuthContext'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { ensureTalkFootBoundSupabaseSession } from '../lib/supabase/talkfootSession'

/**
 * Session Supabase pour tribunes / chat, avec liaison Clerk si nécessaire.
 * Réutilise le dernier clerkSessionId connu pendant un refresh token Clerk.
 */
export function useTalkFootCloudSession() {
  const { user } = useAuth()
  const { session } = useSession()
  const clerkSessionIdRef = useRef<string | null>(session?.id ?? null)

  if (session?.id) {
    clerkSessionIdRef.current = session.id
  }

  const ensureCloudSession = useCallback(async () => {
    if (!isSupabaseConfigured()) return null
    const sb = getSupabaseBrowserClient()
    if (!sb) return null
    return ensureTalkFootBoundSupabaseSession(sb, user?.id, clerkSessionIdRef.current)
  }, [user?.id])

  return { ensureCloudSession, clerkSessionId: clerkSessionIdRef.current }
}
