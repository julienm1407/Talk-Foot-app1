import { isAdminEmail } from '../config/adminAccess'
import type { AuthUser } from '../contexts/AuthContext'
import type { Wallet } from '../types/bet'
import { DEFAULT_WALLET, normalizeWallet } from './walletNormalize'

export const WALLET_STANDARDIZE_LOCAL_FLAG = 'talkfoot.wallet.standardized.v2'

const DEV_ADMIN_DISPLAY_NAME = 'Dev TalkFoot 1'
const DEV_ADMIN_EMAIL = 'mondetju1407@gmail.com'

/** Comptes admin / test : portefeuille inchangé. */
export function isWalletTestAdmin(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  if (user.isAdmin) return true
  if (user.email?.toLowerCase() === DEV_ADMIN_EMAIL) return true
  if (user.displayName === DEV_ADMIN_DISPLAY_NAME) return true
  return isAdminEmail(user.email)
}

/**
 * Ne pas réinitialiser : admins, ou comptes ayant déjà réclamé un bonus quotidien.
 */
export function isWalletStandardizeExempt(
  user: AuthUser | null | undefined,
  wallet: Wallet,
): boolean {
  if (!user?.id) return true
  if (isWalletTestAdmin(user)) return true
  if (wallet.lastDailyTokenGrant) return true
  return false
}

/** 100 jetons, 0 médailles — conserve le suivi bonus quotidien si présent. */
export function standardizedWalletForUser(wallet: Wallet): Wallet {
  return normalizeWallet({
    ...wallet,
    tokens: DEFAULT_WALLET.tokens,
    medals: DEFAULT_WALLET.medals,
  })
}

export function readLocalWalletStandardizedFlag(): boolean {
  try {
    return localStorage.getItem(WALLET_STANDARDIZE_LOCAL_FLAG) === '1'
  } catch {
    return false
  }
}

export function writeLocalWalletStandardizedFlag(): void {
  try {
    localStorage.setItem(WALLET_STANDARDIZE_LOCAL_FLAG, '1')
  } catch {
    /* mode privé */
  }
}
