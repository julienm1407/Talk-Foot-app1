import type { AvatarItem } from '../types/profile'
import { ALL_CLUBS_BY_ID } from '../data/allClubsCatalog'
import { boutiqueClubSearchHaystack, foldBoutiqueQuery } from '../data/clubPublicLabels'
import { cdm2026BundleItems } from '../data/cdm2026Bundles'
import { cdm2026JerseyItems } from '../data/cdm2026Jerseys'
import { cdm2026ShortItems } from '../data/cdm2026Shorts'
import { clubBundleItems } from '../data/clubBundles'
import { clubJerseyItems } from '../data/clubJerseys'
import { clubShortItems } from '../data/clubShorts'
import { boutiqueShoeItems } from '../data/boutiqueShoes'

export type CatalogFilter = 'jerseys' | 'shorts' | 'packs' | 'shoes'

export type CatalogSort = 'name_asc' | 'price_medals_asc' | 'price_medals_desc'

export type CatalogRow = { kind: 'cosmetic'; item: AvatarItem }

export const BOUTIQUE_CATALOG_ITEMS: AvatarItem[] = [
  ...clubJerseyItems,
  ...clubShortItems,
  ...clubBundleItems,
  ...cdm2026JerseyItems,
  ...cdm2026ShortItems,
  ...cdm2026BundleItems,
  ...boutiqueShoeItems,
]

export function findBoutiqueCatalogItem(itemId: string): AvatarItem | undefined {
  return BOUTIQUE_CATALOG_ITEMS.find((i) => i.id === itemId)
}

function itemSearchHaystack(item: AvatarItem): string {
  const meta = item.clubId ? ALL_CLUBS_BY_ID[item.clubId] : undefined
  const clubHay = item.clubId
    ? boutiqueClubSearchHaystack(item.clubId, meta?.name ?? '', meta?.shortName ?? '')
    : ''
  return `${foldBoutiqueQuery(`${item.name} ${item.description ?? ''} ${item.id}`)} ${clubHay}`
}

function matchesQuery(item: AvatarItem, q: string): boolean {
  if (!q) return true
  const qf = foldBoutiqueQuery(q)
  const hay = itemSearchHaystack(item)
  if (hay.includes(qf)) return true
  const words = qf.split(/\s+/).filter((w) => w.length >= 2)
  return words.length > 0 && words.every((w) => hay.includes(w))
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
