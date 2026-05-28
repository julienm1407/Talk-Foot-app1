export type AvatarAssetCategory =
  | 'body'
  | 'hair'
  | 'eyes'
  | 'eyebrows'
  | 'nose'
  | 'mouth'
  | 'beard'
  | 'jerseys'
  | 'shorts'
  | 'socks'
  | 'shoes'
  | 'accessories'

export type AvatarSlotKey =
  | 'body'
  | 'hair'
  | 'eyes'
  | 'eyebrows'
  | 'nose'
  | 'mouth'
  | 'beard'
  | 'jersey'
  | 'shorts'
  | 'socks'
  | 'shoes'
  | 'accessory'

export type AvatarAssetMap = Record<AvatarAssetCategory, AvatarAsset[]>

export interface AvatarAsset {
  id: string
  name: string
  src: string
  fileName: string
  category: AvatarAssetCategory
}

export interface AvatarData {
  skinTone: string
  body: string | null
  hair: string | null
  eyes: string | null
  eyebrows: string | null
  nose: string | null
  mouth: string | null
  beard: string | null
  jersey: string | null
  shorts: string | null
  socks: string | null
  shoes: string | null
  accessory: string | null
}

