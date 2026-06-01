import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '../ui/Card'
import { cn } from '../../utils/cn'
import { avatarAssetMap, findAssetById, slotToCategory } from '../../features/avatar2d/catalog'
import type { AvatarAsset, AvatarAssetCategory, AvatarSlotKey } from '../../features/avatar2d/types'
import {
  resolveModularAvatarState,
  type ModularColorizableSlot,
  type ModularColorVariantKey,
  type ModularSlotColors,
} from '../../features/avatar2d/modularAvatarState'
import { useProfile } from '../../hooks/useProfile'
import { useOptionalCloudUserState } from '../../contexts/CloudUserStateContext'
import { ModularAvatarCanvas, MODULAR_COLOR_VARIANTS } from './ModularAvatarCanvas'
import type { AvatarData } from '../../features/avatar2d/types'

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

type ColorVariantKey = ModularColorVariantKey
type ColorizableSlot = ModularColorizableSlot

const HAIR_DISPLAY_NAMES: Record<string, string> = {
  'hair-hair-afro': 'Afro',
  'hair-hair-braids': 'Tresses',
  'hair-hair-buzzcut': 'Buzz cut',
  'hair-hair-curly': 'Bouclés',
  'hair-hair-fade': 'Dégradé',
  'hair-hair-long': 'Mi-long',
  'hair-hair-long-straight': 'Long lisse',
  'hair-hair-long-wavy': 'Long ondulé',
  'hair-hair-middlepart': 'Raie au milieu',
  'hair-hair-ponytail': 'Chignon / queue',
  'hair-hair-spiky': 'Spiky',
}

const BEARD_DISPLAY_NAMES: Record<string, string> = {
  'beard-beard-3days': 'Barbe 3 jours',
  'beard-beard-full': 'Barbe complète',
  'beard-beard-goatee': 'Bouc',
  'beard-beard-mustache': 'Moustache',
  'beard-beard-short': 'Barbe courte',
}

const SHOES_DISPLAY_NAMES: Record<string, string> = {
  'shoes-shoes-base': 'Crampons blancs (base)',
  'shoes-shoes-bleu': 'Crampons bleu',
  'shoes-shoes-rouge': 'Crampons rouge',
  'shoes-shoes-jaune': 'Crampons jaune',
  'shoes-shoes-vert': 'Crampons vert',
}

const EYES_DISPLAY_NAMES: Record<string, string> = {
  'eyes-eyes-default-01': 'Yeux classiques',
  'eyes-eyes-round-02': 'Yeux ronds',
  'eyes-eyes-sharp-03': 'Yeux fins',
  'eyes-eyes-sleepy-04': 'Yeux fatigués',
}

const NOSE_DISPLAY_NAMES: Record<string, string> = {
  'nose-nose-big': 'Nez large',
  'nose-nose-round': 'Nez rond',
  'nose-nose-thin': 'Nez fin',
  'nose-nose-small-light': 'Nez petit',
}

/** Option vide en tête de grille (aucun calque PNG). */
const EMPTY_SLOT_OPTION: Partial<Record<AvatarSlotKey, { key: string; label: string }>> = {
  hair: { key: 'hair-bald', label: 'Chauve' },
  beard: { key: 'beard-none', label: 'Sans barbe' },
}

/** Grille toujours visible si peu d’options ; sinon panneau repliable. */
const INLINE_GRID_MAX = 6

function assetLabel(asset: AvatarAsset, slot: AvatarSlotKey): string {
  if (slot === 'hair') return HAIR_DISPLAY_NAMES[asset.id] ?? asset.name ?? asset.fileName
  if (slot === 'beard') return BEARD_DISPLAY_NAMES[asset.id] ?? asset.name ?? asset.fileName
  if (slot === 'shoes') return SHOES_DISPLAY_NAMES[asset.id] ?? asset.name ?? asset.fileName
  if (slot === 'eyes') return EYES_DISPLAY_NAMES[asset.id] ?? asset.name ?? asset.fileName
  if (slot === 'nose') return NOSE_DISPLAY_NAMES[asset.id] ?? asset.name ?? asset.fileName
  return asset.name || asset.fileName
}

function AssetTile({
  label,
  selected,
  imageSrc,
  onClick,
}: {
  label: string
  selected: boolean
  imageSrc?: string | null
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl border p-1.5 text-left transition',
        selected
          ? 'border-emerald-400/75 bg-emerald-500/15'
          : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10',
      )}
    >
      <div className="mb-1 flex aspect-square items-center justify-center rounded-lg bg-black/25 p-0.5">
        {imageSrc ? (
          <img src={imageSrc} alt="" className="h-full w-full object-contain" loading="lazy" />
        ) : (
          <span className="text-[9px] font-black uppercase tracking-wide text-white/40">—</span>
        )}
      </div>
      <span className="line-clamp-2 block text-[10px] font-bold leading-tight text-white/85">{label}</span>
    </button>
  )
}

function ModularAssetPicker({
  slot,
  options,
  value,
  selectedAsset,
  onPick,
}: {
  slot: AvatarSlotKey
  options: AvatarAsset[]
  value: string | null
  selectedAsset: AvatarAsset | null | undefined
  onPick: (id: string | null) => void
}) {
  const useCollapsible = options.length > INLINE_GRID_MAX
  const [open, setOpen] = useState(!useCollapsible)

  useEffect(() => {
    setOpen(options.length <= INLINE_GRID_MAX)
  }, [slot, options.length])

  const emptyOpt = EMPTY_SLOT_OPTION[slot]
  const currentLabel = value
    ? selectedAsset
      ? assetLabel(selectedAsset, slot)
      : value
    : (emptyOpt?.label ?? 'Aucun')

  const grid = (
    <div
      className={cn(
        'grid grid-cols-3 gap-2 max-sm:gap-1.5 sm:grid-cols-4',
        useCollapsible && 'max-h-[min(50dvh,220px)] overflow-y-auto overscroll-contain sm:max-h-52 [scrollbar-width:thin]',
      )}
    >
      {emptyOpt ? (
        <AssetTile
          label={emptyOpt.label}
          selected={!value}
          onClick={() => {
            onPick(null)
            if (useCollapsible) setOpen(false)
          }}
        />
      ) : null}
      {options.map((asset) => (
        <AssetTile
          key={asset.id}
          label={assetLabel(asset, slot)}
          selected={value === asset.id}
          imageSrc={asset.src}
          onClick={() => {
            onPick(asset.id)
            if (useCollapsible) setOpen(false)
          }}
        />
      ))}
    </div>
  )

  if (!useCollapsible) {
    return <div className="mt-2">{grid}</div>
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition',
          open
            ? 'border-emerald-400/50 bg-emerald-500/10'
            : 'border-white/15 bg-black/25 hover:border-white/30 hover:bg-black/35',
        )}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/40 p-0.5">
          {selectedAsset?.src ? (
            <img
              src={selectedAsset.src}
              alt=""
              className="max-h-full max-w-full object-contain"
              loading="lazy"
            />
          ) : (
            <span className="text-[9px] font-black uppercase text-white/35">—</span>
          )}
        </div>
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">{currentLabel}</span>
        <span
          className={cn(
            'shrink-0 text-lg font-black text-white/50 transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {open ? (
        <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-2">{grid}</div>
      ) : null}
    </div>
  )
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

export function AvatarModularStudio() {
  const { profile, updateModularAvatar } = useProfile()
  const cloud = useOptionalCloudUserState()
  const modular = resolveModularAvatarState(profile.modularAvatar)
  const avatar = modular.data
  const slotColors = modular.slotColors

  const [activeSlot, setActiveSlot] = useState<AvatarSlotKey>('hair')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [previewMax, setPreviewMax] = useState(280)
  const saveHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previewWrapRef = useRef<HTMLDivElement>(null)

  const activeCategory: AvatarAssetCategory = slotToCategory[activeSlot]
  const activeOptions = avatarAssetMap[activeCategory]

  const modularState = useMemo(() => ({ data: avatar, slotColors }), [avatar, slotColors])

  const markSaved = useCallback(() => {
    setSaveStatus('saved')
    if (saveHintTimerRef.current) clearTimeout(saveHintTimerRef.current)
    saveHintTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2200)
  }, [])

  const patchModular = useCallback(
    (updater: (prev: { data: AvatarData; slotColors: ModularSlotColors }) => {
      data: AvatarData
      slotColors: ModularSlotColors
    }) => {
      setSaveStatus('saving')
      updateModularAvatar((prev) => {
        const next = updater(prev)
        return { data: next.data, slotColors: next.slotColors }
      })
      markSaved()
    },
    [updateModularAvatar, markSaved],
  )

  const applySlot = (slot: AvatarSlotKey, value: string | null) => {
    patchModular((prev) => ({ ...prev, data: { ...prev.data, [slot]: value } }))
  }

  useEffect(() => {
    return () => {
      if (saveHintTimerRef.current) clearTimeout(saveHintTimerRef.current)
      void cloud?.flushAppSave?.()
    }
  }, [cloud])

  useEffect(() => {
    const el = previewWrapRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w < 1) return
      setPreviewMax(Math.max(200, Math.min(404, Math.floor(Math.min(w, h || w) - 8))))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const randomizeAvatar = () => {
    const pick = (category: AvatarAssetCategory): string | null => {
      const options = avatarAssetMap[category]
      if (!options.length) return null
      return options[Math.floor(Math.random() * options.length)]?.id ?? null
    }

    const pickColor = (slot: ColorizableSlot): ColorVariantKey => {
      const presets = SLOT_COLOR_PRESETS[slot]
      return presets[Math.floor(Math.random() * presets.length)] ?? 'default'
    }
    patchModular(() => ({
      data: {
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
      },
      slotColors: {
        hair: pickColor('hair'),
        beard: pickColor('beard'),
        jersey: pickColor('jersey'),
        shorts: pickColor('shorts'),
        socks: pickColor('socks'),
        shoes: pickColor('shoes'),
        accessory: pickColor('accessory'),
      },
    }))
  }

  const slotValue = avatar[activeSlot]
  const selectedAsset = findAssetById(avatarAssetMap, activeCategory, slotValue)

  return (
    <Card id="avatar-modulaire" className="scroll-mt-4 overflow-hidden p-0" elevation="soft">
      <div className="border-b border-white/10 bg-gradient-to-r from-slate-900/95 to-[#111d32] px-3 py-3 sm:px-5 sm:py-4">
        <p className="text-[10px] font-black tracking-[0.14em] text-sky-200/85 sm:tracking-[0.18em]">
          CREATEUR AVATAR 2D
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:mt-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <h3 className="font-display text-base font-black leading-tight text-white sm:text-xl">
            Studio personnage
          </h3>
          <button
            type="button"
            onClick={randomizeAvatar}
            className="w-full rounded-xl border border-sky-300/35 bg-sky-500/20 px-3 py-2.5 text-xs font-black text-sky-50 transition hover:border-sky-200/60 hover:bg-sky-500/30 sm:w-auto sm:py-2"
          >
            Mélange aléatoire
          </button>
        </div>
        <p className="mt-1.5 hidden text-sm font-semibold text-sky-100/75 sm:block">
          Tu peux mixer chaque élément pour obtenir un style unique.
        </p>
        <p
          className={cn(
            'mt-1.5 text-[10px] font-bold sm:mt-2 sm:text-[11px]',
            saveStatus === 'saved' ? 'text-emerald-300' : 'text-sky-200/55',
          )}
          role="status"
          aria-live="polite"
        >
          {saveStatus === 'saving'
            ? 'Enregistrement…'
            : saveStatus === 'saved'
              ? 'Avatar enregistré'
              : 'Sauvegarde auto'}
        </p>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(280px,420px)_minmax(0,1fr)] lg:gap-0">
        <section
          className={cn(
            'relative z-20 flex shrink-0 items-end justify-center border-b border-white/10',
            'bg-[radial-gradient(circle_at_50%_18%,rgba(56,189,248,0.28),transparent_55%)]',
            'sticky top-0 px-3 py-3',
            'min-h-[min(38dvh,240px)] max-h-[min(44dvh,280px)]',
            'sm:static sm:min-h-[320px] sm:max-h-none sm:px-4 sm:py-4',
            'lg:sticky lg:top-20 lg:z-[1] lg:max-h-[min(560px,calc(100dvh-6rem))] lg:min-h-[480px] lg:self-start lg:border-b-0 lg:border-r lg:px-6 lg:py-6',
          )}
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:20px_20px] sm:[background-size:24px_24px]" />
          <div
            ref={previewWrapRef}
            className="relative z-[1] mx-auto flex w-full max-w-[min(100%,280px)] items-end justify-center sm:max-w-[340px] lg:max-w-none"
          >
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/20 p-1.5 shadow-[0_12px_40px_rgba(2,8,23,0.55)] backdrop-blur-sm sm:p-2">
              <ModularAvatarCanvas state={modularState} crop="full" previewMax={previewMax} />
            </div>
          </div>
        </section>

        <section className="min-h-0 bg-gradient-to-b from-[#0c1829] to-[#050b14] p-3 sm:p-5 lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-y-auto lg:overscroll-contain">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/50 lg:hidden">
            Choisir une catégorie
          </p>
          <div className="-mx-3 mb-3 overflow-x-auto overscroll-x-contain px-3 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:mb-4 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max min-w-full gap-1.5 sm:w-auto sm:flex-wrap">
              {SLOT_ORDER.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setActiveSlot(slot)}
                  className={cn(
                    'shrink-0 snap-start rounded-xl border px-2.5 py-2 text-[11px] font-black transition sm:px-3 sm:text-xs',
                    activeSlot === slot
                      ? 'border-emerald-400/70 bg-emerald-500/25 text-emerald-50 shadow-[0_0_0_1px_rgba(52,211,153,0.35)]'
                      : 'border-white/15 bg-white/10 text-white/90 hover:border-white/30 hover:bg-white/15',
                  )}
                >
                  {SLOT_LABELS[slot]}
                </button>
              ))}
            </div>
          </div>

          {activeSlot === 'body' ? (
            <div className="mb-3 rounded-xl border border-white/12 bg-white/[0.07] p-3 sm:mb-4">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-white/60">Couleur de peau</p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={avatar.skinTone}
                  onChange={(e) =>
                    patchModular((prev) => ({
                      ...prev,
                      data: { ...prev.data, skinTone: e.target.value },
                    }))
                  }
                  className="h-10 w-14 cursor-pointer rounded border border-white/20 bg-transparent p-1"
                />
                <span className="text-xs font-semibold text-white/75">{avatar.skinTone}</span>
              </div>
            </div>
          ) : null}
          {(['hair', 'beard', 'jersey', 'shorts', 'socks', 'shoes', 'accessory'] as AvatarSlotKey[]).includes(activeSlot) ? (
            <div className="mb-3 rounded-xl border border-white/12 bg-white/[0.07] p-3 sm:mb-4">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-white/60">Variante couleur</p>
              <div className="flex flex-wrap gap-1.5">
                {SLOT_COLOR_PRESETS[activeSlot as ColorizableSlot].map((variant) => {
                  const selected = slotColors[activeSlot as ColorizableSlot] === variant
                  return (
                    <button
                      key={`${activeSlot}-${variant}`}
                      type="button"
                      onClick={() =>
                        patchModular((prev) => ({
                          ...prev,
                          slotColors: { ...prev.slotColors, [activeSlot as ColorizableSlot]: variant },
                        }))
                      }
                      className={cn(
                        'rounded-lg border px-2.5 py-1 text-[11px] font-bold transition',
                        selected
                          ? 'border-sky-300/65 bg-sky-500/20 text-sky-50'
                          : 'border-white/20 bg-white/5 text-white/75 hover:border-white/40 hover:bg-white/10',
                      )}
                    >
                      {MODULAR_COLOR_VARIANTS[variant].label}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {activeSlot !== 'body' ? (
            <div className="rounded-xl border border-white/12 bg-white/[0.07] p-3">
              <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-white/70">
                {SLOT_LABELS[activeSlot]} ({activeOptions.length})
              </p>
              {activeOptions.length > INLINE_GRID_MAX ? (
                <p className="mb-2 text-[10px] font-medium text-white/45">
                  Ouvre le menu pour parcourir les visuels sans allonger la page.
                </p>
              ) : null}

              {activeOptions.length === 0 ? (
                <p className="text-sm font-semibold text-white/60">
                  Aucun asset dans `assets/{activeCategory}`.
                </p>
              ) : (
                <ModularAssetPicker
                  slot={activeSlot}
                  options={activeOptions}
                  value={slotValue}
                  selectedAsset={selectedAsset}
                  onPick={(id) => applySlot(activeSlot, id)}
                />
              )}
            </div>
          ) : null}
        </section>
      </div>
    </Card>
  )
}

