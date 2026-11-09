import type { SupabaseClient } from '@supabase/supabase-js'
import { createFriendRequestInboxNotification, dismissFriendRequestInboxNotifications } from './inboxNotifications'
import { p2pThreadKey } from '../../utils/cloudDmThread'
import { reconcileExistingFriendship } from './friendshipReconcile'

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

export async function fetchFriendshipPair(
  sb: SupabaseClient,
  a: string,
  b: string,
): Promise<FriendshipRow | null> {
  const { user_low, user_high } = canonicalFriendshipPair(a, b)
  const { data, error } = await sb
    .from('friendships')
    .select('user_low, user_high, status, requested_by, created_at, accepted_at')
    .eq('user_low', user_low)
    .eq('user_high', user_high)
    .maybeSingle()
  if (error) return null
  return (data as FriendshipRow | null) ?? null
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

export async function sendFriendRequest(
  sb: SupabaseClient,
  myId: string,
  peerId: string,
  opts?: { requesterDisplayName?: string },
): Promise<{ ok: boolean; error?: string; relation?: 'pending' | 'accepted' }> {
  if (myId === peerId) return { ok: false, error: 'invalid' }
  const { user_low, user_high } = canonicalFriendshipPair(myId, peerId)
  const { error } = await sb.from('friendships').insert({
    user_low,
    user_high,
    status: 'pending',
    requested_by: myId,
  })
  if (error) {
    if (error.code === '23505') {
      const existing = await fetchFriendshipPair(sb, myId, peerId)
      const action = reconcileExistingFriendship(existing, myId)
      if (action === 'already_friends') return { ok: true, relation: 'accepted' }
      if (action === 'already_pending') return { ok: true, relation: 'pending' }
      if (action === 'accept' && existing) {
        const accepted = await acceptFriendRequest(sb, myId, existing.requested_by)
        return accepted.ok ? { ok: true, relation: 'accepted' } : accepted
      }
      if (action === 'blocked') return { ok: false, error: 'blocked' }
      return { ok: false, error: 'already_exists' }
    }
    return { ok: false, error: error.message }
  }
  const requesterDisplayName = opts?.requesterDisplayName?.trim() || 'Supporteur'
  await createFriendRequestInboxNotification(sb, {
    recipientSupabaseId: peerId,
    requesterSupabaseId: myId,
    requesterDisplayName,
  })
  return { ok: true, relation: 'pending' }
}

export async function declineFriendRequest(
  sb: SupabaseClient,
  myId: string,
  requesterId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { user_low, user_high } = canonicalFriendshipPair(myId, requesterId)
  const { error } = await sb
    .from('friendships')
    .delete()
    .eq('user_low', user_low)
    .eq('user_high', user_high)
    .eq('status', 'pending')
    .eq('requested_by', requesterId)
  if (error) return { ok: false, error: error.message }
  await dismissFriendRequestInboxNotifications(sb, myId, requesterId)
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
  if (!data) {
    const existing = await fetchFriendshipPair(sb, myId, requesterId)
    if (existing?.status === 'accepted') {
      await dismissFriendRequestInboxNotifications(sb, myId, requesterId)
      return { ok: true }
    }
    if (existing?.status === 'pending' && existing.requested_by !== myId) {
      const retry = await sb
        .from('friendships')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('user_low', user_low)
        .eq('user_high', user_high)
        .eq('status', 'pending')
        .eq('requested_by', existing.requested_by)
        .select('user_low')
        .maybeSingle()
      if (retry.error) return { ok: false, error: retry.error.message }
      if (!retry.data) return { ok: false, error: 'not_found' }
      await dismissFriendRequestInboxNotifications(sb, myId, existing.requested_by)
      return { ok: true }
    }
    return { ok: false, error: 'not_found' }
  }
  await dismissFriendRequestInboxNotifications(sb, myId, requesterId)
  return { ok: true }
}

/** Retire un ami accepté, ou annule / refuse une demande en attente. */
export async function removeFriendship(
  sb: SupabaseClient,
  myId: string,
  peerId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (myId === peerId) return { ok: false, error: 'invalid' }
  const { user_low, user_high } = canonicalFriendshipPair(myId, peerId)
  const { data, error } = await sb
    .from('friendships')
    .delete()
    .eq('user_low', user_low)
    .eq('user_high', user_high)
    .select('user_low')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'not_found' }
  await dismissFriendRequestInboxNotifications(sb, myId, peerId)
  await dismissFriendRequestInboxNotifications(sb, peerId, myId)
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
