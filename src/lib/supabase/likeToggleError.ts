/** Contrainte unique (message_id, user_id) : le like existe déjà, ce n’est pas un échec. */
export function isLikeUniqueViolation(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false
  if (error.code === '23505') return true
  const msg = (error.message ?? '').toLowerCase()
  return msg.includes('duplicate') || msg.includes('unique')
}
