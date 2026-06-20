import type { UserAppStateV1 } from '../data/userAppStateDefaults'
import type { Wallet } from '../types/bet'
import { DEFAULT_WALLET, normalizeWallet } from './walletNormalize'

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

/** Aligné sur talkfoot_merge_client_app_state côté Supabase. */
export function mergeWalletTokens(serverTokens: number, backupTokens: number): number {
  const server = Math.max(0, serverTokens)
  const backup = Math.max(0, backupTokens)
  const defaultTokens = DEFAULT_WALLET.tokens

  // Vieux onglet / client par défaut : ne pas écraser un solde cloud déjà enrichi.
  if (backup === defaultTokens && server > defaultTokens) return server
  // Gain local pas encore synchronisé.
  if (backup > server) return backup
  // Dépense locale ou solde déjà aligné : faire confiance au backup (y compris comptes admin).
  return backup
}

function mergeWalletMedals(
  serverMedals: number,
  backupMedals: number,
  mergedTokens: number,
  backupTokens: number,
): number {
  const server = Math.max(0, serverMedals)
  const backup = Math.max(0, backupMedals)
  if (backup > server) return backup
  if (mergedTokens === backupTokens && backup <= server) return backup
  return server
}

function mergeWallets(server: Wallet, backup: Wallet): Wallet {
  const s = normalizeWallet(server)
  const b = normalizeWallet(backup)
  const tokens = mergeWalletTokens(s.tokens, b.tokens)
  const medals = mergeWalletMedals(s.medals, b.medals, tokens, b.tokens)

  return normalizeWallet({
    tokens,
    medals,
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

/** Réapplique le solde local si le cloud est en retard ou réinitialisé (100 jetons par défaut). */
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

/** Avant écriture cloud : relève le solde seulement si la session ressemble au défaut non synchronisé. */
export function coalesceAppStateWithWalletBackup(userId: string, app: UserAppStateV1): UserAppStateV1 {
  const backup = readWalletBackup(userId)
  if (!backup) return app

  const current = normalizeWallet(app.wallet)
  const b = normalizeWallet(backup.wallet)
  const defaultTokens = DEFAULT_WALLET.tokens

  if (current.tokens === defaultTokens && b.tokens > defaultTokens) {
    return mergeWalletBackupIntoApp(userId, app).app
  }

  if (b.tokens > current.tokens || b.medals > current.medals) {
    return mergeWalletBackupIntoApp(userId, app).app
  }

  return app
}
