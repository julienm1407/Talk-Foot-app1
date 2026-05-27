/// <reference types="vite/client" />

declare module '*.svg?raw' {
  const content: string
  export default content
}

/** Défini dans `vite.config.ts` — indique si `VITE_SPORTMONKS_TOKEN` était présent au moment du `vite build`. */
declare const __TF_BUILD_HAS_SM_TOKEN__: boolean
/** Build sur Vercel — le client peut utiliser le relais `/api/sm` + variables serveur. */
declare const __TF_VERCEL_DEPLOY__: boolean

interface ImportMetaEnv {
  /** URL publique du site sans slash final (sitemap, robots, canonicals). Production : https://talk-foot.com */
  readonly VITE_PUBLIC_SITE_URL?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_ADMIN_EMAILS?: string
  /** SportMonks v3 — header `Authorization` = valeur du token (ne pas committer). */
  readonly VITE_SPORTMONKS_TOKEN?: string
  /** Journée SM pour charger les cotes 1N2 (`/rounds/{id}`) quand le match n’expose pas `sportMonksRoundId`. */
  readonly VITE_SPORTMONKS_PREMATCH_ODDS_ROUND_ID?: string
  /** Bookmaker SportMonks unique pour les cotes 1N2 (domicile / nul / extérieur). Défaut : `2`. */
  readonly VITE_SPORTMONKS_ODDS_BOOKMAKER_ID?: string
  /** Id **saison** SM (`season_id`) — force le filtre stats sur la page club si `activeSeasons` ne suffit pas. */
  readonly VITE_SPORTMONKS_TEAM_SEASON_ID?: string
  /** Filtre `playerstatisticSeasons` pour `/squads/teams/{id}` — repli si absent de `SPORTMONKS_SQUAD_PLAYER_STAT_SEASON_BY_CLUB_ID`. */
  readonly VITE_SPORTMONKS_SQUAD_STATISTIC_SEASON_ID?: string
  /** Id saison SM pour `/standings/seasons/{id}` si le classement live est vide (repli global ; par ligue : `sportMonksStandingSeasons.ts`). */
  readonly VITE_SPORTMONKS_STANDING_SEASON_ID?: string
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
  readonly VITE_ADSENSE_SLOT_ARTICLE_INLINE?: string
  readonly VITE_ADSENSE_SLOT_DEBATE_INLINE?: string
  readonly VITE_ADSENSE_SLOT_CLUB_INLINE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
