import { useEffect, useMemo, useState } from 'react'
import { Card } from '../ui/Card'
import { cn } from '../../utils/cn'
import { avatarAssetMap, createDefaultAvatarData, findAssetById, slotToCategory } from '../../features/avatar2d/catalog'
import type { AvatarAssetCategory, AvatarSlotKey, AvatarData } from '../../features/avatar2d/types'

const SLOT_ORDER: AvatarSlotKey[] = [
  'body',
  'hair',
  'eyes',
  'eyebrows',
  'nose',
  'mouth',
  'beard',
  'jersey',
  'shorts',
  'socks',
  'shoes',
  'accessory',
]

const SLOT_LABELS: Record<AvatarSlotKey, string> = {
  body: 'Corps',
  hair: 'Cheveux',
  eyes: 'Yeux',
  eyebrows: 'Sourcils',
  nose: 'Nez',
  mouth: 'Bouche',
  beard: 'Barbe',
  jersey: 'Maillot',
  shorts: 'Short',
  socks: 'Chaussettes',
  shoes: 'Chaussures',
  accessory: 'Accessoire',
}

const SKIN_PALETTE = ['#f7d8bf', '#e9c2a4', '#d7a783', '#bf8d67', '#9d6f4d', '#7f5639']

type ColorVariantKey = 'default' | 'black' | 'brown' | 'blond' | 'auburn' | 'red' | 'blue' | 'green' | 'white'
type ColorizableSlot = 'hair' | 'beard' | 'jersey' | 'shorts' | 'socks' | 'shoes' | 'accessory'

const COLOR_VARIANTS: Record<ColorVariantKey, { label: string; filter: string }> = {
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

const SLOT_COLOR_PRESETS: Record<ColorizableSlot, ColorVariantKey[]> = {
  hair: ['default', 'black', 'brown', 'blond', 'auburn', 'white'],
  beard: ['default', 'black', 'brown', 'blond', 'auburn', 'white'],
  jersey: ['default'],
  shorts: ['default'],
  socks: ['default', 'blue', 'red', 'green', 'white', 'black'],
  shoes: ['default'],
  accessory: ['default', 'blue', 'red', 'green', 'white', 'black'],
}

function LayerImage({
  src,
  alt,
  className,
  filter,
}: {
  src: string
  alt: string
  className?: string
  filter?: string
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn('pointer-events-none absolute left-0 top-0 h-auto w-auto max-w-none', className)}
      style={{ filter }}
      loading="lazy"
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

export function AvatarModularStudio() {
  const [avatar, setAvatar] = useState<AvatarData>(() => createDefaultAvatarData())
  const [activeSlot, setActiveSlot] = useState<AvatarSlotKey>('hair')
  const [slotColors, setSlotColors] = useState<Record<ColorizableSlot, ColorVariantKey>>({
    hair: 'default',
    beard: 'default',
    jersey: 'default',
    shorts: 'default',
    socks: 'default',
    shoes: 'default',
    accessory: 'default',
  })
  const [canvasSize, setCanvasSize] = useState({ width: 1024, height: 1024 })

  const activeCategory: AvatarAssetCategory = slotToCategory[activeSlot]
  const activeOptions = avatarAssetMap[activeCategory]

  const selectedAssets = useMemo(
    () => ({
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
    }),
    [avatar],
  )

  const applySlot = (slot: AvatarSlotKey, value: string | null) => {
    setAvatar((prev) => ({ ...prev, [slot]: value }))
  }

  useEffect(() => {
    const refSrc =
      selectedAssets.body?.src ??
      selectedAssets.jersey?.src ??
      selectedAssets.shorts?.src ??
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
  }, [selectedAssets.body?.src, selectedAssets.jersey?.src, selectedAssets.shorts?.src, selectedAssets.hair?.src])

  const randomizeAvatar = () => {
    const pick = (category: AvatarAssetCategory): string | null => {
      const options = avatarAssetMap[category]
      if (!options.length) return null
      return options[Math.floor(Math.random() * options.length)]?.id ?? null
    }

    setAvatar({
      skinTone: SKIN_PALETTE[Math.floor(Math.random() * SKIN_PALETTE.length)] ?? '#e2c2a6',
      body: pick('body'),
      hair: pick('hair'),
      eyes: pick('eyes'),
      eyebrows: pick('eyebrows'),
      nose: pick('nose'),
      mouth: pick('mouth'),
      beard: pick('beard'),
      jersey: pick('jerseys'),
      shorts: pick('shorts'),
      socks: pick('socks'),
      shoes: pick('shoes'),
      accessory: pick('accessories'),
    })
    const pickColor = (slot: ColorizableSlot): ColorVariantKey => {
      const presets = SLOT_COLOR_PRESETS[slot]
      return presets[Math.floor(Math.random() * presets.length)] ?? 'default'
    }
    setSlotColors({
      hair: pickColor('hair'),
      beard: pickColor('beard'),
      jersey: pickColor('jersey'),
      shorts: pickColor('shorts'),
      socks: pickColor('socks'),
      shoes: pickColor('shoes'),
      accessory: pickColor('accessory'),
    })
  }

  const slotValue = avatar[activeSlot]
  const previewMax = 404
  const canvasScale = Math.min(previewMax / canvasSize.width, previewMax / canvasSize.height)
  const stageWidth = Math.max(120, Math.round(canvasSize.width * canvasScale))
  const stageHeight = Math.max(120, Math.round(canvasSize.height * canvasScale))

  return (
    <Card id="avatar-modulaire" className="scroll-mt-4 p-0 overflow-hidden" elevation="soft">
      <div className="border-b border-white/10 bg-gradient-to-r from-slate-900/95 to-[#111d32] px-5 py-4">
        <p className="text-[11px] font-black tracking-[0.18em] text-sky-200/85">CREATEUR AVATAR 2D MODULAIRE</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-xl font-black text-white">Studio personnage temps reel</h3>
          <button
            type="button"
            onClick={randomizeAvatar}
            className="rounded-xl border border-sky-300/35 bg-sky-500/20 px-3 py-2 text-xs font-black text-sky-50 transition hover:border-sky-200/60 hover:bg-sky-500/30"
          >
            Melange aleatoire
          </button>
        </div>
        <p className="mt-1 text-sm font-semibold text-sky-100/75">Tu peux mixer chaque element pour obtenir un style unique.</p>
      </div>

      <div className="grid gap-0 lg:grid-cols-[420px_minmax(0,1fr)]">
        <section className="relative flex min-h-[540px] items-end justify-center border-b border-white/10 bg-[radial-gradient(circle_at_50%_20%,rgba(56,189,248,0.24),transparent_58%)] p-6 lg:border-b-0 lg:border-r">
          <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px]" />
          <div
            className="relative z-[1] overflow-hidden rounded-2xl border border-white/15 bg-black/20 shadow-[0_16px_50px_rgba(2,8,23,0.55)] backdrop-blur-sm"
            style={{ width: stageWidth, height: stageHeight }}
          >
            <div
              className="absolute left-0 top-0 origin-top-left"
              style={{
                width: canvasSize.width,
                height: canvasSize.height,
                transform: `scale(${canvasScale})`,
              }}
            >
              {selectedAssets.body?.src ? <LayerImage src={selectedAssets.body.src} alt="Corps avatar" /> : null}
              {selectedAssets.body?.src ? <SkinTintLayer maskSrc={selectedAssets.body.src} skinTone={avatar.skinTone} /> : null}
              {selectedAssets.shorts?.src ? (
                <LayerImage
                  src={selectedAssets.shorts.src}
                  alt="Short avatar"
                  filter={COLOR_VARIANTS[slotColors.shorts].filter}
                />
              ) : null}
              {selectedAssets.jersey?.src ? (
                <LayerImage
                  src={selectedAssets.jersey.src}
                  alt="Maillot avatar"
                  filter={COLOR_VARIANTS[slotColors.jersey].filter}
                />
              ) : null}
              {selectedAssets.socks?.src ? (
                <LayerImage
                  src={selectedAssets.socks.src}
                  alt="Chaussettes avatar"
                  filter={COLOR_VARIANTS[slotColors.socks].filter}
                />
              ) : null}
              {selectedAssets.shoes?.src ? (
                <LayerImage
                  src={selectedAssets.shoes.src}
                  alt="Chaussures avatar"
                  filter={COLOR_VARIANTS[slotColors.shoes].filter}
                />
              ) : null}
              {selectedAssets.eyes?.src ? <LayerImage src={selectedAssets.eyes.src} alt="Yeux avatar" /> : null}
              {selectedAssets.eyebrows?.src ? <LayerImage src={selectedAssets.eyebrows.src} alt="Sourcils avatar" /> : null}
              {selectedAssets.nose?.src ? <LayerImage src={selectedAssets.nose.src} alt="Nez avatar" /> : null}
              {selectedAssets.mouth?.src ? <LayerImage src={selectedAssets.mouth.src} alt="Bouche avatar" /> : null}
              {selectedAssets.beard?.src ? (
                <LayerImage
                  src={selectedAssets.beard.src}
                  alt="Barbe avatar"
                  filter={COLOR_VARIANTS[slotColors.beard].filter}
                />
              ) : null}
              {selectedAssets.hair?.src ? (
                <LayerImage
                  src={selectedAssets.hair.src}
                  alt="Cheveux avatar"
                  filter={COLOR_VARIANTS[slotColors.hair].filter}
                />
              ) : null}
              {selectedAssets.accessory?.src ? (
                <LayerImage
                  src={selectedAssets.accessory.src}
                  alt="Accessoire avatar"
                  filter={COLOR_VARIANTS[slotColors.accessory].filter}
                />
              ) : null}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-b from-[#0c1829] to-[#050b14] p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            {SLOT_ORDER.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setActiveSlot(slot)}
                className={cn(
                  'rounded-xl border px-3 py-2 text-xs font-black transition',
                  activeSlot === slot
                    ? 'border-emerald-400/70 bg-emerald-500/20 text-emerald-50'
                    : 'border-white/10 bg-white/5 text-white/80 hover:border-white/25 hover:bg-white/10',
                )}
              >
                {SLOT_LABELS[slot]}
              </button>
            ))}
          </div>

          {activeSlot === 'body' ? (
            <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-white/60">Couleur de peau</p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={avatar.skinTone}
                  onChange={(e) => setAvatar((prev) => ({ ...prev, skinTone: e.target.value }))}
                  className="h-10 w-14 cursor-pointer rounded border border-white/20 bg-transparent p-1"
                />
                <span className="text-xs font-semibold text-white/75">{avatar.skinTone}</span>
              </div>
            </div>
          ) : null}
          {(['hair', 'beard', 'jersey', 'shorts', 'socks', 'shoes', 'accessory'] as AvatarSlotKey[]).includes(activeSlot) ? (
            <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-white/60">Variante couleur</p>
              <div className="flex flex-wrap gap-1.5">
                {SLOT_COLOR_PRESETS[activeSlot as ColorizableSlot].map((variant) => {
                  const selected = slotColors[activeSlot as ColorizableSlot] === variant
                  return (
                    <button
                      key={`${activeSlot}-${variant}`}
                      type="button"
                      onClick={() =>
                        setSlotColors((prev) => ({ ...prev, [activeSlot as ColorizableSlot]: variant }))
                      }
                      className={cn(
                        'rounded-lg border px-2.5 py-1 text-[11px] font-bold transition',
                        selected
                          ? 'border-sky-300/65 bg-sky-500/20 text-sky-50'
                          : 'border-white/20 bg-white/5 text-white/75 hover:border-white/40 hover:bg-white/10',
                      )}
                    >
                      {COLOR_VARIANTS[variant].label}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wide text-white/65">
              Assets: {SLOT_LABELS[activeSlot]} ({activeOptions.length})
            </p>
            {slotValue ? (
              <button
                type="button"
                onClick={() => applySlot(activeSlot, null)}
                className="rounded-lg border border-white/20 px-2.5 py-1 text-[11px] font-bold text-white/75 hover:bg-white/10"
              >
                Aucun
              </button>
            ) : null}
          </div>

          {activeOptions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.04] p-4 text-sm font-semibold text-white/60">
              Aucun asset trouve dans `assets/{activeCategory}`.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {activeOptions.map((asset) => {
                const selected = slotValue === asset.id
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => applySlot(activeSlot, asset.id)}
                    className={cn(
                      'rounded-xl border p-2 text-left transition',
                      selected
                        ? 'border-emerald-400/75 bg-emerald-500/15'
                        : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10',
                    )}
                  >
                    <div className="mb-2 aspect-square rounded-lg bg-black/25 p-1">
                      <img src={asset.src} alt={asset.name} className="h-full w-full object-contain" loading="lazy" />
                    </div>
                    <span className="line-clamp-2 block text-[11px] font-bold text-white/85">{asset.name || asset.fileName}</span>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </Card>
  )
}

