import type { UserAppStateV1 } from '../data/userAppStateDefaults'
import type { Wallet } from '../types/bet'
import { normalizeWallet } from './walletNormalize'

type WalletBackupV1 = {
  v: 1
  savedAt: number
  wallet: Wallet
}

function storageKey(userId: string): string {
  return `talkfoot.wallet.backup.v1.${userId.trim()}`
}

function pickLatestGrant(a?: string, b?: string): string | undefined {
  if (!a) return b
  if (!b) return a
  return a >= b ? a : b
}

function mergeWallets(server: Wallet, backup: Wallet): Wallet {
  const s = normalizeWallet(server)
  const b = normalizeWallet(backup)
  return normalizeWallet({
    tokens: Math.max(s.tokens, b.tokens),
    medals: Math.max(s.medals, b.medals),
    lastDailyTokenGrant: pickLatestGrant(s.lastDailyTokenGrant, b.lastDailyTokenGrant),
  })
}

export function writeWalletBackup(userId: string, wallet: Wallet): void {
  const key = userId.trim()
  if (!key) return
  const payload: WalletBackupV1 = {
    v: 1,
    savedAt: Date.now(),
    wallet: normalizeWallet(wallet),
  }
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(payload))
  } catch {
    /* quota / private mode */
  }
}

export function readWalletBackup(userId: string): WalletBackupV1 | null {
  const key = userId.trim()
  if (!key) return null
  try {
    const raw = localStorage.getItem(storageKey(key))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<WalletBackupV1>
    if (parsed.v !== 1 || typeof parsed.savedAt !== 'number') return null
    if (!parsed.wallet) return null
    return { v: 1, savedAt: parsed.savedAt, wallet: normalizeWallet(parsed.wallet) }
  } catch {
    return null
  }
}

/** Réapplique le meilleur solde local si le cloud est en retard ou réinitialisé. */
export function mergeWalletBackupIntoApp(
  userId: string,
  app: UserAppStateV1,
): { app: UserAppStateV1; restoredFromBackup: boolean } {
  const backup = readWalletBackup(userId)
  if (!backup) return { app, restoredFromBackup: false }

  const mergedWallet = mergeWallets(app.wallet, backup.wallet)
  const current = normalizeWallet(app.wallet)
  if (
    mergedWallet.tokens === current.tokens &&
    mergedWallet.medals === current.medals &&
    mergedWallet.lastDailyTokenGrant === current.lastDailyTokenGrant
  ) {
    return { app, restoredFromBackup: false }
  }

  return {
    app: { ...app, wallet: mergedWallet },
    restoredFromBackup: true,
  }
}

/** Avant écriture cloud : ne jamais envoyer un solde inférieur à la sauvegarde locale. */
export function coalesceAppStateWithWalletBackup(userId: string, app: UserAppStateV1): UserAppStateV1 {
  return mergeWalletBackupIntoApp(userId, app).app
}
