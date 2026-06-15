import type { User } from '../types/chat'

/** Garde la dernière PP connue quand le cache cloud est invalidé brièvement (évite cercles gris). */
export function retainStickyChatUserAvatars(
  next: Record<string, User>,
  prev: Record<string, User>,
): Record<string, User> {
  if (!Object.keys(prev).length) return next
  const out = { ...next }
  for (const [id, user] of Object.entries(out)) {
    const old = prev[id]
    if (!old) continue
    let patched = user
    if (!patched.profilePhotoDataUrl && old.profilePhotoDataUrl) {
      patched = { ...patched, profilePhotoDataUrl: old.profilePhotoDataUrl }
    }
    if (!patched.modularAvatar && old.modularAvatar) {
      patched = { ...patched, modularAvatar: old.modularAvatar }
    }
    out[id] = patched
  }
  return out
}
