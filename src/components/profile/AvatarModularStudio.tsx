import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
import {
  boutiqueHrefForModularAsset,
  boutiqueTabForModularCategory,
  isModularAssetUnlocked,
  isModularGarmentSlot,
} from '../../utils/modularGarmentAccess'
import { sortModularGarmentAssetsForStudio } from '../../utils/modularGarmentDisplayName'
import {
  consumeRecentStudioAsset,
  consumeRecentStudioPack,
  peekRecentStudioAsset,
  studioSlotForModularAssetId,
} from '../../utils/boutiquePurchaseFlow'
import { findBoutiqueCatalogItem } from '../../utils/boutiqueCatalog'

const SLOT_ORDER: AvatarSlotKey[] = [
  'body',
  'hair',
  'eyes',
  'nose',
  'mouth',
  'beard',
  'jersey',
  'shorts',
  'shoes',
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
  shoes: 'Chaussures',
  accessory: 'Accessoire',
  socks: 'Chaussettes',
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

const MOUTH_DISPLAY_NAMES: Record<string, string> = {
  'mouth-bouche-homme': 'Bouche discrète',
  'mouth-lips-none': 'Lèvres naturelles',
  'mouth-lips-lipstick-red': 'Lèvres rouges',
  'mouth-lips-lipstick-pink': 'Lèvres roses',
}

/** Option vide en tête de grille (aucun calque PNG). */
const EMPTY_SLOT_OPTION: Partial<Record<AvatarSlotKey, { key: string; label: string }>> = {
  hair: { key: 'hair-bald', label: 'Chauve' },
  beard: { key: 'beard-none', label: 'Sans barbe' },
}

/** Grille toujours visible si peu d’options ; sinon panneau repliable. */
const INLINE_GRID_MAX = 6

function assetLabel(asset: AvatarAsset, slot: AvatarSlotKey): string {
  if (slot === 'jersey' || slot === 'shorts') return asset.name || asset.fileName
  if (slot === 'hair') return HAIR_DISPLAY_NAMES[asset.id] ?? asset.name ?? asset.fileName
  if (slot === 'beard') return BEARD_DISPLAY_NAMES[asset.id] ?? asset.name ?? asset.fileName
  if (slot === 'shoes') return SHOES_DISPLAY_NAMES[asset.id] ?? asset.name ?? asset.fileName
  if (slot === 'eyes') return EYES_DISPLAY_NAMES[asset.id] ?? asset.name ?? asset.fileName
  if (slot === 'nose') return NOSE_DISPLAY_NAMES[asset.id] ?? asset.name ?? asset.fileName
  if (slot === 'mouth') return MOUTH_DISPLAY_NAMES[asset.id] ?? asset.name ?? asset.fileName
  return asset.name || asset.fileName
}

function AssetTile({
  label,
  selected,
  locked,
  imageSrc,
  onClick,
}: {
  label: string
  selected: boolean
  locked?: boolean
  imageSrc?: string | null
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative rounded-xl border p-1.5 text-left transition',
        locked
          ? 'border-amber-400/40 bg-amber-500/10 hover:border-amber-300/55'
          : selected
            ? 'border-emerald-400/75 bg-emerald-500/15'
            : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10',
      )}
    >
      {locked ? (
        <span
          className="absolute right-1 top-1 z-[1] rounded-md bg-amber-500/90 px-1 py-0.5 text-[8px] font-black uppercase text-amber-950"
          aria-hidden
        >
          Boutique
        </span>
      ) : null}
      <div
        className={cn(
          'mb-1 flex aspect-square items-center justify-center rounded-lg bg-black/25 p-0.5',
          locked && 'opacity-55 grayscale-[0.35]',
        )}
      >
        {imageSrc ? (
          <img src={imageSrc} alt="" className="h-full w-full object-contain" loading="lazy" />
        ) : (
          <span className="text-[9px] font-black uppercase tracking-wide text-white/40">—</span>
        )}
      </div>
      <span className="line-clamp-2 block text-[10px] font-bold leading-tight text-white/85">{label}</span>
      {locked ? (
        <span className="mt-0.5 block text-[9px] font-bold text-amber-200/90">Voir la boutique →</span>
      ) : null}
    </button>
  )
}

function ModularAssetPicker({
  slot,
  garmentCategory,
  options,
  value,
  selectedAsset,
  ownedItemIds,
  onPick,
  onLockedPick,
}: {
  slot: AvatarSlotKey
  garmentCategory?: 'jerseys' | 'shorts' | 'shoes'
  options: AvatarAsset[]
  value: string | null
  selectedAsset: AvatarAsset | null | undefined
  ownedItemIds: string[]
  onPick: (id: string | null) => void
  onLockedPick: (modularAssetId: string) => void
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
      {options.map((asset) => {
        const locked = garmentCategory
          ? !isModularAssetUnlocked(asset.id, garmentCategory, ownedItemIds)
          : false
        return (
          <AssetTile
            key={asset.id}
            label={assetLabel(asset, slot)}
            selected={value === asset.id}
            locked={locked}
            imageSrc={asset.src}
            onClick={() => {
              if (locked) {
                onLockedPick(asset.id)
                return
              }
              onPick(asset.id)
              if (useCollapsible) setOpen(false)
            }}
          />
        )
      })}
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
  shoes: ['default'],
}

export function AvatarModularStudio() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile, updateModularAvatar } = useProfile()
  const purchaseFocusApplied = useRef(false)
  const cloud = useOptionalCloudUserState()
  const ownedItemIds = useMemo(
    () => (Array.isArray(profile.ownedItemIds) ? profile.ownedItemIds : []),
    [profile.ownedItemIds],
  )
  const modular = resolveModularAvatarState(profile.modularAvatar)
  const avatar = modular.data
  const slotColors = modular.slotColors

  const [activeSlot, setActiveSlot] = useState<AvatarSlotKey>('hair')
  const [purchaseBanner, setPurchaseBanner] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [previewMax, setPreviewMax] = useState(280)
  const saveHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previewWrapRef = useRef<HTMLDivElement>(null)

  const activeCategory: AvatarAssetCategory = slotToCategory[activeSlot]
  const activeOptions = avatarAssetMap[activeCategory]
  const activeGarmentCategory = isModularGarmentSlot(activeCategory) ? activeCategory : undefined

  const priorityStudioAsset =
    searchParams.get('asset') ?? peekRecentStudioAsset()

  const sortedActiveOptions = useMemo(() => {
    if (!activeGarmentCategory) return activeOptions
    return sortModularGarmentAssetsForStudio(
      activeOptions,
      activeGarmentCategory,
      ownedItemIds,
      priorityStudioAsset,
    )
  }, [activeOptions, activeGarmentCategory, ownedItemIds, priorityStudioAsset])

  const modularState = useMemo(() => ({ data: avatar, slotColors }), [avatar, slotColors])

  const markSaved = useCallback(() => {
    setSaveError(null)
    setSaveStatus('saved')
    if (saveHintTimerRef.current) clearTimeout(saveHintTimerRef.current)
    saveHintTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2200)
  }, [])

  const persistAvatar = useCallback(() => {
    if (!cloud?.flushAppSave) {
      setSaveStatus('error')
      setSaveError('Connexion cloud indisponible — recharge la page.')
      return
    }
    setSaveStatus('saving')
    void cloud.flushAppSave().then((result) => {
      if (result.ok) {
        markSaved()
        return
      }
      setSaveStatus('error')
      setSaveError(
        result.error?.includes('forbidden')
          ? 'Session expirée — recharge la page puis réessaie.'
          : 'Sauvegarde impossible. Vérifie ta connexion et réessaie.',
      )
    })
  }, [cloud, markSaved])

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
      window.setTimeout(() => persistAvatar(), 0)
    },
    [updateModularAvatar, persistAvatar],
  )

  const goToBoutiqueForAsset = useCallback(
    (category: 'jerseys' | 'shorts' | 'shoes', modularAssetId: string) => {
      navigate(boutiqueHrefForModularAsset(modularAssetId, category))
    },
    [navigate],
  )

  const applySlot = (slot: AvatarSlotKey, value: string | null) => {
    const cat = slotToCategory[slot]
    if (value && isModularGarmentSlot(cat) && !isModularAssetUnlocked(value, cat, ownedItemIds)) {
      goToBoutiqueForAsset(cat, value)
      return
    }
    patchModular((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        [slot]: value,
        // Les packs yeux incluent déjà les sourcils — pas de calque séparé.
        ...(slot === 'eyes' ? { eyebrows: null } : {}),
      },
    }))
  }

  useEffect(() => {
    const purchasedId = searchParams.get('purchased')
    if (!purchasedId) return
    const bought = findBoutiqueCatalogItem(purchasedId)
    if (bought) setPurchaseBanner(`${bought.name} acheté — retrouve-le ci-dessous, il est déjà équipé.`)
    const next = new URLSearchParams(searchParams)
    next.delete('purchased')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (purchaseFocusApplied.current) return
    const packEquip = consumeRecentStudioPack()
    if (packEquip) {
      purchaseFocusApplied.current = true
      setActiveSlot('jersey')
      updateModularAvatar((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          ...(packEquip.jersey ? { jersey: packEquip.jersey } : {}),
          ...(packEquip.shorts ? { shorts: packEquip.shorts } : {}),
        },
      }))
      return
    }

    const fromUrl = searchParams.get('asset')
    const assetId = fromUrl ?? consumeRecentStudioAsset()
    if (!assetId) return

    const slotParam = searchParams.get('slot')
    const slot: AvatarSlotKey | null =
      slotParam === 'jersey' || slotParam === 'shorts' || slotParam === 'shoes'
        ? slotParam
        : studioSlotForModularAssetId(assetId)
    if (!slot) return

    const cat = slotToCategory[slot]
    if (!isModularGarmentSlot(cat) || !isModularAssetUnlocked(assetId, cat, ownedItemIds)) return

    purchaseFocusApplied.current = true
    setActiveSlot(slot)
    updateModularAvatar((prev) => ({
      ...prev,
      data: { ...prev.data, [slot]: assetId },
    }))

    if (fromUrl) {
      const next = new URLSearchParams(searchParams)
      next.delete('asset')
      next.delete('slot')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, ownedItemIds, updateModularAvatar, setSearchParams])

  const cloudFlushRef = useRef(cloud?.flushAppSave)
  cloudFlushRef.current = cloud?.flushAppSave

  useEffect(() => {
    return () => {
      if (saveHintTimerRef.current) clearTimeout(saveHintTimerRef.current)
      void cloudFlushRef.current?.()
    }
  }, [])

  useEffect(() => {
    const onPageHide = () => {
      void cloudFlushRef.current?.()
    }
    window.addEventListener('pagehide', onPageHide)
    return () => window.removeEventListener('pagehide', onPageHide)
  }, [])

  useEffect(() => {
    const el = previewWrapRef.current
    if (!el) return
    let locked: number | null = null
    const update = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w < 1) return
      const next = Math.max(200, Math.min(404, Math.floor(Math.min(w, h || w) - 8)))
      if (locked == null && w >= 120) locked = next
      setPreviewMax(locked ?? next)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const randomizeAvatar = () => {
    const pick = (category: AvatarAssetCategory): string | null => {
      const options = avatarAssetMap[category].filter((asset) =>
        isModularGarmentSlot(category)
          ? isModularAssetUnlocked(asset.id, category, ownedItemIds)
          : true,
      )
      if (!options.length) return null
      return options[Math.floor(Math.random() * options.length)]?.id ?? null
    }

    const pickColor = (slot: ColorizableSlot): ColorVariantKey => {
      const presets = SLOT_COLOR_PRESETS[slot]
      return presets[Math.floor(Math.random() * presets.length)] ?? 'default'
    }
    const mouthId = pick('mouth')
    patchModular(() => ({
      data: {
        skinTone: SKIN_PALETTE[Math.floor(Math.random() * SKIN_PALETTE.length)] ?? '#e2c2a6',
        body: pick('body'),
        hair: pick('hair'),
        eyes: pick('eyes'),
        eyebrows: null,
        nose: pick('nose'),
        mouth: mouthId,
        beard: mouthId?.startsWith('mouth-lips') ? null : pick('beard'),
        jersey: pick('jerseys'),
        shorts: pick('shorts'),
        socks: null,
        shoes: pick('shoes'),
        accessory: null,
      },
      slotColors: {
        hair: pickColor('hair'),
        beard: pickColor('beard'),
        jersey: pickColor('jersey'),
        shorts: pickColor('shorts'),
        shoes: pickColor('shoes'),
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
            saveStatus === 'saved'
              ? 'text-emerald-300'
              : saveStatus === 'error'
                ? 'text-rose-300'
                : 'text-sky-200/55',
          )}
          role="status"
          aria-live="polite"
        >
          {saveStatus === 'saving'
            ? 'Enregistrement…'
            : saveStatus === 'saved'
              ? 'Avatar enregistré'
              : saveStatus === 'error'
                ? saveError ?? 'Sauvegarde impossible'
                : 'Sauvegarde auto'}
        </p>
        {purchaseBanner ? (
          <p className="mt-2 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-[11px] font-bold text-emerald-100">
            {purchaseBanner}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(280px,420px)_minmax(0,1fr)] lg:gap-0">
        <section
          className={cn(
            'relative z-0 flex shrink-0 items-end justify-center border-b border-white/10',
            'bg-[radial-gradient(circle_at_50%_18%,rgba(56,189,248,0.28),transparent_55%)]',
            'px-3 py-3',
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
          <div className="-mx-3 mb-3 touch-pan-x overflow-x-auto overscroll-x-contain px-3 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:mb-4 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
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
          {(['hair', 'beard', 'jersey', 'shorts', 'shoes'] as ColorizableSlot[]).includes(
            activeSlot as ColorizableSlot,
          ) ? (
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

          {activeGarmentCategory ? (
            <div className="mb-3 rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2.5 sm:mb-4">
              <p className="text-[11px] font-bold leading-snug text-amber-50/95">
                Cheveux, visage et couleurs : <span className="text-emerald-200">gratuits</span>. Maillots, shorts et
                chaussures : uniquement les modèles de base sont gratuits (maillot/short blanc, bleu, jaune, rouge ·
                crampons blancs).
              </p>
              <Link
                to={`/boutique?tab=${boutiqueTabForModularCategory(activeGarmentCategory)}`}
                className="mt-1.5 inline-block text-[11px] font-black text-amber-200 underline-offset-2 hover:text-amber-100 hover:underline"
              >
                Ouvrir la boutique →
              </Link>
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
                  garmentCategory={activeGarmentCategory}
                  options={sortedActiveOptions}
                  value={slotValue}
                  selectedAsset={selectedAsset}
                  ownedItemIds={ownedItemIds}
                  onPick={(id) => applySlot(activeSlot, id)}
                  onLockedPick={(modularAssetId) => {
                    if (activeGarmentCategory) {
                      goToBoutiqueForAsset(activeGarmentCategory, modularAssetId)
                    }
                  }}
                />
              )}
            </div>
          ) : null}
        </section>
      </div>
    </Card>
  )
}

