import type { SupabaseClient } from '@supabase/supabase-js'
import { mergeUserAppState } from '../../data/userAppStateDefaults'
import {
  ensureTalkfootProfile,
  fetchTalkfootProfileSnapshot,
  saveTalkfootProfileAppStateWithChatSync,
} from './profileAppState'

/**
 * Les messages tribune / live stockent `user_id` = UUID de la session Supabase (souvent anonyme Clerk).
 * Le profil modulaire vit sous `clerk_id` — on recopie l’état sur la ligne `id = chatActorId`.
 */
export async function syncClerkProfileToChatActor(
  sb: SupabaseClient,
  clerkUserId: string,
  chatActorId: string,
  displayName: string,
): Promise<void> {
  if (!clerkUserId || !chatActorId || clerkUserId === chatActorId) return

  const name = displayName.trim() || 'Supporteur'
  const clerkSnap = await fetchTalkfootProfileSnapshot(sb, clerkUserId).catch(() => null)

  await ensureTalkfootProfile(
    sb,
    chatActorId,
    name,
    clerkSnap?.oauthProfileCompleted ?? true,
  )

  if (clerkSnap?.appState) {
    const merged = mergeUserAppState(clerkSnap.appState)
    await saveTalkfootProfileAppStateWithChatSync(
      sb,
      chatActorId,
      merged,
      clerkSnap.onboardingComplete,
    )
  }
}
