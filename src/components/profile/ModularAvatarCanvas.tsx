import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../../utils/cn'
import { avatarAssetMap, findAssetById } from '../../features/avatar2d/catalog'
import type { AvatarData } from '../../features/avatar2d/types'
import {
  resolveModularAvatarState,
  type ModularAvatarState,
  type ModularColorVariantKey,
  type ModularColorizableSlot,
} from '../../features/avatar2d/modularAvatarState'
import type { BoutiqueGarmentShow } from '../../utils/boutiqueModularState'

export const MODULAR_COLOR_VARIANTS: Record<ModularColorVariantKey, { label: string; filter: string }> = {
  default: { label: 'Base', filter: 'none' },
  black: { label: 'Noir', filter: 'brightness(0.42) contrast(1.2)' },
  brown: { label: 'Brun', filter: 'sepia(0.72) saturate(1.2) hue-rotate(-12deg) brightness(0.9)' },
  blond: { label: 'Blond', filter: 'sepia(0.92) saturate(1.55) hue-rotate(-6deg) brightness(1.08)' },
  auburn: { label: 'Roux', filter: 'sepia(0.95) saturate(1.7) hue-rotate(-28deg) brightness(0.96)' },
  red: { label: 'Rouge', filter: 'sepia(1) saturate(2.1) hue-rotate(-38deg) brightness(0.95)' },
  blue: { label: 'Bleu', filter: 'sepia(0.9) saturate(1.8) hue-rotate(158deg) brightness(0.98)' },
  green: { label: 'Vert', filter: 'sepia(0.95) saturate(1.65) hue-rotate(72deg) brightness(0.95)' },
  white: { label: 'Blanc', filter: 'grayscale(1) brightness(1.35) contrast(0.92)' },
}

/** Recadrage tête sur canvas 1024 (visage + cheveux, sans tenue). */
const HEAD_CLIP_BOTTOM_PCT = 58
const HEAD_ZOOM = 2.35
const HEAD_TRANSFORM_ORIGIN = '50% 20%'

function LayerImage({
  src,
  alt,
  filter,
}: {
  src: string
  alt: string
  filter?: string
}) {
  return (
    <img
      src={src}
      alt={alt}
      className="pointer-events-none absolute left-0 top-0 h-auto w-auto max-w-none"
      style={{ filter }}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  )
}

function SkinTintLayer({ maskSrc, skinTone }: { maskSrc: string; skinTone: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-55 mix-blend-multiply"
      style={{
        backgroundColor: skinTone,
        WebkitMaskImage: `url(${maskSrc})`,
        maskImage: `url(${maskSrc})`,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'top left',
        maskPosition: 'top left',
        WebkitMaskSize: 'auto',
        maskSize: 'auto',
      }}
    />
  )
}

function resolveSelectedAssets(avatar: AvatarData) {
  return {
    body: findAssetById(avatarAssetMap, 'body', avatar.body),
    hair: findAssetById(avatarAssetMap, 'hair', avatar.hair),
    eyes: findAssetById(avatarAssetMap, 'eyes', avatar.eyes),
    eyebrows: findAssetById(avatarAssetMap, 'eyebrows', avatar.eyebrows),
    nose: findAssetById(avatarAssetMap, 'nose', avatar.nose),
    mouth: findAssetById(avatarAssetMap, 'mouth', avatar.mouth),
    beard: findAssetById(avatarAssetMap, 'beard', avatar.beard),
    jersey: findAssetById(avatarAssetMap, 'jerseys', avatar.jersey),
    shorts: findAssetById(avatarAssetMap, 'shorts', avatar.shorts),
    socks: findAssetById(avatarAssetMap, 'socks', avatar.socks),
    shoes: findAssetById(avatarAssetMap, 'shoes', avatar.shoes),
    accessory: findAssetById(avatarAssetMap, 'accessories', avatar.accessory),
  }
}

type CanvasProps = {
  state?: ModularAvatarState
  crop?: 'full' | 'head'
  /** `garments` : maillot + short uniquement (aperçu boutique). */
  layersMode?: 'full' | 'garments'
  /** Recadre et zoome la zone torse (cartes boutique, comme le studio profil). */
  garmentsFocus?: boolean
  /** Zoom uniforme supplémentaire en mode `garmentsFocus` (1 = pas de zoom). */
  garmentsZoom?: number
  /** Calque(s) affichés en mode `garments` (boutique). */
  garmentsShow?: BoutiqueGarmentShow
  /** Taille du conteneur carré (px) — pour vignettes profil */
  fitSize?: number
  /** Largeur max de la scène complète (studio) */
  previewMax?: number
  /** Remplit le parent et adapte l’échelle à la zone disponible. */
  fill?: boolean
  /** PNG direct si l’asset modulaire est introuvable (ex. chaussures boutique). */
  garmentFallbackSrc?: string
  className?: string
}

/** Zone utile sur sprites 1024 (studio / boutique). */
const GARMENT_FOCUS_CLIP: Record<BoutiqueGarmentShow, string> = {
  both: 'inset(12% 4% 16% 4%)',
  jersey: 'inset(6% 4% 40% 4%)',
  shorts: 'inset(38% 4% 12% 4%)',
  shoes: 'inset(44% 6% 0% 6%)',
}
const GARMENT_FOCUS_COVER_BOOST = 1.08

function garmentFocusClip(show: BoutiqueGarmentShow): string {
  return GARMENT_FOCUS_CLIP[show]
}

export function ModularAvatarCanvas({
  state,
  crop = 'full',
  layersMode = 'full',
  garmentsFocus = false,
  garmentsZoom = 1,
  garmentsShow = 'both',
  fitSize,
  previewMax: previewMaxProp = 404,
  fill = false,
  garmentFallbackSrc,
  className,
}: CanvasProps) {
  const { data: avatar, slotColors } = resolveModularAvatarState(state)
  const isHead = crop === 'head'
  const garmentsOnly = layersMode === 'garments'
  const focusGarments = garmentsOnly && garmentsFocus
  const selectedAssets = useMemo(() => resolveSelectedAssets(avatar), [avatar])
  const [canvasSize, setCanvasSize] = useState({ width: 1024, height: 1024 })
  const fillRef = useRef<HTMLDivElement>(null)
  const [fillBox, setFillBox] = useState({ w: previewMaxProp, h: previewMaxProp })

  useEffect(() => {
    if (!fill) return
    const el = fillRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w < 1 || h < 1) return
      setFillBox({ w, h })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fill])

  const previewMax = fill
    ? Math.max(96, Math.floor(Math.min(fillBox.w, fillBox.h)))
    : previewMaxProp

  useEffect(() => {
    const refSrc =
      selectedAssets.body?.src ??
      selectedAssets.jersey?.src ??
      selectedAssets.shorts?.src ??
      selectedAssets.shoes?.src ??
      garmentFallbackSrc ??
      selectedAssets.hair?.src ??
      null
    if (!refSrc) return
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (cancelled) return
      if (!img.naturalWidth || !img.naturalHeight) return
      setCanvasSize({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.src = refSrc
    return () => {
      cancelled = true
    }
  }, [
    selectedAssets.body?.src,
    selectedAssets.jersey?.src,
    selectedAssets.shorts?.src,
    selectedAssets.shoes?.src,
    garmentFallbackSrc,
    selectedAssets.hair?.src,
  ])

  const filterFor = (slot: ModularColorizableSlot) => MODULAR_COLOR_VARIANTS[slotColors[slot]].filter

  const showJerseyLayer = garmentsShow === 'both' || garmentsShow === 'jersey'
  const showShortsLayer = garmentsShow === 'both' || garmentsShow === 'shorts'
  const showShoesLayer = garmentsShow === 'shoes'
  const shoesLayerSrc = selectedAssets.shoes?.src ?? garmentFallbackSrc

  const layers = garmentsOnly ? (
    <>
      {!isHead && showShortsLayer && selectedAssets.shorts?.src ? (
        <LayerImage src={selectedAssets.shorts.src} alt="" filter={filterFor('shorts')} />
      ) : null}
      {!isHead && showJerseyLayer && selectedAssets.jersey?.src ? (
        <LayerImage src={selectedAssets.jersey.src} alt="" filter={filterFor('jersey')} />
      ) : null}
      {!isHead && showShoesLayer && shoesLayerSrc ? (
        <LayerImage src={shoesLayerSrc} alt="" filter={filterFor('shoes')} />
      ) : null}
    </>
  ) : (
    <>
      {selectedAssets.body?.src ? <LayerImage src={selectedAssets.body.src} alt="" /> : null}
      {selectedAssets.body?.src ? (
        <SkinTintLayer maskSrc={selectedAssets.body.src} skinTone={avatar.skinTone} />
      ) : null}
      {!isHead && selectedAssets.shorts?.src ? (
        <LayerImage src={selectedAssets.shorts.src} alt="" filter={filterFor('shorts')} />
      ) : null}
      {!isHead && selectedAssets.jersey?.src ? (
        <LayerImage src={selectedAssets.jersey.src} alt="" filter={filterFor('jersey')} />
      ) : null}
      {!isHead && selectedAssets.socks?.src ? (
        <LayerImage src={selectedAssets.socks.src} alt="" filter={filterFor('socks')} />
      ) : null}
      {!isHead && selectedAssets.shoes?.src ? (
        <LayerImage src={selectedAssets.shoes.src} alt="" filter={filterFor('shoes')} />
      ) : null}
      {selectedAssets.eyes?.src ? <LayerImage src={selectedAssets.eyes.src} alt="" /> : null}
      {selectedAssets.eyebrows?.src ? <LayerImage src={selectedAssets.eyebrows.src} alt="" /> : null}
      {selectedAssets.nose?.src ? <LayerImage src={selectedAssets.nose.src} alt="" /> : null}
      {selectedAssets.mouth?.src ? <LayerImage src={selectedAssets.mouth.src} alt="" /> : null}
      {selectedAssets.beard?.src ? (
        <LayerImage src={selectedAssets.beard.src} alt="" filter={filterFor('beard')} />
      ) : null}
      {selectedAssets.hair?.src ? (
        <LayerImage src={selectedAssets.hair.src} alt="" filter={filterFor('hair')} />
      ) : null}
      {!isHead && selectedAssets.accessory?.src ? (
        <LayerImage src={selectedAssets.accessory.src} alt="" filter={filterFor('accessory')} />
      ) : null}
    </>
  )

  if (isHead && fitSize) {
    const baseScale = (fitSize / canvasSize.width) * HEAD_ZOOM
    return (
      <div
        className={cn('relative overflow-hidden', className)}
        style={{ width: fitSize, height: fitSize }}
      >
        <div
          className="absolute left-1/2 top-0"
          style={{
            width: canvasSize.width,
            height: canvasSize.height,
            marginLeft: -canvasSize.width / 2,
            transform: `scale(${baseScale})`,
            transformOrigin: HEAD_TRANSFORM_ORIGIN,
          }}
        >
          <div
            className="relative overflow-hidden"
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
              clipPath: `inset(0 0 ${HEAD_CLIP_BOTTOM_PCT}% 0)`,
              WebkitClipPath: `inset(0 0 ${HEAD_CLIP_BOTTOM_PCT}% 0)`,
            }}
          >
            {layers}
          </div>
        </div>
      </div>
    )
  }

  const layerStack = (
    <div className="relative" style={{ width: canvasSize.width, height: canvasSize.height }}>
      {layers}
    </div>
  )

  const focusLayerStack = (
    <div
      className="relative overflow-hidden"
      style={{
        width: canvasSize.width,
        height: canvasSize.height,
        clipPath: garmentFocusClip(garmentsShow),
        WebkitClipPath: garmentFocusClip(garmentsShow),
      }}
    >
      {layerStack}
    </div>
  )

  if (fill && focusGarments) {
    const baseScale =
      Math.max(fillBox.w / canvasSize.width, fillBox.h / canvasSize.height) * GARMENT_FOCUS_COVER_BOOST
    const canvasScale = baseScale * Math.max(1, garmentsZoom)
    const isShoesFocus = garmentsShow === 'shoes'

    return (
      <div ref={fillRef} className={cn('relative h-full w-full overflow-hidden', className)}>
        <div
          className="absolute left-1/2"
          style={{
            top: isShoesFocus ? '56%' : '50%',
            width: canvasSize.width,
            height: canvasSize.height,
            transform: `translate(-50%, ${isShoesFocus ? '-52%' : '-50%'}) scale(${canvasScale})`,
            transformOrigin: isShoesFocus ? '50% 100%' : 'center center',
          }}
        >
          {focusLayerStack}
        </div>
      </div>
    )
  }

  const canvasScale = Math.min(previewMax / canvasSize.width, previewMax / canvasSize.height)
  const stageWidth = Math.max(120, Math.round(canvasSize.width * canvasScale))
  const stageHeight = Math.max(120, Math.round(canvasSize.height * canvasScale))

  const scaledLayers = (
    <div
      className="absolute left-0 top-0 origin-top-left"
      style={{
        width: canvasSize.width,
        height: canvasSize.height,
        transform: `scale(${canvasScale})`,
      }}
    >
      {focusGarments ? focusLayerStack : layerStack}
    </div>
  )

  if (fill) {
    return (
      <div ref={fillRef} className={cn('relative h-full w-full', className)}>
        <div className="flex h-full w-full items-center justify-center overflow-hidden">
          <div
            className="relative shrink-0 overflow-hidden"
            style={{ width: stageWidth, height: stageHeight }}
          >
            {scaledLayers}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ width: stageWidth, height: stageHeight }}
    >
      {scaledLayers}
    </div>
  )
}

export function ModularAvatarHeadThumb({
  state,
  size = 56,
  className,
}: {
  state?: ModularAvatarState
  size?: number
  className?: string
}) {
  return <ModularAvatarCanvas state={state} crop="head" fitSize={size} className={className} />
}
