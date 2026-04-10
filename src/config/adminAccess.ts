/**
 * Liste des emails autorisés pour /admin (build-time via .env).
 * Séparateur : virgule. Comparaison insensible à la casse.
 * Sans backend, ce n’est qu’un garde-fou UI : ne remplace pas une vraie auth serveur.
 */
function adminEmailSet(): Set<string> {
  const raw = String(import.meta.env.VITE_ADMIN_EMAILS ?? '')
  return new Set(
    raw
      .split(',')
      .map((e: string) => e.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email?.trim()) return false
  return adminEmailSet().has(email.trim().toLowerCase())
}
