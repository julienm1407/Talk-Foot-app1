import type { PronoSharePayload } from '../../utils/pronoSharePayload'
import { decodeInlineShareId, encodeInlineShareId, randomShareId } from '../../utils/pronoSharePayload'
import { getSupabaseBrowserClient } from './client'
import { isSupabaseConfigured } from './isEnabled'

const TABLE = 'prono_shares'
const BUCKET = 'prono-shares'

async function uploadPng(path: string, blob: Blob): Promise<string | undefined> {
  const sb = getSupabaseBrowserClient()
  if (!sb) return undefined
  const { error } = await sb.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/png',
    upsert: true,
  })
  if (error) return undefined
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function publishPronoShare(opts: {
  id?: string
  payload: PronoSharePayload
  story: Blob
  og: Blob
}): Promise<{ id: string; payload: PronoSharePayload }> {
  const inlineId = encodeInlineShareId(opts.payload)
  if (!isSupabaseConfigured()) {
    return { id: inlineId, payload: opts.payload }
  }
  const sb = getSupabaseBrowserClient()
  if (!sb) return { id: inlineId, payload: opts.payload }

  const id = opts.id || randomShareId()
  const storyUrl = await uploadPng(`${id}/story.png`, opts.story)
  const ogUrl = await uploadPng(`${id}/og.png`, opts.og)
  const payload: PronoSharePayload = {
    ...opts.payload,
    storyImageUrl: storyUrl,
    ogImageUrl: ogUrl,
  }
  const { error } = await sb.from(TABLE).insert({
    id,
    sharer_id: payload.sharerId,
    match_id: payload.matchId,
    payload,
    story_image_url: storyUrl ?? null,
    og_image_url: ogUrl ?? null,
  })
  if (error) return { id: inlineId, payload }
  return { id, payload }
}

export async function fetchPronoShare(id: string): Promise<PronoSharePayload | null> {
  const inline = decodeInlineShareId(id)
  if (inline) return inline
  if (!isSupabaseConfigured()) return null
  const sb = getSupabaseBrowserClient()
  if (!sb) return null
  const { data, error } = await sb.from(TABLE).select('payload').eq('id', id).maybeSingle()
  if (error || !data?.payload) return null
  return data.payload as PronoSharePayload
}

export async function bumpPronoShareClick(id: string): Promise<void> {
  if (id.startsWith('b.') || !isSupabaseConfigured()) return
  const sb = getSupabaseBrowserClient()
  if (!sb) return
  await sb.rpc('bump_prono_share_click', { p_id: id })
}

export function rememberShareAttribution(src: string | null, from: string | null, shareId: string) {
  try {
    sessionStorage.setItem(
      'tf.shareAttribution',
      JSON.stringify({ src: src || 'share_prono', from, shareId, at: Date.now() }),
    )
  } catch {
    /* ignore */
  }
}
