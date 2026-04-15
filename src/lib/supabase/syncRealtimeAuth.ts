import type { SupabaseClient } from '@supabase/supabase-js'

/** Aligne le client Realtime sur la session PostgREST (évite souscriptions vides au premier chargement). */
export async function syncRealtimeAuth(sb: SupabaseClient): Promise<void> {
  const { data: { session } } = await sb.auth.getSession()
  if (session?.access_token) {
    await sb.realtime.setAuth(session.access_token)
  }
}
