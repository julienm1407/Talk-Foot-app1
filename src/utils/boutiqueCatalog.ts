import type { AvatarItem, MedalPack } from '../types/profile'
import { baseAvatarItems, medalPacks } from '../data/shop'
import { cdm2026JerseyItems } from '../data/cdm2026Jerseys'

export type CatalogFilter = 'all' | 'accessories' | 'kits' | 'outfit_lower'

export type CatalogSort = 'featured' | 'price_medals_asc' | 'price_medals_desc' | 'rarity_desc'

export type CatalogRow = { kind: 'cosmetic'; item: AvatarItem }

const RARITY_ORDER: Record<AvatarItem['rarity'], number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
}

function matchesQuery(item: AvatarItem, q: string): boolean {
  if (!q) return true
  const n = item.name.toLowerCase()
  const d = item.description?.toLowerCase() ?? ''
  const note = item.inspirationNote?.toLowerCase() ?? ''
  return n.includes(q) || d.includes(q) || note.includes(q)
}

function matchesPackQuery(pack: MedalPack, q: string): boolean {
  if (!q) return true
  return (
    pack.name.toLowerCase().includes(q) ||
    pack.tagline.toLowerCase().includes(q) ||
    (pack.flavor?.toLowerCase().includes(q) ?? false)
  )
}

/** Packs médailles (€) — vitrine séparée du catalogue cosmétiques. */
export function filterMedalPacksByQuery(query: string): MedalPack[] {
  const q = query.trim().toLowerCase()
  return medalPacks.filter((p) => matchesPackQuery(p, q))
}

export function buildCatalogRows(filter: CatalogFilter, query: string): CatalogRow[] {
  const q = query.trim().toLowerCase()
  let items = [...baseAvatarItems, ...cdm2026JerseyItems]

  if (filter === 'accessories') {
    items = items.filter((i) => i.slot === 'accessory')
  } else if (filter === 'kits') {
    items = items.filter((i) => i.slot === 'jersey')
  } else if (filter === 'outfit_lower') {
    items = items.filter((i) => i.slot === 'pants' || i.slot === 'shoes')
  }

  items = items.filter((i) => matchesQuery(i, q))

  return items.map((item) => ({ kind: 'cosmetic', item }))
}

function priceMedals(r: CatalogRow): number {
  return r.item.cost
}

export function sortCatalogRows(rows: CatalogRow[], sort: CatalogSort): CatalogRow[] {
  const copy = [...rows]
  if (sort === 'price_medals_asc') {
    copy.sort((a, b) => priceMedals(a) - priceMedals(b))
  } else if (sort === 'price_medals_desc') {
    copy.sort((a, b) => priceMedals(b) - priceMedals(a))
  } else if (sort === 'rarity_desc') {
    copy.sort((a, b) => RARITY_ORDER[b.item.rarity] - RARITY_ORDER[a.item.rarity])
  } else {
    copy.sort((a, b) => RARITY_ORDER[b.item.rarity] - RARITY_ORDER[a.item.rarity])
  }
  return copy
}
