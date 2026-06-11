import type { AuthUser } from '../contexts/AuthContext'

/** Compte réel (email, Google, etc.) — pas visiteur ni session Supabase anonyme. */
export function canUseWalletRewards(user: AuthUser | null | undefined): boolean {
  return Boolean(user?.id && !user.isAnonymous)
}
