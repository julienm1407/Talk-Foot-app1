import type { SupabaseClient } from '@supabase/supabase-js'
import { mergeUserAppState } from '../../data/userAppStateDefaults'
import {
  coerceModularAvatarFromStored,
} from '../../features/avatar2d/modularAvatarState'
import { isLikelyDefaultModularAvatar } from '../../utils/modularAvatarBackup'
import {
  ensureTalkfootProfile,
  fetchTalkfootProfileSnapshot,
  saveTalkfootProfileAppState,
} from './profileAppState'

/**
 * Les messages tribune / live stockent `user_id` = UUID de la session Supabase (souvent anonyme Clerk).
 * Copie l'état Clerk vers la ligne chat UNIQUEMENT si le profil chat n'a pas encore d'avatar custom.
 * (La sauvegarde studio passe par saveTalkfootProfileAppStateWithChatSync.)
 */
export async function syncClerkProfileToChatActor(
  sb: SupabaseClient,
  clerkUserId: string,
  chatActorId: string,
  displayName: string,
): Promise<void> {
  if (!clerkUserId || !chatActorId || clerkUserId === chatActorId) return

  const name = displayName.trim() || 'Supporter'

  await ensureTalkfootProfile(sb, chatActorId, name, true)

  const [clerkSnap, chatSnap] = await Promise.all([
    fetchTalkfootProfileSnapshot(sb, clerkUserId).catch(() => null),
    fetchTalkfootProfileSnapshot(sb, chatActorId).catch(() => null),
  ])

  if (!clerkSnap?.appState) return

  const clerkMerged = mergeUserAppState(clerkSnap.appState)
  const clerkModular = coerceModularAvatarFromStored(clerkMerged.profile.modularAvatar)
  if (!clerkModular || isLikelyDefaultModularAvatar(clerkModular)) return

  const chatMerged = chatSnap?.appState ? mergeUserAppState(chatSnap.appState) : null
  const chatModular = chatMerged
    ? coerceModularAvatarFromStored(chatMerged.profile.modularAvatar)
    : null

  if (chatModular && !isLikelyDefaultModularAvatar(chatModular)) return

  await saveTalkfootProfileAppState(
    sb,
    chatActorId,
    clerkMerged,
    clerkSnap.onboardingComplete,
  )
}
