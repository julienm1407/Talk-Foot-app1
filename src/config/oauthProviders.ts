import type { Provider } from '@supabase/supabase-js'

/**
 * Fournisseurs OAuth affichés sur la page de connexion et reconnus côté profil Talk Foot.
 * À activer un par un dans Supabase → Authentication → Providers (Google, Apple, Facebook, Discord, GitHub).
 */
export const TALKFOOT_OAUTH_IDS = ['google', 'apple', 'facebook', 'discord', 'github'] as const satisfies readonly Provider[]

export type TalkFootOauthProviderId = (typeof TALKFOOT_OAUTH_IDS)[number]

export function isTalkFootOAuthProvider(p: string): p is TalkFootOauthProviderId {
  return (TALKFOOT_OAUTH_IDS as readonly string[]).includes(p)
}

export const TALKFOOT_OAUTH_PROVIDERS: readonly {
  id: TalkFootOauthProviderId
  label: string
  /** Variante visuelle du bouton */
  variant: 'google' | 'apple' | 'facebook' | 'discord' | 'github'
}[] = [
  { id: 'google', label: 'Continuer avec Google', variant: 'google' },
  { id: 'apple', label: 'Continuer avec Apple', variant: 'apple' },
  { id: 'facebook', label: 'Continuer avec Facebook', variant: 'facebook' },
  { id: 'discord', label: 'Continuer avec Discord', variant: 'discord' },
  { id: 'github', label: 'Continuer avec GitHub', variant: 'github' },
]

/** Libellé court pour les textes (modale profil OAuth, etc.) */
export function oauthProviderDisplayName(id: TalkFootOauthProviderId | string): string {
  switch (id) {
    case 'google':
      return 'Google'
    case 'apple':
      return 'Apple'
    case 'facebook':
      return 'Facebook'
    case 'discord':
      return 'Discord'
    case 'github':
      return 'GitHub'
    default:
      return 'ton fournisseur'
  }
}
