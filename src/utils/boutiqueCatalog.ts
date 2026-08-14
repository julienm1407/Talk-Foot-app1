import type { AvatarItem } from '../types/profile'
import { cdm2026BundleItems } from '../data/cdm2026Bundles'
import { cdm2026JerseyItems } from '../data/cdm2026Jerseys'
import { cdm2026ShortItems } from '../data/cdm2026Shorts'
import { clubJerseyItems } from '../data/clubJerseys'
import { boutiqueShoeItems } from '../data/boutiqueShoes'

export type CatalogFilter = 'jerseys' | 'shorts' | 'packs' | 'shoes'

export type CatalogSort = 'name_asc' | 'price_medals_asc' | 'price_medals_desc'

export type CatalogRow = { kind: 'cosmetic'; item: AvatarItem }

export const BOUTIQUE_CATALOG_ITEMS: AvatarItem[] = [
  ...clubJerseyItems,
  ...cdm2026JerseyItems,
  ...cdm2026ShortItems,
  ...cdm2026BundleItems,
  ...boutiqueShoeItems,
]

export function findBoutiqueCatalogItem(itemId: string): AvatarItem | undefined {
  return BOUTIQUE_CATALOG_ITEMS.find((i) => i.id === itemId)
}

function matchesQuery(item: AvatarItem, q: string): boolean {
  if (!q) return true
  const n = item.name.toLowerCase()
  const d = item.description?.toLowerCase() ?? ''
  return n.includes(q) || d.includes(q)
}

export function buildCatalogRows(filter: CatalogFilter, query: string): CatalogRow[] {
  const q = query.trim().toLowerCase()
  let items = BOUTIQUE_CATALOG_ITEMS

  if (filter === 'jerseys') {
    items = items.filter((i) => i.slot === 'jersey' && !i.bundleIncludes?.length)
  } else if (filter === 'shorts') {
    items = items.filter((i) => i.slot === 'pants')
  } else if (filter === 'packs') {
    items = items.filter((i) => i.bundleIncludes?.length)
  } else {
    items = items.filter(
      (i) => i.slot === 'shoes' && i.id !== 'shoes-sneaker-white' && i.cost > 0,
    )
  }

  items = items.filter((i) => matchesQuery(i, q))

  return items.map((item) => ({ kind: 'cosmetic', item }))
}

function freeFirstCmp(a: CatalogRow, b: CatalogRow): number {
  const freeA = a.item.cost === 0 ? 0 : 1
  const freeB = b.item.cost === 0 ? 0 : 1
  return freeA - freeB
}

export function sortCatalogRows(rows: CatalogRow[], sort: CatalogSort): CatalogRow[] {
  const copy = [...rows]
  if (sort === 'price_medals_asc') {
    copy.sort((a, b) => {
      const free = freeFirstCmp(a, b)
      if (free !== 0) return free
      return a.item.cost - b.item.cost
    })
  } else if (sort === 'price_medals_desc') {
    copy.sort((a, b) => {
      const free = freeFirstCmp(a, b)
      if (free !== 0) return free
      return b.item.cost - a.item.cost
    })
  } else {
    copy.sort((a, b) => {
      const free = freeFirstCmp(a, b)
      if (free !== 0) return free
      return a.item.name.localeCompare(b.item.name, 'fr')
    })
  }
  return copy
}
