import { useMemo, useState } from 'react'
import { Card } from '../ui/Card'
import { cn } from '../../utils/cn'
import { avatarAssetMap, createDefaultAvatarData, findAssetById, slotToCategory } from '../../features/avatar2d/catalog'
import type { AvatarAssetCategory, AvatarSlotKey, AvatarData } from '../../features/avatar2d/types'

const SLOT_ORDER: AvatarSlotKey[] = ['body', 'hair', 'eyes', 'nose', 'mouth', 'beard', 'jersey', 'shorts', 'shoes']

const SLOT_LABELS: Record<AvatarSlotKey, string> = {
  body: 'Corps',
  hair: 'Cheveux',
  eyes: 'Yeux',
  nose: 'Nez',
  mouth: 'Bouche',
  beard: 'Barbe',
  jersey: 'Maillot',
  shorts: 'Short',
  shoes: 'Chaussures',
}

const SKIN_PALETTE = ['#f7d8bf', '#e9c2a4', '#d7a783', '#bf8d67', '#9d6f4d', '#7f5639']

function LayerImage({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn('pointer-events-none absolute inset-0 h-full w-full object-contain', className)}
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
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
      }}
    />
  )
}

export function AvatarModularStudio() {
  const [avatar, setAvatar] = useState<AvatarData>(() => createDefaultAvatarData())
  const [activeSlot, setActiveSlot] = useState<AvatarSlotKey>('hair')

  const activeCategory: AvatarAssetCategory = slotToCategory[activeSlot]
  const activeOptions = avatarAssetMap[activeCategory]

  const selectedAssets = useMemo(
    () => ({
      body: findAssetById(avatarAssetMap, 'body', avatar.body),
      hair: findAssetById(avatarAssetMap, 'hair', avatar.hair),
      eyes: findAssetById(avatarAssetMap, 'eyes', avatar.eyes),
      nose: findAssetById(avatarAssetMap, 'nose', avatar.nose),
      mouth: findAssetById(avatarAssetMap, 'mouth', avatar.mouth),
      beard: findAssetById(avatarAssetMap, 'beard', avatar.beard),
      jersey: findAssetById(avatarAssetMap, 'jerseys', avatar.jersey),
      shorts: findAssetById(avatarAssetMap, 'shorts', avatar.shorts),
      shoes: findAssetById(avatarAssetMap, 'shoes', avatar.shoes),
    }),
    [avatar],
  )

  const applySlot = (slot: AvatarSlotKey, value: string | null) => {
    setAvatar((prev) => ({ ...prev, [slot]: value }))
  }

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
      nose: pick('nose'),
      mouth: pick('mouth'),
      beard: pick('beard'),
      jersey: pick('jerseys'),
      shorts: pick('shorts'),
      shoes: pick('shoes'),
    })
  }

  const slotValue = avatar[activeSlot]

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
          <div className="relative z-[1] aspect-square w-full max-w-[360px] rounded-2xl border border-white/15 bg-black/20 shadow-[0_16px_50px_rgba(2,8,23,0.55)] backdrop-blur-sm">
            {selectedAssets.body?.src ? <LayerImage src={selectedAssets.body.src} alt="Corps avatar" /> : null}
            {selectedAssets.body?.src ? <SkinTintLayer maskSrc={selectedAssets.body.src} skinTone={avatar.skinTone} /> : null}
            {selectedAssets.jersey?.src ? <LayerImage src={selectedAssets.jersey.src} alt="Maillot avatar" /> : null}
            {selectedAssets.shorts?.src ? <LayerImage src={selectedAssets.shorts.src} alt="Short avatar" /> : null}
            {selectedAssets.shoes?.src ? <LayerImage src={selectedAssets.shoes.src} alt="Chaussures avatar" /> : null}
            {selectedAssets.eyes?.src ? <LayerImage src={selectedAssets.eyes.src} alt="Yeux avatar" /> : null}
            {selectedAssets.nose?.src ? <LayerImage src={selectedAssets.nose.src} alt="Nez avatar" /> : null}
            {selectedAssets.mouth?.src ? <LayerImage src={selectedAssets.mouth.src} alt="Bouche avatar" /> : null}
            {selectedAssets.beard?.src ? <LayerImage src={selectedAssets.beard.src} alt="Barbe avatar" /> : null}
            {selectedAssets.hair?.src ? <LayerImage src={selectedAssets.hair.src} alt="Cheveux avatar" /> : null}
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

