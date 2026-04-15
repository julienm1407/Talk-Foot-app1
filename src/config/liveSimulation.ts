import { isSupabaseConfigured } from '../lib/supabase/isEnabled'

/**
 * Foule simulée sur le live (messages + réactions bots).
 * - Sans Supabase : activée (site démo autonome).
 * - Avec Supabase : désactivée par défaut pour un flux 100 % réel et moins de charge.
 * Forcer la foule fictive même avec cloud : VITE_SIMULATE_LIVE_CROWD=true
 * Toujours désactiver : VITE_SIMULATE_LIVE_CROWD=false
 */
export function shouldSimulateLiveCrowd(): boolean {
  const flag = import.meta.env.VITE_SIMULATE_LIVE_CROWD
  if (flag === 'true') return true
  if (flag === 'false') return false
  return !isSupabaseConfigured()
}
