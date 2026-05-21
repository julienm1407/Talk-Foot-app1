import type { SupabaseClient } from '@supabase/supabase-js'
import type { InboxLikeItem } from '../../types/inbox'

type InboxRow = {
  id: string
  kind: string
  title: string
  body: string
  href: string
  actor_display_name: string | null
  read_at: string | null
  created_at: string
}

function formatInboxTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'À l’instant'
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'À l’instant'
  if (min < 60) return `Il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Il y a ${h} h`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function rowToInboxItem(row: InboxRow): InboxLikeItem {
  return {
    kind: 'like',
    id: row.id,
    title: row.title,
    body: row.body,
    href: row.href,
    actorDisplayName: row.actor_display_name ?? undefined,
    createdAtLabel: formatInboxTime(row.created_at),
    createdAtMs: new Date(row.created_at).getTime(),
  }
}

export async function fetchInboxNotificationsForRecipient(
  sb: SupabaseClient,
  recipientSupabaseId: string,
): Promise<InboxLikeItem[]> {
  const { data, error } = await sb
    .from('inbox_notifications')
    .select('id, kind, title, body, href, actor_display_name, read_at, created_at')
    .eq('recipient_supabase_id', recipientSupabaseId)
    .order('created_at', { ascending: false })
    .limit(80)
  if (error || !data?.length) return []
  return data.map((row) => rowToInboxItem(row as InboxRow))
}

export async function markInboxNotificationRead(sb: SupabaseClient, id: string): Promise<void> {
  await sb
    .from('inbox_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
}

export async function createMessageLikeInboxNotification(
  sb: SupabaseClient,
  opts: {
    recipientSupabaseId: string
    actorDisplayName: string
    groupId: string
    groupName: string
    messageId: string
    channelId?: string
  },
): Promise<void> {
  const href = opts.channelId
    ? `/group/${opts.groupId}?channel=${encodeURIComponent(opts.channelId)}`
    : `/group/${opts.groupId}`
  const { error } = await sb.from('inbox_notifications').insert({
    recipient_supabase_id: opts.recipientSupabaseId,
    kind: 'message_like',
    title: 'Like sur ton message',
    body: `${opts.actorDisplayName} a aimé ton message dans ${opts.groupName}`,
    href,
    actor_display_name: opts.actorDisplayName,
    group_id: opts.groupId,
    message_id: opts.messageId,
  })
  if (error && import.meta.env.DEV) {
    console.warn('[Talk Foot] inbox_notifications insert:', error.message)
  }
}
