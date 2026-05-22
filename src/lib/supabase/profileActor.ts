import type { SupabaseClient } from '@supabase/supabase-js'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isProfileActorUuid(value: string | undefined | null): boolean {
  if (!value) return false
  return UUID_RE.test(value)
}

function profileSelectEq(sb: SupabaseClient, userId: string, columns: string) {
  const q = sb.from('profiles').select(columns)
  return isProfileActorUuid(userId) ? q.eq('id', userId) : q.eq('clerk_id', userId)
}

/** Crée une ligne `profiles` si absente (Clerk ou Supabase Auth). */
export async function ensureProfileForActor(
  sb: SupabaseClient,
  actorKey: string,
  displayName: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data: existing } = await profileSelectEq(sb, actorKey, 'id').maybeSingle()

  if (existing) return { ok: true }

  const name = displayName.trim() || 'Supporteur'
  const payload = isProfileActorUuid(actorKey)
    ? {
        id: actorKey,
        clerk_id: actorKey,
        display_name: name,
        onboarding_complete: false,
        app_state: {},
        oauth_profile_completed: true,
      }
    : {
        clerk_id: actorKey,
        display_name: name,
        onboarding_complete: false,
        app_state: {},
        oauth_profile_completed: true,
      }

  const { error: insErr } = await sb.from('profiles').insert(payload)
  if (!insErr) return { ok: true }

  const { data: again } = await profileSelectEq(sb, actorKey, 'id').maybeSingle()
  if (again) return { ok: true }

  console.warn('[Talk Foot] ensureProfileForActor:', insErr.message)
  return {
    ok: false,
    message: 'Profil cloud introuvable. Recharge la page puis réessaie.',
  }
}
