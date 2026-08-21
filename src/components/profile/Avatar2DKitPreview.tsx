import { useMemo } from 'react'
import type { AvatarCharacterLook, AvatarItem } from '../../types/profile'
import { CharacterAvatarSvg } from './CharacterAvatarSvg'
import { DEFAULT_CHARACTER_LOOK, mergeCharacterLook } from '../../data/characterPresets'
import { avatarItems } from '../../data/shop'
import { cdm2026JerseyByNationIso } from '../../data/cdm2026Jerseys'
import { cdm2026ShortByNationIso } from '../../data/cdm2026Shorts'
import { clubJerseyByClubId } from '../../data/clubJerseys'
import { clubShortByClubId } from '../../data/clubShorts'
import { viteBasePath } from '../../seo/basePath'

function assetUrl(path: string): string {
  if (!path.startsWith('/')) return path
  const base = viteBasePath()
  return base ? `${base}${path}` : path
}

const BASE_W = 100
const BASE_H = 140

const SIZE_MAP = {
  thumb: { width: 52, height: 74, scale: 0.52 },
  head: { width: 56, height: 56, scale: 0.56 },
  boutique: { width: 96, height: 112, scale: 0.96 },
  profile: { width: 136, height: 196, scale: 1.36 },
  showcase: { width: 136, height: 196, scale: 1.36 },
} as const

/** Recadrage tête (viewBox 100×140 : coupe sous le cou, zoom visage). */
const HEAD_CLIP_BOTTOM_PCT = 50
const HEAD_ZOOM = 1.88
const HEAD_TRANSFORM_ORIGIN = '50% 30%'

export type Avatar2DKitPreviewSize = keyof typeof SIZE_MAP

function findItem(id: string): AvatarItem | undefined {
  return avatarItems.find((i) => i.id === id)
}

/** Associe maillot ↔ short pour l’aperçu boutique (même logique que le profil). */
export function resolveKitPreviewPair(item: AvatarItem): {
  kit: AvatarItem
  pants: AvatarItem
} {
  const defaultKit = findItem('kit-default')!
  const defaultPants = findItem('pants-kit')!

  if (item.slot === 'jersey') {
    let pants = defaultPants
    if (item.nationIso && cdm2026ShortByNationIso[item.nationIso]) {
      pants = cdm2026ShortByNationIso[item.nationIso]
    } else if (item.clubId && clubShortByClubId[item.clubId]) {
      pants = clubShortByClubId[item.clubId]
    } else {
      const baseColor = item.id.match(/^kit-base-(.+)$/)?.[1]
      if (baseColor) pants = findItem(`pants-base-${baseColor}`) ?? defaultPants
    }
    return { kit: item, pants }
  }

  if (item.slot === 'pants') {
    let kit = defaultKit
    if (item.nationIso && cdm2026JerseyByNationIso[item.nationIso]) {
      kit = cdm2026JerseyByNationIso[item.nationIso]
    } else if (item.clubId && clubJerseyByClubId[item.clubId]) {
      kit = clubJerseyByClubId[item.clubId]
    } else {
      const baseColor = item.id.match(/^pants-base-(.+)$/)?.[1]
      if (baseColor) kit = findItem(`kit-base-${baseColor}`) ?? defaultKit
    }
    return { kit, pants: item }
  }

  return { kit: defaultKit, pants: defaultPants }
}

type Props = {
  kitItem?: AvatarItem | null
  pantsItem?: AvatarItem | null
  look?: AvatarCharacterLook
  size?: Avatar2DKitPreviewSize
  /** `head` : vignette profil (visage uniquement, sans corps / tenue). */
  crop?: 'full' | 'head'
  /** Boutique : uniquement les PNG maillot/short (même calques que le profil). */
  garmentsOnly?: boolean
  className?: string
  accessoryEmoji?: string | null
  accessoryClass?: string
}

/**
 * Aperçu personnage 2D (skin de base + maillot/short PNG) — même rendu que
 * le profil et le studio modulaire (`Avatar2DComposer`).
 */
export function Avatar2DKitPreview({
  kitItem,
  pantsItem,
  look: lookProp,
  size = 'boutique',
  crop = 'full',
  garmentsOnly = false,
  className,
  accessoryEmoji,
  accessoryClass,
}: Props) {
  const kit = kitItem ?? findItem('kit-default')
  const pants = pantsItem ?? findItem('pants-kit')
  const look = useMemo(
    () => mergeCharacterLook(lookProp ?? DEFAULT_CHARACTER_LOOK),
    [lookProp],
  )
  const pantsId = pants?.id ?? 'pants-kit'
  const shoesId = 'shoes-studs'
  const box = SIZE_MAP[size]
  const isHead = crop === 'head'
  const hasPantsPng = Boolean(pants?.pantsVisual?.imageUrl) && !isHead
  const showJerseyPng = Boolean(kit?.jerseyVisual?.imageUrl) && !isHead
  const scale = box.scale * (isHead ? HEAD_ZOOM : 1)

  const garmentLayers = (
    <>
      {showJerseyPng ? (
        <img
          src={assetUrl(kit!.jerseyVisual!.imageUrl!)}
          alt=""
          aria-hidden
          loading="eager"
          decoding="async"
          draggable={false}
          style={
            hasPantsPng
              ? {
                  maskImage:
                    'radial-gradient(ellipse 28% 22% at 50% 6%, transparent 70%, black 92%)',
                  WebkitMaskImage:
                    'radial-gradient(ellipse 28% 22% at 50% 6%, transparent 70%, black 92%)',
                }
              : undefined
          }
          className="pointer-events-none absolute left-1/2 top-[26%] z-[2] w-[86%] -translate-x-1/2 select-none object-contain object-top"
        />
      ) : null}
      {hasPantsPng ? (
        <img
          src={assetUrl(pants!.pantsVisual!.imageUrl!)}
          alt=""
          aria-hidden
          loading="eager"
          decoding="async"
          draggable={false}
          className="pointer-events-none absolute left-1/2 top-[50%] z-[2] w-[70%] -translate-x-1/2 select-none object-contain object-bottom"
        />
      ) : null}
    </>
  )

  if (garmentsOnly) {
    return (
      <div
        className={className}
        style={{ width: BASE_W, height: BASE_H }}
      >
        <div className="relative h-full w-full" style={{ width: BASE_W, height: BASE_H }}>
          {garmentLayers}
        </div>
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{ width: box.width, height: box.height }}
    >
      <div
        className={isHead ? 'h-full w-full overflow-hidden' : undefined}
        style={
          isHead
            ? {
                clipPath: `inset(0 0 ${HEAD_CLIP_BOTTOM_PCT}% 0)`,
                WebkitClipPath: `inset(0 0 ${HEAD_CLIP_BOTTOM_PCT}% 0)`,
              }
            : undefined
        }
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: isHead ? HEAD_TRANSFORM_ORIGIN : 'top left',
          }}
        >
        <div
          className="relative inline-flex items-start justify-start"
          style={{ width: BASE_W, height: BASE_H }}
        >
          <div className="absolute inset-0 rounded-[30px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.16),transparent_56%)]" />
          <div className="absolute inset-0 rounded-[30px] bg-[radial-gradient(ellipse_at_bottom,rgba(15,23,42,0.25),transparent_45%)]" />
          <CharacterAvatarSvg
            look={look}
            jerseyOverride={kit?.jerseyVisual ?? null}
            supporterColors={null}
            variant="front"
            className="drop-shadow-[0_2px_6px_rgba(2,6,23,0.2)]"
            pantsItemId={pantsId}
            shoesItemId={shoesId}
          />
          {garmentLayers}
          {accessoryEmoji ? (
            <div
              className={`pointer-events-none absolute right-0 top-[55%] z-10 -translate-y-1/2 drop-shadow-[0_2px_6px_rgba(2,6,23,0.55)] ${accessoryClass ?? ''}`}
              aria-hidden
            >
              {accessoryEmoji}
            </div>
          ) : null}
        </div>
        </div>
      </div>
    </div>
  )
}
