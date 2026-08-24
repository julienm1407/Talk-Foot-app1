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
import {
  SPRITE_CHAR_BOX,
  SPRITE_HEAD_BOX,
  SPRITE_KIT_BOX,
  type ModularThumbCrop,
} from './modularPPFraming'

type SpriteBox = { left: number; top: number; width: number; height: number }

function spriteBoxForCrop(crop: 'full' | ModularThumbCrop | undefined): SpriteBox {
  if (crop === 'head') return SPRITE_HEAD_BOX
  if (crop === 'full') return SPRITE_CHAR_BOX
  return SPRITE_KIT_BOX
}

/** Place une zone du sprite dans un carré.
 * `contain` = tout visible (pas de coupe cheveux) ; `cover` = remplit le cercle. */
function spriteFitTransform(
  fitSize: number,
  canvas: { width: number; height: number },
  box: SpriteBox,
  mode: 'contain' | 'cover',
  pad = 1,
) {
  const boxW = Math.max(1, box.width * canvas.width)
  const boxH = Math.max(1, box.height * canvas.height)
  const scale =
    (mode === 'contain' ? Math.min(fitSize / boxW, fitSize / boxH) : Math.max(fitSize / boxW, fitSize / boxH)) *
    pad
  const cx = (box.left + box.width / 2) * canvas.width
  const cy = (box.top + box.height / 2) * canvas.height
  return { scale, cx, cy }
}

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

function LayerImage({
  src,
  alt,
  filter,
  priority,
}: {
  src: string
  alt: string
  filter?: string
  priority?: boolean
}) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return null
  return (
    <img
      src={src}
      alt={alt}
      className={cn(
        'pointer-events-none absolute left-0 top-0 h-auto w-auto max-w-none',
        priority && '[transform:translateZ(0)]',
      )}
      style={{ filter }}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding={priority ? 'sync' : 'async'}
      draggable={false}
      onError={() => setFailed(true)}
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
    nose: findAssetById(avatarAssetMap, 'nose', avatar.nose),
    mouth: findAssetById(avatarAssetMap, 'mouth', avatar.mouth),
    beard: findAssetById(avatarAssetMap, 'beard', avatar.beard),
    jersey: findAssetById(avatarAssetMap, 'jerseys', avatar.jersey),
    shorts: findAssetById(avatarAssetMap, 'shorts', avatar.shorts),
    shoes: findAssetById(avatarAssetMap, 'shoes', avatar.shoes),
  }
}

type CanvasProps = {
  state?: ModularAvatarState
  crop?: 'full' | ModularThumbCrop
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
  /** Zoom sur les pieds (aperçu chaussures sur l’avatar). */
  feetFocus?: boolean
  /** Cadre portrait profil public : corps pleine hauteur du cadre. */
  portraitFocus?: boolean
  /** Chargement immédiat des calques (modales boutique, iOS Safari). */
  imagePriority?: boolean
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
/** Marge intérieure — corps entier visible dans le cadre portrait (profil joueur). */
const PORTRAIT_FRAME_CONTAIN_PAD = 0.96
/** Léger zoom : compense le vide PNG sans couper pieds / tête. */
const PORTRAIT_FRAME_ZOOM = 1.06

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
  feetFocus = false,
  portraitFocus = false,
  imagePriority = false,
  className,
}: CanvasProps) {
  const { data: avatar, slotColors } = resolveModularAvatarState(state)
  const isHead = crop === 'head'
  const isKitThumb = crop === 'bust' || crop === 'kit' || crop === 'head'
  /** Tête seule : on masque maillot / short / chaussures. Kit / buste les gardent. */
  const hideBodyGarments = isHead
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

  const eagerLayers = imagePriority || (isKitThumb && Boolean(fitSize))
  const imgProps = { priority: eagerLayers }

  const bodyWithSkinTint =
    selectedAssets.body?.src ? (
      <div className="absolute inset-0 isolate">
        <LayerImage src={selectedAssets.body.src} alt="" {...imgProps} />
        <SkinTintLayer maskSrc={selectedAssets.body.src} skinTone={avatar.skinTone} />
      </div>
    ) : null

  const layers = garmentsOnly ? (
    <>
      {!hideBodyGarments && showShortsLayer && selectedAssets.shorts?.src ? (
        <LayerImage src={selectedAssets.shorts.src} alt="" filter={filterFor('shorts')} {...imgProps} />
      ) : null}
      {!hideBodyGarments && showJerseyLayer && selectedAssets.jersey?.src ? (
        <LayerImage src={selectedAssets.jersey.src} alt="" filter={filterFor('jersey')} {...imgProps} />
      ) : null}
      {!hideBodyGarments && showShoesLayer && shoesLayerSrc ? (
        <LayerImage src={shoesLayerSrc} alt="" filter={filterFor('shoes')} {...imgProps} />
      ) : null}
    </>
  ) : (
    <>
      {bodyWithSkinTint}
      {!hideBodyGarments && selectedAssets.shorts?.src ? (
        <LayerImage src={selectedAssets.shorts.src} alt="" filter={filterFor('shorts')} {...imgProps} />
      ) : null}
      {!hideBodyGarments && selectedAssets.jersey?.src ? (
        <LayerImage src={selectedAssets.jersey.src} alt="" filter={filterFor('jersey')} {...imgProps} />
      ) : null}
      {!hideBodyGarments && shoesLayerSrc ? (
        <LayerImage src={shoesLayerSrc} alt="" filter={filterFor('shoes')} {...imgProps} />
      ) : null}
      {selectedAssets.eyes?.src ? <LayerImage src={selectedAssets.eyes.src} alt="" {...imgProps} /> : null}
      {selectedAssets.nose?.src ? <LayerImage src={selectedAssets.nose.src} alt="" {...imgProps} /> : null}
      {selectedAssets.mouth?.src ? <LayerImage src={selectedAssets.mouth.src} alt="" {...imgProps} /> : null}
      {selectedAssets.beard?.src ? (
        <LayerImage src={selectedAssets.beard.src} alt="" filter={filterFor('beard')} {...imgProps} />
      ) : null}
      {selectedAssets.hair?.src ? (
        <LayerImage src={selectedAssets.hair.src} alt="" filter={filterFor('hair')} {...imgProps} />
      ) : null}
    </>
  )

  if (isKitThumb && fitSize) {
    // contain : tête/cheveux entiers visibles (cover coupait le haut du crâne).
    const { scale, cx, cy } = spriteFitTransform(
      fitSize,
      canvasSize,
      spriteBoxForCrop(crop),
      'contain',
      0.94,
    )
    return (
      <div
        className={cn('relative overflow-hidden', className)}
        style={{ width: fitSize, height: fitSize }}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            width: canvasSize.width,
            height: canvasSize.height,
            transform: `translate(${fitSize / 2}px, ${fitSize / 2}px) scale(${scale}) translate(${-cx}px, ${-cy}px)`,
            transformOrigin: '0 0',
          }}
        >
          <div
            className="relative isolate"
            style={{ width: canvasSize.width, height: canvasSize.height }}
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

  if (fill && portraitFocus) {
    const box = SPRITE_CHAR_BOX
    const boxW = box.width * canvasSize.width
    const boxH = box.height * canvasSize.height
    const scale =
      Math.min(fillBox.w / boxW, fillBox.h / boxH) * PORTRAIT_FRAME_CONTAIN_PAD * PORTRAIT_FRAME_ZOOM
    const cx = (box.left + box.width / 2) * canvasSize.width
    const cy = (box.top + box.height / 2) * canvasSize.height
    return (
      <div ref={fillRef} className={cn('relative h-full w-full overflow-hidden', className)}>
        <div
          className="absolute left-0 top-0"
          style={{
            width: canvasSize.width,
            height: canvasSize.height,
            transform: `translate(${fillBox.w / 2}px, ${fillBox.h / 2}px) scale(${scale}) translate(${-cx}px, ${-cy}px)`,
            transformOrigin: '0 0',
          }}
        >
          {layerStack}
        </div>
      </div>
    )
  }

  if (fill && feetFocus) {
    const baseScale =
      Math.max(fillBox.w / canvasSize.width, fillBox.h / canvasSize.height) * 2.35
    const canvasScale = baseScale * Math.max(1, garmentsZoom)
    return (
      <div ref={fillRef} className={cn('relative h-full w-full overflow-hidden', className)}>
        <div
          className="absolute left-1/2"
          style={{
            top: '62%',
            width: canvasSize.width,
            height: canvasSize.height,
            transform: `translate3d(-50%, -54%, 0) scale(${canvasScale})`,
            transformOrigin: '50% 92%',
            WebkitTransform: `translate3d(-50%, -54%, 0) scale(${canvasScale})`,
          }}
        >
          <div
            className="relative overflow-hidden"
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
              clipPath: garmentFocusClip('shoes'),
              WebkitClipPath: garmentFocusClip('shoes'),
            }}
          >
            {layerStack}
          </div>
        </div>
      </div>
    )
  }

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
  crop = 'head',
  imagePriority = false,
  className,
}: {
  state?: ModularAvatarState
  size?: number
  /** `kit` / `bust` = tête + maillot + short ; `head` = visage. */
  crop?: ModularThumbCrop
  imagePriority?: boolean
  className?: string
}) {
  return (
    <ModularAvatarCanvas
      state={state}
      crop={crop}
      fitSize={size}
      imagePriority={imagePriority}
      className={className}
    />
  )
}

/** Portrait corps entier — page profil public, fiches joueur. */
export function ModularAvatarPortrait({
  state,
  width,
  height,
  imagePriority = false,
  className,
}: {
  state?: ModularAvatarState
  width?: number
  height?: number
  imagePriority?: boolean
  className?: string
}) {
  const fixedSize = width != null && height != null
  return (
    <div
      className={cn('relative overflow-hidden', fixedSize ? '' : 'h-full w-full', className)}
      style={fixedSize ? { width, height } : undefined}
    >
      <ModularAvatarCanvas
        state={state}
        crop="full"
        fill
        portraitFocus
        imagePriority={imagePriority}
        className="h-full w-full"
      />
    </div>
  )
}
