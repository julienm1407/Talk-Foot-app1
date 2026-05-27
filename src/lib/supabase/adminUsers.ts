import type { SupabaseClient } from '@supabase/supabase-js'

export async function isCloudAdminEmail(
  sb: SupabaseClient,
  email: string | undefined | null,
): Promise<boolean> {
  const normalized = email?.trim().toLowerCase()
  if (!normalized) return false
  const { data, error } = await sb
    .from('admin_users')
    .select('email')
    .ilike('email', normalized)
    .limit(1)
  if (error) return false
  return Boolean(data && data.length > 0)
}
