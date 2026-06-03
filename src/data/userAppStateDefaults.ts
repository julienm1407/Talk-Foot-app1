import type { UserProfile } from '../types/profile'
import type { Wallet } from '../types/bet'
import { DEFAULT_CHARACTER_LOOK, mergeCharacterLook } from './characterPresets'
import { DEFAULT_WALLET } from '../utils/walletNormalize'
import type { FanPreferencesStoredShape } from '../types/fanPreferences'
import { AVATAR_2D_DEFAULTS } from './avatar2dCatalog'
import {
  createDefaultModularAvatarState,
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
  /** Portefeuille test admin initialisé une seule fois (évite de re-créditer après achat). */
  adminWalletBootstrapped?: boolean
}

export function defaultUserAppState(): UserAppStateV1 {
  return {
    fanPreferences: {},
    profile: { ...defaultUserProfile, characterLook: { ...DEFAULT_CHARACTER_LOOK } },
    wallet: { ...DEFAULT_WALLET },
    bets: [],
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
            return {
              ...base.profile,
              ...incoming,
              characterLook: mergeCharacterLook(incoming.characterLook ?? base.profile.characterLook),
              modularAvatar: sanitizeModularAvatarState(
                resolveModularAvatarState(incoming.modularAvatar ?? base.profile.modularAvatar),
              ),
            }
          })()
        : base.profile,
    wallet:
      o.wallet !== null && typeof o.wallet === 'object' && !Array.isArray(o.wallet)
        ? { ...base.wallet, ...(o.wallet as Wallet) }
        : base.wallet,
    bets: Array.isArray(o.bets) ? (o.bets as UserAppStateV1['bets']) : base.bets,
    adminWalletBootstrapped:
      o.adminWalletBootstrapped === true ? true : base.adminWalletBootstrapped,
  }
}
