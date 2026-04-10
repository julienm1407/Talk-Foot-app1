import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { isSupabaseConfigured } from './isEnabled'

let browserClient: SupabaseClient | null = null

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  if (!browserClient) {
    browserClient = createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      },
    )
  }
  return browserClient
}
