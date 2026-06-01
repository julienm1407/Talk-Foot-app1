import type { AvatarAsset, AvatarAssetCategory, AvatarAssetMap, AvatarData, AvatarSlotKey } from './types'
import {
  modularGarmentDisplayName,
  sortModularGarmentAssets,
} from '../../utils/modularGarmentDisplayName'

const CATEGORY_ORDER: AvatarAssetCategory[] = [
  'body',
  'hair',
  'eyes',
  'eyebrows',
  'nose',
  'mouth',
  'beard',
  'jerseys',
  'shorts',
  'shoes',
]

const categoryByFolder = new Map<AvatarAssetCategory, AvatarAssetCategory>([
  ['body', 'body'],
  ['hair', 'hair'],
  ['eyes', 'eyes'],
  ['eyebrows', 'eyebrows'],
  ['nose', 'nose'],
  ['mouth', 'mouth'],
  ['beard', 'beard'],
  ['jerseys', 'jerseys'],
  ['shorts', 'shorts'],
  ['shoes', 'shoes'],
])

const ASSET_MODULES = import.meta.glob<string>(
  '/assets/{body,hair,eyes,eyebrows,nose,mouth,beard,jerseys,shorts,shoes}/*.png',
  { eager: true, import: 'default' },
)

function emptyAssetMap(): AvatarAssetMap {
  return {
    body: [],
    hair: [],
    eyes: [],
    eyebrows: [],
    nose: [],
    mouth: [],
    beard: [],
    jerseys: [],
    shorts: [],
    socks: [],
    shoes: [],
    accessories: [],
  }
}

function humanizeFileName(fileName: string): string {
  const withoutPrefix = fileName.replace(/^c__users_user_.*?_images_/i, '').replace(/^images_/i, '')
  const noExt = withoutPrefix.replace(/\.png$/i, '')
  const noUuid = noExt.replace(/-[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i, '')
  return noUuid
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function slugFromPath(path: string): string {
  return path
    .replace(/^\/assets\//i, '')
    .replace(/\.png$/i, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/(^-|-$)/g, '')
    .toLowerCase()
}

export function buildAvatarAssetMap(): AvatarAssetMap {
  const map = emptyAssetMap()

  const assetPathRe =
    /(?:^|\/)assets\/(body|hair|eyes|eyebrows|nose|mouth|beard|jerseys|shorts|shoes)\/([^/?#]+\.png)$/i

  for (const [path, src] of Object.entries(ASSET_MODULES)) {
    const normalized = path.replace(/\\/g, '/')
    const match = normalized.match(assetPathRe)
    if (!match) continue

    const folder = match[1] as AvatarAssetCategory
    const fileName = match[2]
    const category = categoryByFolder.get(folder)
    if (!category) continue

    const slugPath = `/assets/${folder}/${fileName.replace(/\.png$/i, '')}`

    const displayName = modularGarmentDisplayName(slugFromPath(slugPath), category)
    map[category].push({
      id: slugFromPath(slugPath),
      name: displayName ?? humanizeFileName(fileName),
      src,
      fileName,
      category,
    })
  }

  map.jerseys = sortModularGarmentAssets(map.jerseys, 'jerseys')
  map.shorts = sortModularGarmentAssets(map.shorts, 'shorts')
  map.shoes = sortModularGarmentAssets(map.shoes, 'shoes')

  for (const key of CATEGORY_ORDER) {
    if (key === 'jerseys' || key === 'shorts' || key === 'shoes') continue
    map[key].sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
  }

  return map
}

export const avatarAssetMap = buildAvatarAssetMap()

export function findAssetById(assetMap: AvatarAssetMap, category: AvatarAssetCategory, id: string | null): AvatarAsset | null {
  if (!id) return null
  return assetMap[category].find((asset) => asset.id === id) ?? null
}

function firstAssetId(assetMap: AvatarAssetMap, category: AvatarAssetCategory): string | null {
  return assetMap[category][0]?.id ?? null
}

export function createDefaultAvatarData(assetMap: AvatarAssetMap = avatarAssetMap): AvatarData {
  return {
    skinTone: '#e2c2a6',
    body: firstAssetId(assetMap, 'body'),
    hair: firstAssetId(assetMap, 'hair'),
    eyes: firstAssetId(assetMap, 'eyes'),
    eyebrows: firstAssetId(assetMap, 'eyebrows'),
    nose: firstAssetId(assetMap, 'nose'),
    mouth: firstAssetId(assetMap, 'mouth'),
    beard: firstAssetId(assetMap, 'beard'),
    jersey: firstAssetId(assetMap, 'jerseys'),
    shorts: firstAssetId(assetMap, 'shorts'),
    socks: null,
    shoes: firstAssetId(assetMap, 'shoes'),
    accessory: null,
  }
}

export const slotToCategory: Record<AvatarSlotKey, AvatarAssetCategory> = {
  body: 'body',
  hair: 'hair',
  eyes: 'eyes',
  eyebrows: 'eyebrows',
  nose: 'nose',
  mouth: 'mouth',
  beard: 'beard',
  jersey: 'jerseys',
  shorts: 'shorts',
  socks: 'socks',
  shoes: 'shoes',
  accessory: 'accessories',
}

