import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { bindTalkfootActorSession } from './bindTalkfootActorSession'
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

/**
 * Session Supabase + liaison Clerk vérifiée (obligatoire pour RPC profil / wallet en mode Clerk).
 */
export async function ensureTalkFootBoundSupabaseSession(
  sb: SupabaseClient,
  clerkActorKey: string | null | undefined,
  clerkSessionId: string | null | undefined,
): Promise<Session | null> {
  const session = await ensureTalkFootSupabaseSession(sb)
  if (!session || !isClerkAuthMode()) return session

  const actorKey = clerkActorKey?.trim()
  const sessionId = clerkSessionId?.trim()
  if (!actorKey || !sessionId) return session

  const bindResult = await bindTalkfootActorSession(sb, actorKey, sessionId)
  if (!bindResult.ok && import.meta.env.DEV) {
    console.warn('[TalkFoot] bind session cloud:', bindResult.error)
  }
  return session
}
