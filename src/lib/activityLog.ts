import { getSupabaseBrowserClient } from './supabase/client'
import { isSupabaseConfigured } from './supabase/isEnabled'

export async function logSiteActivity(
  eventType: string,
  opts?: { path?: string; metadata?: Record<string, unknown> },
): Promise<void> {
  if (!isSupabaseConfigured()) return
  const sb = getSupabaseBrowserClient()
  if (!sb) return
  const { data: u } = await sb.auth.getUser()
  const userId = u.user?.id
  if (!userId) return
  const { error } = await sb.from('activity_events').insert({
    user_id: userId,
    event_type: eventType,
    path: opts?.path ?? (typeof window !== 'undefined' ? window.location.pathname : null),
    metadata: opts?.metadata ?? {},
  })
  if (error) console.warn('[Talk Foot] activity_log', error.message)
}
