import type { SupabaseClient } from '@supabase/supabase-js'
import { channelsForSupporterGroup } from '../../data/defaultGroupChannels'
import type { SupporterGroup } from '../../types/group'

function isUniqueViolation(err: { code?: string; message?: string; details?: string }): boolean {
  const c = err.code ?? ''
  const m = `${err.message ?? ''} ${err.details ?? ''}`
  return c === '23505' || /duplicate key|unique constraint|already exists/i.test(m)
}

/**
 * Tribunes « système » (ex. Tribune France CDM) : enregistrement cloud pour que la RLS
 * `group_kind = public` autorise lecture/écriture sans adhésion préalable.
 */
export async function ensureCloudRegistryForPublicSystemGroup(
  sb: SupabaseClient,
  group: SupporterGroup,
  ownerSupabaseId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (group.createdBy !== 'system') return { ok: true }
  if ((group.groupKind ?? 'public') !== 'public') return { ok: true }

  const { data: existing, error: selErr } = await sb
    .from('supporter_groups')
    .select('id')
    .eq('id', group.id)
    .maybeSingle()

  if (selErr) return { ok: false, error: selErr.message }
  if (existing?.id) return { ok: true }

  const { error } = await sb.from('supporter_groups').insert({
    id: group.id,
    name: group.name,
    emoji: group.emoji,
    motto: group.motto,
    location: group.location ?? null,
    group_kind: 'public',
    hashtags: group.hashtags ?? [],
    fan_tags: group.fanTags ?? null,
    theme: group.theme,
    channels: channelsForSupporterGroup(group.channels),
    owner_id: ownerSupabaseId,
    owner_clerk_id: null,
    created_at: group.createdAt,
  })

  if (error) {
    if (isUniqueViolation(error)) return { ok: true }
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
