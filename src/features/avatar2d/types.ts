export type AvatarAssetCategory =
  | 'body'
  | 'hair'
  | 'eyes'
  | 'nose'
  | 'mouth'
  | 'beard'
  | 'jerseys'
  | 'shorts'
  | 'shoes'

export type AvatarSlotKey =
  | 'body'
  | 'hair'
  | 'eyes'
  | 'nose'
  | 'mouth'
  | 'beard'
  | 'jersey'
  | 'shorts'
  | 'shoes'

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
  nose: string | null
  mouth: string | null
  beard: string | null
  jersey: string | null
  shorts: string | null
  shoes: string | null
}

