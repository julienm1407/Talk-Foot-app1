import { useCallback, useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import {
  adminClearGroupFeaturedDebate,
  adminSetGroupFeaturedDebate,
  fetchGroupFeaturedDebateId,
} from '../lib/supabase/groupFeaturedDebate'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'

export function useGroupFeaturedDebate(groupId: string | undefined) {
  const [featuredDebateId, setFeaturedDebateId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!groupId || !isSupabaseConfigured()) {
      setFeaturedDebateId(null)
      return
    }
    const sb = getSupabaseBrowserClient()
    if (!sb) return
    setLoading(true)
    try {
      const id = await fetchGroupFeaturedDebateId(sb, groupId)
      setFeaturedDebateId(id)
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    void reload()
  }, [reload])

  const linkDebate = useCallback(
    async (debateId: string) => {
      if (!groupId || !isSupabaseConfigured()) return { ok: false as const, error: 'offline' }
      const sb = getSupabaseBrowserClient()
      if (!sb) return { ok: false as const, error: 'offline' }
      const result = await adminSetGroupFeaturedDebate(sb, groupId, debateId)
      if (result.ok) setFeaturedDebateId(debateId)
      return result
    },
    [groupId],
  )

  const unlinkDebate = useCallback(async () => {
    if (!groupId || !isSupabaseConfigured()) return { ok: false as const, error: 'offline' }
    const sb = getSupabaseBrowserClient()
    if (!sb) return { ok: false as const, error: 'offline' }
    const result = await adminClearGroupFeaturedDebate(sb, groupId)
    if (result.ok) setFeaturedDebateId(null)
    return result
  }, [groupId])

  return { featuredDebateId, loading, reload, linkDebate, unlinkDebate }
}
