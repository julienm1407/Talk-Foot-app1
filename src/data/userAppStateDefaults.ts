import type { UserProfile } from '../types/profile'
import type { Wallet } from '../types/bet'
import { DEFAULT_CHARACTER_LOOK, mergeCharacterLook } from './characterPresets'
import { DEFAULT_WALLET, normalizeWallet } from '../utils/walletNormalize'
import type { FanPreferencesStoredShape } from '../types/fanPreferences'
import type { SubscriptionState } from '../types/subscription'
import { DEFAULT_SUBSCRIPTION } from '../types/subscription'
import { normalizeSubscription } from '../utils/subscriptionEntitlements'
import { AVATAR_2D_DEFAULTS } from './avatar2dCatalog'
import {
  createDefaultModularAvatarState,
  isModularAvatarState,
  sanitizeModularAvatarState,
  resolveModularAvatarState,
} from '../features/avatar2d/modularAvatarState'

export const defaultUserProfile: UserProfile = {
  level: 1,
  xp: 45,
  equippedItems: {
    scarf: null,
    hat: null,
    jersey: null,
    accessory: null,
    pants: 'pants-kit',
    shoes: 'shoes-studs',
  },
  ownedItemIds: [],
  portraitBackdrop: 'tribune',
  portraitBackdropClubId: null,
  characterLook: DEFAULT_CHARACTER_LOOK,
  avatarLoadout: {
    ...AVATAR_2D_DEFAULTS.loadout,
    ...AVATAR_2D_DEFAULTS.colors,
  },
  modularAvatar: createDefaultModularAvatarState(),
  premiumInventory: {
    ownedItemIds: [],
    equippedByCategory: {},
  },
}

export type UserAppStateV1 = {
  fanPreferences: FanPreferencesStoredShape
  profile: UserProfile
  wallet: Wallet
  bets: import('../types/bet').Bet[]
  /** Formule Supporter / Ultra / Ambassadeur */
  subscription?: SubscriptionState
  /** Portefeuille test admin initialisé une seule fois (évite de re-créditer après achat). */
  adminWalletBootstrapped?: boolean
  /** Migration portefeuille v2 marquée (sans réinitialiser les jetons accumulés). */
  walletStandardizedV2?: boolean
}

export function defaultUserAppState(): UserAppStateV1 {
  return {
    fanPreferences: {},
    profile: { ...defaultUserProfile, characterLook: { ...DEFAULT_CHARACTER_LOOK } },
    wallet: { ...DEFAULT_WALLET },
    bets: [],
    subscription: { ...DEFAULT_SUBSCRIPTION },
  }
}

export function mergeUserAppState(raw: unknown): UserAppStateV1 {
  const base = defaultUserAppState()
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return base
  const o = raw as Record<string, unknown>
  return {
    fanPreferences:
      o.fanPreferences !== null && typeof o.fanPreferences === 'object' && !Array.isArray(o.fanPreferences)
        ? { ...(o.fanPreferences as FanPreferencesStoredShape) }
        : base.fanPreferences,
    profile:
      o.profile !== null && typeof o.profile === 'object' && !Array.isArray(o.profile)
        ? (() => {
            const incoming = o.profile as UserProfile
            const modularSource = isModularAvatarState(incoming.modularAvatar)
              ? incoming.modularAvatar
              : base.profile.modularAvatar
            return {
              ...base.profile,
              ...incoming,
              characterLook: mergeCharacterLook(incoming.characterLook ?? base.profile.characterLook),
              modularAvatar: sanitizeModularAvatarState(resolveModularAvatarState(modularSource)),
            }
          })()
        : base.profile,
    wallet: normalizeWallet(
      o.wallet !== null && typeof o.wallet === 'object' && !Array.isArray(o.wallet) ? o.wallet : base.wallet,
    ),
    bets: Array.isArray(o.bets) ? (o.bets as UserAppStateV1['bets']) : base.bets,
    subscription: normalizeSubscription(o.subscription ?? DEFAULT_SUBSCRIPTION),
    adminWalletBootstrapped:
      o.adminWalletBootstrapped === true ? true : base.adminWalletBootstrapped,
    walletStandardizedV2:
      o.walletStandardizedV2 === true ? true : base.walletStandardizedV2,
  }
}
