import type { SupabaseClient } from '@supabase/supabase-js'
import { p2pThreadKey } from '../../utils/cloudDmThread'

export type FriendshipRow = {
  user_low: string
  user_high: string
  status: 'pending' | 'accepted' | 'blocked'
  requested_by: string
  created_at: string
  accepted_at: string | null
}

/** Paire canonique (lexicographique sur les UUID). */
export function canonicalFriendshipPair(a: string, b: string): { user_low: string; user_high: string } {
  return a < b ? { user_low: a, user_high: b } : { user_low: b, user_high: a }
}

export function peerIdFromFriendshipRow(row: FriendshipRow, myId: string): string {
  return row.user_low === myId ? row.user_high : row.user_low
}

export async function fetchFriendshipsForUser(
  sb: SupabaseClient,
  myId: string,
): Promise<FriendshipRow[]> {
  const { data, error } = await sb
    .from('friendships')
    .select('user_low, user_high, status, requested_by, created_at, accepted_at')
    .or(`user_low.eq.${myId},user_high.eq.${myId}`)

  if (error) throw error
  return (data ?? []) as FriendshipRow[]
}

export async function fetchProfilesByIds(
  sb: SupabaseClient,
  ids: string[],
): Promise<Map<string, { display_name: string | null }>> {
  const uniq = [...new Set(ids)].filter(Boolean)
  const map = new Map<string, { display_name: string | null }>()
  if (uniq.length === 0) return map

  const { data, error } = await sb.from('profiles').select('id, display_name').in('id', uniq)
  if (error) throw error
  for (const row of data ?? []) {
    const r = row as { id: string; display_name: string | null }
    map.set(r.id, { display_name: r.display_name })
  }
  return map
}

export async function sendFriendRequest(sb: SupabaseClient, myId: string, peerId: string): Promise<{ ok: boolean; error?: string }> {
  if (myId === peerId) return { ok: false, error: 'invalid' }
  const { user_low, user_high } = canonicalFriendshipPair(myId, peerId)
  const { error } = await sb.from('friendships').insert({
    user_low,
    user_high,
    status: 'pending',
    requested_by: myId,
  })
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'already_exists' }
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function acceptFriendRequest(sb: SupabaseClient, myId: string, requesterId: string): Promise<{ ok: boolean; error?: string }> {
  const { user_low, user_high } = canonicalFriendshipPair(myId, requesterId)
  const { data, error } = await sb
    .from('friendships')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('user_low', user_low)
    .eq('user_high', user_high)
    .eq('status', 'pending')
    .eq('requested_by', requesterId)
    .select('user_low')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'not_found' }
  return { ok: true }
}

export function p2pKeysForPeers(myId: string, peerIds: string[]): string[] {
  const keys: string[] = []
  for (const pid of peerIds) {
    const k = p2pThreadKey(myId, pid)
    if (k) keys.push(k)
  }
  return keys
}
