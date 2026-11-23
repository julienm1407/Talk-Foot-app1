import { getSupabaseBrowserClient } from './client'
import { isSupabaseConfigured } from './isEnabled'
import { ensureTalkFootSupabaseSession } from './talkfootSession'

export type TribunePollOption = { id: string; label: string }

export type TribunePollRow = {
  id: string
  matchId: string
  question: string
  options: TribunePollOption[]
  kind: string
  triggerKey: string
  createdAt: string
  counts: Record<string, number>
  myOptionId: string | null
}

function parseOptions(raw: unknown): TribunePollOption[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((o) => {
      if (!o || typeof o !== 'object') return null
      const id = String((o as { id?: unknown }).id ?? '')
      const label = String((o as { label?: unknown }).label ?? '')
      if (!id || !label) return null
      return { id, label }
    })
    .filter((x): x is TribunePollOption => Boolean(x))
}

export async function fetchTribunePolls(
  matchId: string,
  voterKey: string | null,
): Promise<TribunePollRow[]> {
  if (!matchId || !isSupabaseConfigured()) return []
  const sb = getSupabaseBrowserClient()
  if (!sb) return []
  const { data: polls, error } = await sb
    .from('tribune_polls')
    .select('id, match_id, question, options, kind, trigger_key, created_at')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })
  if (error || !polls) return []
  const ids = polls.map((p) => p.id as string)
  const counts: Record<string, Record<string, number>> = {}
  const mine: Record<string, string> = {}
  if (ids.length) {
    const { data: votes } = await sb.from('tribune_poll_votes').select('poll_id, option_id, voter_key').in('poll_id', ids)
    for (const v of votes ?? []) {
      const pid = String(v.poll_id)
      const oid = String(v.option_id)
      counts[pid] ??= {}
      counts[pid][oid] = (counts[pid][oid] ?? 0) + 1
      if (voterKey && String(v.voter_key) === voterKey) mine[pid] = oid
    }
  }
  return polls.map((p) => ({
    id: String(p.id),
    matchId: String(p.match_id),
    question: String(p.question),
    options: parseOptions(p.options),
    kind: String(p.kind),
    triggerKey: String(p.trigger_key),
    createdAt: String(p.created_at),
    counts: counts[String(p.id)] ?? {},
    myOptionId: mine[String(p.id)] ?? null,
  }))
}

export async function ensureTribunePoll(input: {
  matchId: string
  question: string
  options: TribunePollOption[]
  kind: string
  triggerKey: string
  officialBody?: string
  minute?: number | null
}): Promise<string | null> {
  if (!isSupabaseConfigured()) return null
  const sb = getSupabaseBrowserClient()
  if (!sb) return null
  await ensureTalkFootSupabaseSession(sb)
  const { data, error } = await sb.rpc('ensure_tribune_poll', {
    p_match_id: input.matchId,
    p_question: input.question,
    p_options: input.options,
    p_kind: input.kind,
    p_trigger_key: input.triggerKey,
    p_official_body: input.officialBody ?? null,
    p_minute: input.minute ?? null,
  })
  if (error) {
    if (import.meta.env.DEV) console.warn('[Talk Foot] ensure_tribune_poll', error.message)
    return null
  }
  return typeof data === 'string' ? data : null
}

export async function voteTribunePoll(pollId: string, optionId: string, voterKey: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  const sb = getSupabaseBrowserClient()
  if (!sb) return false
  const session = await ensureTalkFootSupabaseSession(sb)
  if (!session) return false
  const { error } = await sb.rpc('vote_tribune_poll', {
    p_poll_id: pollId,
    p_option_id: optionId,
    p_voter_key: voterKey,
  })
  if (error) {
    if (import.meta.env.DEV) console.warn('[Talk Foot] vote_tribune_poll', error.message)
    return false
  }
  return true
}

export type OfficialPost = { id: string; matchId: string; body: string; minute: number | null; createdAt: string }

export async function fetchOfficialPosts(matchId: string): Promise<OfficialPost[]> {
  if (!matchId || !isSupabaseConfigured()) return []
  const sb = getSupabaseBrowserClient()
  if (!sb) return []
  const { data, error } = await sb
    .from('tribune_official_posts')
    .select('id, match_id, body, minute, created_at')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return data.map((r) => ({
    id: String(r.id),
    matchId: String(r.match_id),
    body: String(r.body),
    minute: r.minute == null ? null : Number(r.minute),
    createdAt: String(r.created_at),
  }))
}

export async function postOfficialTribune(
  matchId: string,
  body: string,
  minute?: number | null,
  triggerKey?: string | null,
): Promise<void> {
  if (!isSupabaseConfigured()) return
  const sb = getSupabaseBrowserClient()
  if (!sb) return
  await ensureTalkFootSupabaseSession(sb)
  const { error } = await sb.rpc('post_tribune_official', {
    p_match_id: matchId,
    p_body: body,
    p_minute: minute ?? null,
    p_trigger_key: triggerKey ?? null,
  })
  if (error && import.meta.env.DEV) console.warn('[Talk Foot] post_tribune_official', error.message)
}
