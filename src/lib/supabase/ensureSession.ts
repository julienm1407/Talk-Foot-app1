import type { Session, SupabaseClient } from '@supabase/supabase-js'

/** Session courante ou anonyme pour les fonctions temps réel (chat, MP, salons). */
export async function ensureSupabaseChatSession(sb: SupabaseClient): Promise<Session | null> {
  let session = (await sb.auth.getSession()).data.session
  if (session) return session
  const { data, error } = await sb.auth.signInAnonymously()
  if (error || !data.session) return null
  return data.session
}
