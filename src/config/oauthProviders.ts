import type { Provider } from '@supabase/supabase-js'

/**
 * Fournisseurs OAuth reconnus côté profil (comptes créés avant simplification login).
 */
export const TALKFOOT_OAUTH_IDS = ['google', 'apple', 'facebook', 'discord', 'github'] as const satisfies readonly Provider[]

export type TalkFootOauthProviderId = (typeof TALKFOOT_OAUTH_IDS)[number]

export function isTalkFootOAuthProvider(p: string): p is TalkFootOauthProviderId {
  return (TALKFOOT_OAUTH_IDS as readonly string[]).includes(p)
}

/** Seul OAuth proposé à l’inscription / connexion. */
export const LOGIN_OAUTH_PROVIDERS = [
  { id: 'google' as const, label: 'Continuer avec Google', variant: 'google' as const },
]

/** @deprecated Utiliser {@link LOGIN_OAUTH_PROVIDERS} */
export const TALKFOOT_OAUTH_PROVIDERS = LOGIN_OAUTH_PROVIDERS

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
