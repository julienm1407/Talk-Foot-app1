import type { SupabaseClient } from '@supabase/supabase-js'
import type { Debate, DebatePreviewMessage } from '../../data/debates'
import { isSupabaseModerationError } from '../../utils/bannedWords'

export type DebateStatsRow = {
  id: string
  group_id: string | null
  title: string
  excerpt: string
  accent: string
  salon_access: 'public' | 'members'
  hero_image_url: string | null
  trending: boolean
  featured_rank: number | null
  status: string
  created_at: string
  messages_count: number
  participants_count: number
  messages_24h: number
}

type PreviewRow = {
  id: string
  display_name: string
  body: string
  metadata: Record<string, unknown> | null
}

function previewFromRow(row: PreviewRow): DebatePreviewMessage {
  const meta =
    row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata) ? row.metadata : {}
  const fanClubId =
    typeof meta.fan_club_id === 'string' && meta.fan_club_id.trim()
      ? meta.fan_club_id.trim()
      : typeof meta.fanClubId === 'string' && meta.fanClubId.trim()
        ? meta.fanClubId.trim()
        : 'neutral'
  return {
    username: row.display_name?.trim() || 'Supporteur',
    fanClubId,
    text: row.body?.trim() || '',
  }
}

export function debateRowToDebate(row: DebateStatsRow, previewMessages: DebatePreviewMessage[] = []): Debate {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    groupId: row.group_id ?? null,
    accent: row.accent,
    messagesCount: row.messages_count,
    participantsCount: row.participants_count,
    trending: false,
    salonAccess: row.salon_access,
    heroImageUrl: row.hero_image_url ?? undefined,
    featured: row.featured_rank === 1,
    messages24h: row.messages_24h,
    createdAt: row.created_at,
    previewMessages,
  }
}

export async function fetchDebatesWithStats(sb: SupabaseClient): Promise<Debate[]> {
  const { data, error } = await sb
    .from('debates_with_stats')
    .select(
      'id, group_id, title, excerpt, accent, salon_access, hero_image_url, trending, featured_rank, status, created_at, messages_count, participants_count, messages_24h',
    )
    .order('messages_24h', { ascending: false })
    .order('messages_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(80)
  if (error || !data?.length) return []

  const rows = data as DebateStatsRow[]
  const ids = rows.map((r) => r.id)
  const previewsById = await fetchDebatePreviewMap(sb, ids)

  return rows.map((row) => debateRowToDebate(row, previewsById.get(row.id) ?? []))
}

export async function fetchDebateById(sb: SupabaseClient, id: string): Promise<Debate | undefined> {
  const { data, error } = await sb
    .from('debates_with_stats')
    .select(
      'id, group_id, title, excerpt, accent, salon_access, hero_image_url, trending, featured_rank, status, created_at, messages_count, participants_count, messages_24h',
    )
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return undefined
  const row = data as DebateStatsRow
  const previews = await fetchDebatePreviewMap(sb, [id])
  return debateRowToDebate(row, previews.get(id) ?? [])
}

async function fetchDebatePreviewMap(
  sb: SupabaseClient,
  debateIds: string[],
): Promise<Map<string, DebatePreviewMessage[]>> {
  const out = new Map<string, DebatePreviewMessage[]>()
  if (!debateIds.length) return out

  const orFilter = debateIds.map((id) => `metadata->>debate_id.eq.${id}`).join(',')
  const { data, error } = await sb
    .from('supporter_group_channel_messages')
    .select('id, display_name, body, metadata, created_at')
    .eq('channel_id', 'general')
    .or(orFilter)
    .order('created_at', { ascending: false })
    .limit(400)
  if (error || !data?.length) return out

  for (const row of data as PreviewRow[]) {
    const meta =
      row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata) ? row.metadata : {}
    const debateId =
      typeof meta.debate_id === 'string' && meta.debate_id.trim() ? meta.debate_id.trim() : null
    if (!debateId || !debateIds.includes(debateId)) continue
    const list = out.get(debateId) ?? []
    if (list.length >= 5) continue
    list.push(previewFromRow(row))
    out.set(debateId, list)
  }
  return out
}

export type UpsertDebateInput = {
  id: string
  groupId?: string | null
  title: string
  excerpt: string
  accent: string
  salonAccess?: 'public' | 'members'
}

export async function upsertPublishedDebate(
  sb: SupabaseClient,
  input: UpsertDebateInput,
): Promise<{ ok: true } | { ok: false; moderation?: boolean }> {
  const { error } = await sb.from('debates').upsert(
    {
      id: input.id,
      group_id: input.groupId?.trim() || null,
      title: input.title,
      excerpt: input.excerpt,
      accent: input.accent,
      salon_access: input.salonAccess ?? 'public',
      status: 'published',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )
  if (error) {
    console.error('[Talk Foot] upsert debate:', error.message)
    return { ok: false, moderation: isSupabaseModerationError(error.message) }
  }
  return { ok: true }
}
