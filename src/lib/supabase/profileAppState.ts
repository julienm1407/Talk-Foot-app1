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

export type TalkfootPublicProfileRow = {
  actorKey: string
  profileId: string
  displayName: string | null
  modularAvatar: unknown
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
    out.push({
      actorKey,
      profileId,
      displayName: row.display_name != null ? String(row.display_name) : null,
      modularAvatar: row.modular_avatar ?? null,
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
    p_app_state: appState,
    p_onboarding_complete: onboardingComplete,
  })
  if (error) throw rpcFailed(error.message, error.code)
  if (!data || data.ok !== true) {
    throw rpcFailed(String(data?.error ?? 'save_failed'))
  }
}
