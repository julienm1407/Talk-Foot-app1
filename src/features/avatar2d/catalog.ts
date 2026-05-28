import type { AvatarAsset, AvatarAssetCategory, AvatarAssetMap, AvatarData, AvatarSlotKey } from './types'

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
  'socks',
  'shoes',
  'accessories',
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
  ['socks', 'socks'],
  ['shoes', 'shoes'],
  ['accessories', 'accessories'],
])

const ASSET_MODULES = import.meta.glob<string>(
  '/assets/{body,hair,eyes,eyebrows,nose,mouth,beard,jerseys,shorts,socks,shoes,accessories}/*.png',
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

  for (const [path, src] of Object.entries(ASSET_MODULES)) {
    const parts = path.split('/')
    const folder = parts[2] as AvatarAssetCategory | undefined
    const fileName = parts[3]

    if (!folder || !fileName) continue
    const category = categoryByFolder.get(folder)
    if (!category) continue

    map[category].push({
      id: slugFromPath(path),
      name: humanizeFileName(fileName),
      src,
      fileName,
      category,
    })
  }

  for (const key of CATEGORY_ORDER) {
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
    socks: firstAssetId(assetMap, 'socks'),
    shoes: firstAssetId(assetMap, 'shoes'),
    accessory: firstAssetId(assetMap, 'accessories'),
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

