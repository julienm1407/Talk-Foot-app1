import type { Wallet } from '../types/bet'
import {
  DEFAULT_WALLET,
  isWalletStored,
  normalizeWallet,
  WALLET_STORAGE_KEY,
} from '../utils/walletNormalize'

type Listener = () => void

function readWalletFromStorage(): Wallet {
  try {
    const raw = localStorage.getItem(WALLET_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_WALLET }
    const parsed: unknown = JSON.parse(raw)
    if (!isWalletStored(parsed)) return { ...DEFAULT_WALLET }
    return normalizeWallet(parsed)
  } catch {
    return { ...DEFAULT_WALLET }
  }
}

let memoryWallet: Wallet = readWalletFromStorage()
let persistToStorage = true
const listeners = new Set<Listener>()

export function configureWalletStore(options: { persist: boolean }) {
  persistToStorage = options.persist
}

export function getWalletSnapshot(): Wallet {
  return memoryWallet
}

export function subscribeWallet(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit() {
  listeners.forEach((listener) => listener())
}

function writeWallet(next: Wallet) {
  memoryWallet = next
  if (persistToStorage) {
    try {
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(memoryWallet))
    } catch {
      /* quota / private mode */
    }
  }
  emit()
}

export function patchWalletStore(fn: (wallet: Wallet) => Wallet): void {
  const next = normalizeWallet(fn(memoryWallet))
  if (
    next.tokens === memoryWallet.tokens &&
    next.medals === memoryWallet.medals &&
    next.lastDailyTokenGrant === memoryWallet.lastDailyTokenGrant
  ) {
    return
  }
  writeWallet(next)
}

/** Réaligne le store local (ex. après hydratation cloud). */
export function replaceWalletStore(wallet: Wallet): void {
  writeWallet(normalizeWallet(wallet))
}
