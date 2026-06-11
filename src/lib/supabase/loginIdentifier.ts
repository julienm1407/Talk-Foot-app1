import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeDisplayNameLookup } from '../../utils/displayNameRules'

/** Résout email ou pseudo vers l’email auth Supabase (nécessite la migration resolve_login_identifier). */
export async function resolveLoginEmail(
  sb: SupabaseClient,
  identifier: string,
): Promise<string | null> {
  const trimmed = identifier.trim()
  if (!trimmed) return null

  const { data, error } = await sb.rpc('resolve_login_identifier', { p_identifier: trimmed })
  if (error) {
    if (/resolve_login_identifier|could not find the function/i.test(error.message ?? '')) {
      console.warn('[Talk Foot] resolve_login_identifier absent — migration Supabase non appliquée')
      return trimmed.includes('@') ? trimmed : null
    }
    console.warn('[Talk Foot] resolve_login_identifier:', error.message)
    return null
  }
  return typeof data === 'string' && data.trim() ? data.trim() : null
}

/** Mode local (sans cloud) : retrouve la clé email du registre via pseudo. */
export function resolveLocalLoginEmail(
  identifier: string,
  registry: Record<string, { displayName: string }>,
): string | null {
  const trimmed = identifier.trim()
  if (!trimmed) return null
  if (trimmed.includes('@')) return trimmed.toLowerCase()

  const norm = normalizeDisplayNameLookup(trimmed)
  for (const [email, user] of Object.entries(registry)) {
    if (normalizeDisplayNameLookup(user.displayName) === norm) return email
  }
  return null
}
