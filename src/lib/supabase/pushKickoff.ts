import type { SupabaseClient } from '@supabase/supabase-js'
import type { KickoffWatch } from '../../utils/favoriteKickoffWatches'

export async function upsertPushDeviceToken(
  sb: SupabaseClient,
  userId: string,
  token: string,
  platform: string,
): Promise<void> {
  const t = token.trim()
  if (!t) return
  const { error } = await sb.from('push_device_tokens').upsert(
    {
      token: t,
      user_id: userId,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'token' },
  )
  if (error) throw error
}

export async function deletePushDeviceToken(sb: SupabaseClient, token: string): Promise<void> {
  const t = token.trim()
  if (!t) return
  await sb.from('push_device_tokens').delete().eq('token', t)
}

export async function replaceKickoffWatches(
  sb: SupabaseClient,
  userId: string,
  watches: KickoffWatch[],
): Promise<void> {
  const { error: delError } = await sb.from('match_kickoff_watches').delete().eq('user_id', userId)
  if (delError) throw delError
  if (watches.length === 0) return
  const { error } = await sb.from('match_kickoff_watches').insert(
    watches.map((w) => ({
      user_id: userId,
      match_id: w.matchId,
      kickoff_at: w.kickoffAt,
      title: w.title,
      body: w.body,
      href: w.href,
      updated_at: new Date().toISOString(),
    })),
  )
  if (error) throw error
}
