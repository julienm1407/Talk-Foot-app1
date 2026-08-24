import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserAppStateV1 } from '../../data/userAppStateDefaults'
import type { SubscriptionTierId } from '../../types/subscription'
import { parsePublicSubscriptionTier } from '../../utils/ultraAvatarFrame'

export type TalkfootProfileSnapshot = {
  displayName: string | null
  onboardingComplete: boolean
  oauthProfileCompleted: boolean
  appState: unknown
}

function rpcFailed(message: string, code?: string): Error {
  const err = new Error(message)
  ;(err as Error & { code?: string }).code = code
  return err
}

const MAX_CLOUD_PHOTO_CHARS = 8_000

/** Évite de bloquer le RPC profil avec une photo data-URL trop lourde. */
export function slimAppStateForCloudSave(appState: UserAppStateV1): UserAppStateV1 {
  const photo = appState.profile.profilePhotoDataUrl
  if (!photo || photo.length <= MAX_CLOUD_PHOTO_CHARS) return appState
  const nextProfile = { ...appState.profile }
  delete nextProfile.profilePhotoDataUrl
  return { ...appState, profile: nextProfile }
}

export type TalkfootPublicProfileRow = {
  actorKey: string
  profileId: string
  displayName: string | null
  modularAvatar: unknown
  profilePhotoDataUrl: string | null
  subscriptionTier: SubscriptionTierId | null
  cdmBetaParticipant: boolean
}

export async function fetchTalkfootPublicProfiles(
  sb: SupabaseClient,
  actorKeys: string[],
): Promise<TalkfootPublicProfileRow[]> {
  const keys = [...new Set(actorKeys.map((k) => k.trim()).filter(Boolean))].slice(0, 100)
  if (keys.length === 0) return []

  const { data, error } = await sb.rpc('get_talkfoot_public_profiles', { p_actor_keys: keys })
  if (error) throw rpcFailed(error.message, error.code)
  if (!data || data.ok !== true || !Array.isArray(data.profiles)) return []

  const out: TalkfootPublicProfileRow[] = []
  for (const row of data.profiles) {
    if (!row || typeof row !== 'object') continue
    const actorKey = typeof row.actor_key === 'string' ? row.actor_key : ''
    const profileId = typeof row.profile_id === 'string' ? row.profile_id : ''
    if (!actorKey || !profileId) continue
    const profilePhotoRaw =
      row.profile_photo_data_url != null ? String(row.profile_photo_data_url) : null
    out.push({
      actorKey,
      profileId,
      displayName: row.display_name != null ? String(row.display_name) : null,
      modularAvatar: row.modular_avatar ?? null,
      profilePhotoDataUrl:
        profilePhotoRaw?.trim().startsWith('data:image/') ? profilePhotoRaw.trim() : null,
      subscriptionTier: parsePublicSubscriptionTier(row.subscription_tier),
      cdmBetaParticipant: row.cdm_beta_participant === true,
    })
  }
  return out
}

export async function fetchTalkfootProfileSnapshot(
  sb: SupabaseClient,
  actorKey: string,
): Promise<TalkfootProfileSnapshot | null> {
  const { data, error } = await sb.rpc('get_talkfoot_user_snapshot', { p_actor_key: actorKey })
  if (error) throw rpcFailed(error.message, error.code)
  if (!data || data.ok !== true) return null
  return {
    displayName: data.display_name != null ? String(data.display_name) : null,
    onboardingComplete: Boolean(data.onboarding_complete),
    oauthProfileCompleted: data.oauth_profile_completed !== false,
    appState: data.app_state ?? {},
  }
}

export async function ensureTalkfootProfile(
  sb: SupabaseClient,
  actorKey: string,
  displayName: string,
  oauthProfileCompleted: boolean,
): Promise<TalkfootProfileSnapshot> {
  const { data, error } = await sb.rpc('ensure_talkfoot_profile', {
    p_actor_key: actorKey,
    p_display_name: displayName,
    p_oauth_profile_completed: oauthProfileCompleted,
  })
  if (error) throw rpcFailed(error.message, error.code)
  if (!data || data.ok !== true) {
    throw rpcFailed(String(data?.error ?? 'ensure_failed'))
  }
  return {
    displayName: data.display_name != null ? String(data.display_name) : null,
    onboardingComplete: Boolean(data.onboarding_complete),
    oauthProfileCompleted: data.oauth_profile_completed !== false,
    appState: data.app_state ?? {},
  }
}

export async function saveTalkfootProfileAppState(
  sb: SupabaseClient,
  actorKey: string,
  appState: UserAppStateV1,
  onboardingComplete: boolean,
): Promise<void> {
  const { data, error } = await sb.rpc('save_talkfoot_user_app_state', {
    p_actor_key: actorKey,
    p_app_state: slimAppStateForCloudSave(appState),
    p_onboarding_complete: onboardingComplete,
  })
  if (error) throw rpcFailed(error.message, error.code)
  if (!data || data.ok !== true) {
    throw rpcFailed(String(data?.error ?? 'save_failed'))
  }
}

/**
 * Comptes Clerk : le profil vit sous `clerk_id`, mais le chat tribune utilise
 * `auth.uid()` (session Supabase). On duplique l'état sur les deux lignes.
 */
export async function saveTalkfootProfileAppStateWithChatSync(
  sb: SupabaseClient,
  actorKey: string,
  appState: UserAppStateV1,
  onboardingComplete: boolean,
  displayName = 'Supporter',
): Promise<void> {
  const primary = actorKey.trim()
  await saveTalkfootProfileAppState(sb, primary, appState, onboardingComplete)

  const { data: sessionWrap } = await sb.auth.getSession()
  const chatActorId = sessionWrap.session?.user?.id?.trim() ?? ''
  if (!chatActorId || chatActorId === primary) return

  void ensureTalkfootProfile(sb, chatActorId, displayName.trim() || 'Supporter', true)
    .then(() => saveTalkfootProfileAppState(sb, chatActorId, appState, onboardingComplete))
    .catch((err) => {
      console.warn('[Talk Foot] Sync profil chat (non bloquant):', err)
    })
}
