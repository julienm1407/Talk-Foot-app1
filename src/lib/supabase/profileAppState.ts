import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserAppStateV1 } from '../../data/userAppStateDefaults'

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
    p_app_state: appState,
    p_onboarding_complete: onboardingComplete,
  })
  if (error) throw rpcFailed(error.message, error.code)
  if (!data || data.ok !== true) {
    throw rpcFailed(String(data?.error ?? 'save_failed'))
  }
}
