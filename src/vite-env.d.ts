/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL publique du site sans slash final (sitemap, robots, canonicals). Production : https://talk-foot.com */
  readonly VITE_PUBLIC_SITE_URL?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_ADMIN_EMAILS?: string
  readonly VITE_API_SPORTS_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
