import type { SupabaseClient } from '@supabase/supabase-js'

export type EditorialRole = 'redacteur' | 'relecteur' | 'admin'

export async function fetchEditorialUsers(
  sb: SupabaseClient,
): Promise<Array<{ email: string; role: EditorialRole }>> {
  const { data, error } = await sb
    .from('editorial_users')
    .select('email, role')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as Array<Record<string, unknown>>).map((x) => ({
    email: String(x.email).toLowerCase(),
    role: (x.role as EditorialRole) ?? 'redacteur',
  }))
}

export async function upsertEditorialUser(
  sb: SupabaseClient,
  email: string,
  role: EditorialRole,
): Promise<boolean> {
  const { error } = await sb.from('editorial_users').upsert({ email: email.toLowerCase(), role }, { onConflict: 'email' })
  return !error
}
