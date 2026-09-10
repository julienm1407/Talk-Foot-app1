/**
 * Accès admin Talk Foot.
 * - `VITE_ADMIN_EMAILS` (build) : liste séparée par virgules
 * - Comptes revue Google / QA hardcodés : toujours admin, même sans env
 */

/** Compte prêté à Google pour la review Play Store — accès total. */
export const GOOGLE_PLAY_REVIEW_EMAIL = 'talkfoottest@gmail.com'

const BUILTIN_ADMIN_EMAILS = [GOOGLE_PLAY_REVIEW_EMAIL] as const

function adminEmailSet(): Set<string> {
  const raw = String(import.meta.env.VITE_ADMIN_EMAILS ?? '')
  const fromEnv = raw
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean)
  return new Set([...BUILTIN_ADMIN_EMAILS.map((e) => e.toLowerCase()), ...fromEnv])
}

export function normalizeAccessEmail(email: string | undefined | null): string {
  return String(email ?? '')
    .trim()
    .toLowerCase()
}

export function isGooglePlayReviewEmail(email: string | undefined | null): boolean {
  return normalizeAccessEmail(email) === GOOGLE_PLAY_REVIEW_EMAIL
}

export function isAdminEmail(email: string | undefined | null): boolean {
  const normalized = normalizeAccessEmail(email)
  if (!normalized) return false
  return adminEmailSet().has(normalized)
}
