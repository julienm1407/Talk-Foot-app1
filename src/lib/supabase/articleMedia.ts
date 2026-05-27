import type { SupabaseClient } from '@supabase/supabase-js'

function safeFileName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
}

export async function uploadArticleImage(
  sb: SupabaseClient,
  file: File,
  articleSlug?: string,
): Promise<string | null> {
  const ext = file.name.includes('.') ? file.name.split('.').pop() || 'bin' : 'bin'
  const base = safeFileName(file.name.replace(/\.[^/.]+$/, '')) || 'image'
  const slug = (articleSlug || 'article').replace(/[^a-z0-9-]/gi, '-').toLowerCase()
  const path = `${slug}/${Date.now()}-${base}.${ext}`

  const { error } = await sb.storage.from('articles-media').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  })
  if (error) return null
  const { data } = sb.storage.from('articles-media').getPublicUrl(path)
  return data.publicUrl
}
