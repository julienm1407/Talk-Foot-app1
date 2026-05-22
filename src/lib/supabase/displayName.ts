import type { SupabaseClient } from '@supabase/supabase-js'
import { containsBannedWord } from '../../utils/bannedWords'
import {
  sanitizeDisplayNameInput,
  suggestAlternateDisplayNames,
  validateDisplayNameFormat,
} from '../../utils/displayNameRules'

export type DisplayNameStatus = {
  displayName: string
  changesUsed: number
  changesRemaining: number
  nextAllowedAt: string | null
  canChange: boolean
}

export type ChangeDisplayNameResult =
  | {
      ok: true
      displayName: string
      changesRemaining: number
      nextAllowedAt: string | null
    }
  | {
      ok: false
      error:
        | 'taken'
        | 'cooldown'
        | 'invalid_length'
        | 'invalid_format'
        | 'banned'
        | 'profile_not_found'
        | 'unavailable'
      message: string
      suggestions?: string[]
      nextAllowedAt?: string | null
      changesUsed?: number
    }

export async function fetchDisplayNameStatus(
  sb: SupabaseClient,
  actorKey: string,
): Promise<DisplayNameStatus | null> {
  const { data, error } = await sb.rpc('get_display_name_status', { p_actor_key: actorKey })
  if (error || !data || data.ok !== true) {
    console.warn('[Talk Foot] get_display_name_status:', error?.message)
    return null
  }
  return {
    displayName: String(data.display_name ?? ''),
    changesUsed: Number(data.changes_used) || 0,
    changesRemaining: Number(data.changes_remaining) || 0,
    nextAllowedAt: data.next_allowed_at ? String(data.next_allowed_at) : null,
    canChange: Boolean(data.can_change),
  }
}

export async function changeDisplayNameCloud(
  sb: SupabaseClient,
  actorKey: string,
  rawName: string,
): Promise<ChangeDisplayNameResult> {
  const name = sanitizeDisplayNameInput(rawName)
  const formatErr = validateDisplayNameFormat(name)
  if (formatErr) {
    return { ok: false, error: 'invalid_format', message: formatErr }
  }
  if (containsBannedWord(name)) {
    return {
      ok: false,
      error: 'banned',
      message: 'Ce pseudo n’est pas autorisé sur Talk Foot.',
    }
  }

  const { data, error } = await sb.rpc('change_display_name', {
    p_actor_key: actorKey,
    p_new_name: name,
  })

  if (error) {
    console.warn('[Talk Foot] change_display_name:', error.message)
    return {
      ok: false,
      error: 'unavailable',
      message: 'Impossible de mettre à jour le pseudo pour le moment.',
    }
  }

  if (!data || typeof data !== 'object') {
    return {
      ok: false,
      error: 'unavailable',
      message: 'Réponse serveur invalide.',
    }
  }

  const row = data as Record<string, unknown>

  if (row.ok === true) {
    return {
      ok: true,
      displayName: String(row.display_name ?? name),
      changesRemaining: Number(row.changes_remaining) || 0,
      nextAllowedAt: row.next_allowed_at ? String(row.next_allowed_at) : null,
    }
  }

  const err = String(row.error ?? 'unavailable')

  if (err === 'taken') {
    return {
      ok: false,
      error: 'taken',
      message: 'Ce pseudo est déjà pris. Choisis une variante :',
      suggestions: suggestAlternateDisplayNames(name),
    }
  }

  if (err === 'cooldown') {
    return {
      ok: false,
      error: 'cooldown',
      message:
        'Tu as déjà changé de pseudo 2 fois. Attends 14 jours avant un nouveau changement.',
      nextAllowedAt: row.next_allowed_at ? String(row.next_allowed_at) : null,
      changesUsed: Number(row.changes_used) || 2,
    }
  }

  if (err === 'invalid_length') {
    return {
      ok: false,
      error: 'invalid_length',
      message: 'Le pseudo doit contenir entre 2 et 24 caractères.',
    }
  }

  return {
    ok: false,
    error: 'unavailable',
    message: 'Changement de pseudo impossible.',
  }
}
