/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL publique du site sans slash final (sitemap, robots, canonicals). Production : https://talk-foot.com */
  readonly VITE_PUBLIC_SITE_URL?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_ADMIN_EMAILS?: string
  /** SportMonks v3 — header `Authorization` = valeur du token (ne pas committer). */
  readonly VITE_SPORTMONKS_TOKEN?: string
  /** Google AdSense — ID éditeur `ca-pub-…` ; sans ceci, encarts mock. */
  readonly VITE_ADSENSE_CLIENT?: string
  /** Slot unique pour tous les emplacements si les slots nommés sont vides. */
  readonly VITE_ADSENSE_SLOT_DEFAULT?: string
  readonly VITE_ADSENSE_SLOT_RAIL_LEFT_A?: string
  readonly VITE_ADSENSE_SLOT_RAIL_LEFT_B?: string
  readonly VITE_ADSENSE_SLOT_RAIL_RIGHT_A?: string
  readonly VITE_ADSENSE_SLOT_RAIL_RIGHT_B?: string
  readonly VITE_ADSENSE_SLOT_HOME_UNDER_HERO_DESKTOP?: string
  readonly VITE_ADSENSE_SLOT_HOME_UNDER_HERO?: string
  readonly VITE_ADSENSE_SLOT_HOME_CAROUSEL?: string
  readonly VITE_ADSENSE_SLOT_HOME_BET?: string
  readonly VITE_ADSENSE_SLOT_HOME_WEAR?: string
  readonly VITE_ADSENSE_SLOT_HOME_STREAM?: string
  readonly VITE_ADSENSE_SLOT_HOME_LEFT?: string
  readonly VITE_ADSENSE_SLOT_HOME_RIGHT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
