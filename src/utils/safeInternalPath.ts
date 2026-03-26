/** Empêche open-redirect : chemins internes uniquement (RELATIVE_URL). */
export function safeInternalNext(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null
  if (raw.includes('://') || raw.includes('\\')) return null
  if (raw.includes('\0') || raw.includes('<')) return null
  return raw
}
