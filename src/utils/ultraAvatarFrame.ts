import type { SubscriptionTierId } from '../types/subscription'
import type { User } from '../types/chat'

const ULTRA_FRAME_TEST_NAMES = new Set(['dev talkfoot 1'])

/** Formule Ultra (4,99 €/mois) — cadre doré autour de la PP en chat / groupe. */
export function tierHasUltraAvatarFrame(tier: SubscriptionTierId | null | undefined): boolean {
  return tier === 'supporter_plus'
}

export function isUltraAvatarFrameTestAccount(user?: Pick<User, 'username'> | null): boolean {
  const name = user?.username?.trim().toLowerCase()
  return Boolean(name && ULTRA_FRAME_TEST_NAMES.has(name))
}

export function userShowsUltraAvatarFrame(
  user: User | undefined,
  opts?: { isSelf?: boolean; selfTier?: SubscriptionTierId },
): boolean {
  if (!user || user.isGroupSalonBot || user.isTalkFootBot) return false
  if (opts?.isSelf && tierHasUltraAvatarFrame(opts.selfTier)) return true
  if (tierHasUltraAvatarFrame(user.subscriptionTier)) return true
  if (isUltraAvatarFrameTestAccount(user)) return true
  return false
}

export function parsePublicSubscriptionTier(raw: unknown): SubscriptionTierId | null {
  if (typeof raw !== 'string') return null
  if (raw === 'freemium' || raw === 'supporter_plus' || raw === 'ambassador') return raw
  return null
}
