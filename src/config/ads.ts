/**
 * Publicités display (Google AdSense) — optionnel via variables d’environnement.
 * Sans client + au moins un slot (ou VITE_ADSENSE_SLOT_DEFAULT sur l’accueil), l’app garde les encarts mock.
 * Les annonces live sont limitées aux routes « éditoriales » — voir `adsPolicy.ts`.
 */
import { placementMayUseDefaultSlot, shouldShowLiveAdPlacement } from './adsPolicy'

function trimEnv(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t || undefined
}

function env(name: string): string | undefined {
  return trimEnv((import.meta.env as Record<string, unknown>)[name])
}

/** Ex. `ca-pub-xxxxxxxxxxxxxxxx` (Adsense → Comptes → ID éditeur). */
export function getAdsenseClient(): string | undefined {
  const fromEnv = env('VITE_ADSENSE_CLIENT')
  if (fromEnv) return fromEnv
  if (typeof document === 'undefined') return undefined
  const el = document.querySelector(
    'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]',
  ) as HTMLScriptElement | null
  const src = el?.src
  if (!src) return undefined
  const m = src.match(/[?&]client=(ca-pub-[0-9]+)/)
  return m?.[1]
}

/**
 * Chaque encart mock a un `imageSeed` stable : on le réutilise comme clé d’emplacement.
 * Renseigne l’ID de bloc (data-ad-slot) dans Adsense pour chaque unité, ou un slot unique par défaut.
 */
const PLACEMENT_TO_ENV_KEY: Record<string, string> = {
  'tf-rail-left-a': 'VITE_ADSENSE_SLOT_RAIL_LEFT_A',
  'tf-rail-left-b': 'VITE_ADSENSE_SLOT_RAIL_LEFT_B',
  'tf-rail-right-a': 'VITE_ADSENSE_SLOT_RAIL_RIGHT_A',
  'tf-rail-right-b': 'VITE_ADSENSE_SLOT_RAIL_RIGHT_B',
  'home-under-hero-desktop': 'VITE_ADSENSE_SLOT_HOME_UNDER_HERO_DESKTOP',
  'home-under-hero': 'VITE_ADSENSE_SLOT_HOME_UNDER_HERO',
  'home-carousel-feed': 'VITE_ADSENSE_SLOT_HOME_CAROUSEL',
  'ad-bet': 'VITE_ADSENSE_SLOT_HOME_BET',
  'ad-wear': 'VITE_ADSENSE_SLOT_HOME_WEAR',
  'ad-stream': 'VITE_ADSENSE_SLOT_HOME_STREAM',
  'home-left-mid': 'VITE_ADSENSE_SLOT_HOME_LEFT',
  'home-right-mid': 'VITE_ADSENSE_SLOT_HOME_RIGHT',
  'article-inline': 'VITE_ADSENSE_SLOT_ARTICLE_INLINE',
  'article-mid': 'VITE_ADSENSE_SLOT_ARTICLE_INLINE',
  'debate-inline': 'VITE_ADSENSE_SLOT_DEBATE_INLINE',
  'club-inline': 'VITE_ADSENSE_SLOT_CLUB_INLINE',
}

export function getAdsenseSlotForPlacement(placementKey: string): string | undefined {
  const key = PLACEMENT_TO_ENV_KEY[placementKey]
  if (key) {
    const slot = env(key)
    if (slot) return slot
  }
  if (placementMayUseDefaultSlot(placementKey)) {
    return env('VITE_ADSENSE_SLOT_DEFAULT')
  }
  return undefined
}

export function getLiveAdsenseUnit(
  placementKey: string,
  pathname?: string,
): { client: string; slot: string } | null {
  if (pathname && !shouldShowLiveAdPlacement(placementKey, pathname)) return null
  const client = getAdsenseClient()
  const slot = getAdsenseSlotForPlacement(placementKey)
  if (!client || !slot) return null
  return { client, slot }
}
