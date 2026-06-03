import type { GroupPresentationMedia } from '../types/group'

const DEMO_UNSPLASH_PHOTO_IDS = ['photo-1522778119026-d647f0596c20'] as const

/** Médias d’exemple / démo — ne pas afficher dans l’en-tête tribune. */
export function isDemoPresentationMedia(media: GroupPresentationMedia | undefined): boolean {
  if (!media?.url?.trim()) return false
  const url = media.url.toLowerCase()
  if (DEMO_UNSPLASH_PHOTO_IDS.some((id) => url.includes(id))) return true
  const caption = (media.caption ?? '').toLowerCase()
  if (caption.includes('média validé plateforme (exemple)')) return true
  if (caption.includes('ambiance tribune — média validé')) return true
  return false
}

export function stripDemoPresentationMedia<T extends { presentationMedia?: GroupPresentationMedia }>(
  group: T,
): T {
  if (!isDemoPresentationMedia(group.presentationMedia)) return group
  const { presentationMedia: _removed, ...rest } = group
  return rest as T
}
