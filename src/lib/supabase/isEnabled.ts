export function isSupabaseConfigured(): boolean {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    return Boolean(
      url &&
        key &&
        typeof url === 'string' &&
        typeof key === 'string' &&
        url.startsWith('http') &&
        key.length > 20,
    )
  } catch {
    return false
  }
}
