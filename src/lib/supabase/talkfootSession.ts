import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { ensureSupabaseAuthenticatedSession, ensureSupabaseChatSession } from './ensureSession'

export function isClerkAuthMode(): boolean {
  return Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim())
}

/**
 * Session Supabase utilisable pour le registre groupes / tribunes.
 * Comptes Clerk : session anonyme Supabase (même navigateur) si pas de JWT OAuth Supabase.
 */
export async function ensureTalkFootSupabaseSession(
  sb: SupabaseClient,
): Promise<Session | null> {
  const authenticated = await ensureSupabaseAuthenticatedSession(sb)
  if (authenticated) return authenticated
  if (isClerkAuthMode()) return ensureSupabaseChatSession(sb)
  return null
}
