import type { AvatarItem, MedalPack } from '../types/profile'
import { baseAvatarItems, medalPacks } from '../data/shop'
import { inspiredJerseyItems } from '../data/inspiredJerseys'

export type CatalogFilter = 'all' | 'accessories' | 'kits' | 'outfit_lower' | 'medals_eur'

export type CatalogSort = 'featured' | 'price_medals_asc' | 'price_medals_desc' | 'rarity_desc'

export type CatalogRow =
  | { kind: 'cosmetic'; item: AvatarItem }
  | { kind: 'pack'; pack: MedalPack }

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

export function buildCatalogRows(filter: CatalogFilter, query: string): CatalogRow[] {
  const q = query.trim().toLowerCase()
  let items = [...baseAvatarItems, ...inspiredJerseyItems]

  if (filter === 'accessories') {
    items = items.filter((i) => i.slot === 'accessory')
  } else if (filter === 'kits') {
    items = items.filter((i) => i.slot === 'jersey')
  } else if (filter === 'outfit_lower') {
    items = items.filter((i) => i.slot === 'pants' || i.slot === 'shoes')
  } else if (filter === 'medals_eur') {
    items = []
  }

  items = items.filter((i) => matchesQuery(i, q))

  let rows: CatalogRow[] = items.map((item) => ({ kind: 'cosmetic', item }))

  if (filter === 'all' || filter === 'medals_eur') {
    const packs = medalPacks.filter((p) => matchesPackQuery(p, q))
    if (filter === 'medals_eur') {
      rows = packs.map((pack) => ({ kind: 'pack' as const, pack }))
    } else {
      rows = [...rows, ...packs.map((pack) => ({ kind: 'pack' as const, pack }))]
    }
  }

  return rows
}

function priceMedals(r: CatalogRow): number {
  return r.kind === 'cosmetic' ? r.item.cost : r.pack.medals + (r.pack.bonus ?? 0)
}

export function sortCatalogRows(rows: CatalogRow[], sort: CatalogSort): CatalogRow[] {
  const copy = [...rows]
  if (sort === 'price_medals_asc') {
    copy.sort((a, b) => priceMedals(a) - priceMedals(b))
  } else if (sort === 'price_medals_desc') {
    copy.sort((a, b) => priceMedals(b) - priceMedals(a))
  } else if (sort === 'rarity_desc') {
    copy.sort((a, b) => {
      if (a.kind === 'pack' && b.kind === 'pack') {
        return medalPacks.findIndex((x) => x.id === a.pack.id) - medalPacks.findIndex((x) => x.id === b.pack.id)
      }
      if (a.kind === 'pack') return 1
      if (b.kind === 'pack') return -1
      return RARITY_ORDER[b.item.rarity] - RARITY_ORDER[a.item.rarity]
    })
  } else {
    copy.sort((a, b) => {
      if (a.kind === 'pack' && b.kind === 'pack') {
        return medalPacks.findIndex((x) => x.id === a.pack.id) - medalPacks.findIndex((x) => x.id === b.pack.id)
      }
      if (a.kind === 'cosmetic' && b.kind === 'cosmetic') {
        return RARITY_ORDER[b.item.rarity] - RARITY_ORDER[a.item.rarity]
      }
      return a.kind === 'cosmetic' ? -1 : 1
    })
  }
  return copy
}
