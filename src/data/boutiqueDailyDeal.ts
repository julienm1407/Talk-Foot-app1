import type { AvatarItem } from '../types/profile'
import { cosmeticTokenPrice } from './boutiqueEconomy'
import { BOUTIQUE_CATALOG_ITEMS } from '../utils/boutiqueCatalog'
import { matchCalendarDayKeyParis } from '../utils/time'

/** Réductions possibles pour l’offre du jour (médailles). */
const DAILY_DISCOUNT_PERCENTS = [15, 20, 25, 30] as const

export type BoutiqueDailyDeal = {
  /** Jour civil Europe/Paris (YYYY-MM-DD). */
  dayKey: string
  itemId: string
  item: AvatarItem
  originalCost: number
  dealCost: number
  discountPercent: number
}

function hashDaySeed(dayKey: string): number {
  const [y, m, d] = dayKey.split('-').map(Number)
  return y * 372 + m * 31 + d
}

/** PRNG déterministe — même jour Paris → même article et même remise pour tous. */
function mulberry32(seed: number): () => number {
  let state = seed
  return () => {
    state += 0x6d2b79f5
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function applyDailyDiscount(medalCost: number, discountPercent: number): number {
  return Math.max(1, Math.ceil((medalCost * (100 - discountPercent)) / 100))
}

let cachedDayKey: string | null = null
let cachedDeal: BoutiqueDailyDeal | null = null

/** Offre du jour : un article payant du catalogue, prix réduit (renouvelé à minuit Paris). */
export function getBoutiqueDailyDeal(
  dayKey: string = matchCalendarDayKeyParis(new Date()),
): BoutiqueDailyDeal | null {
  if (cachedDayKey === dayKey) {
    return cachedDeal
  }

  const eligible = BOUTIQUE_CATALOG_ITEMS.filter((i) => i.cost > 0)
  if (eligible.length === 0) {
    cachedDayKey = dayKey
    cachedDeal = null
    return null
  }

  const rng = mulberry32(hashDaySeed(dayKey))
  const item = eligible[Math.floor(rng() * eligible.length)]!
  const discountPercent = DAILY_DISCOUNT_PERCENTS[
    Math.floor(rng() * DAILY_DISCOUNT_PERCENTS.length)
  ]!
  const dealCost = applyDailyDiscount(item.cost, discountPercent)

  cachedDayKey = dayKey
  cachedDeal = {
    dayKey,
    itemId: item.id,
    item,
    originalCost: item.cost,
    dealCost,
    discountPercent,
  }
  return cachedDeal
}

export function isDailyDealItem(
  itemId: string,
  dayKey: string = matchCalendarDayKeyParis(new Date()),
): boolean {
  const deal = getBoutiqueDailyDeal(dayKey)
  return deal?.itemId === itemId
}

export function getEffectiveMedalCost(
  item: AvatarItem,
  dayKey: string = matchCalendarDayKeyParis(new Date()),
): number {
  const deal = getBoutiqueDailyDeal(dayKey)
  if (deal && deal.itemId === item.id) return deal.dealCost
  return item.cost
}

export function getEffectiveTokenCost(
  item: AvatarItem,
  dayKey: string = matchCalendarDayKeyParis(new Date()),
): number {
  return cosmeticTokenPrice(getEffectiveMedalCost(item, dayKey))
}

export function boutiqueTabHrefForItem(item: AvatarItem): string {
  if (item.bundleIncludes?.length) return '/boutique?tab=packs'
  if (item.slot === 'pants') return '/boutique?tab=shorts'
  if (item.slot === 'shoes') return '/boutique?tab=shoes'
  return '/boutique?tab=jerseys'
}
