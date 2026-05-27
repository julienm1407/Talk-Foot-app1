import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { useProfile } from '../../hooks/useProfile'
import { useWallet } from '../../hooks/useWallet'
import { useAppearance } from '../../contexts/AppearanceContext'
import { mergeCharacterLook } from '../../data/characterPresets'
import { PRESET_EYES, PRESET_HAIR, PRESET_SKIN } from '../../data/characterPresets'
import { avatarItems, cosmeticTokenPrice } from '../../data/shop'
import { resolveAvatarLoadout } from '../../data/avatar2dCatalog'
import type { AvatarItem, AvatarSlot } from '../../types/profile'
import { Avatar2DComposer } from './Avatar2DComposer'
import { JerseyPurchaseModal } from '../shop/JerseyPurchaseModal'
import { TokenGlyph } from '../ui/TokenGlyph'
import {
  BEARD_STYLE_OPTIONS,
  CUSTOMIZER_CATEGORIES,
  EYE_SHAPE_OPTIONS,
  FACE_EXPR_OPTIONS,
  GLASSES_OPTIONS,
  HAIR_STYLE_OPTIONS,
  HEADWEAR_OPTIONS,
  type CustomizerCategoryId,
} from '../../data/characterCustomizerCatalog'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

function ColorSwatchRow({
  colors,
  value,
  onPick,
}: {
  colors: string[]
  value: string
  onPick: (hex: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((hex) => (
        <button
          key={hex}
          type="button"
          title={hex}
          onClick={() => onPick(hex)}
          className={cn(
            'size-9 rounded-full border-2 shadow-sm transition hover:scale-105',
            value === hex ? 'border-emerald-400 ring-2 ring-emerald-400/40' : 'border-white/20',
          )}
          style={{ backgroundColor: hex }}
        />
      ))}
      <label className="flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-white/25 px-2 py-1 text-[10px] font-bold text-white/70 hover:border-white/40">
        <span>Autre</span>
        <input
          type="color"
          value={value.startsWith('#') && value.length === 7 ? value : '#888888'}
          onChange={(e) => onPick(e.target.value)}
          className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
        />
      </label>
    </div>
  )
}

function SelectTile({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border-2 px-3 py-2.5 text-left text-xs font-bold transition duration-200',
        'hover:-translate-y-0.5 hover:shadow-lg',
        selected
          ? 'border-emerald-400/90 bg-emerald-500/20 text-white shadow-[0_0_0_1px_rgba(52,211,153,0.35)]'
          : 'border-white/10 bg-white/[0.06] text-slate-100 hover:border-white/25 hover:bg-white/10',
      )}
    >
      {children}
    </button>
  )
}

function equipSlotForItem(item: AvatarItem): AvatarSlot {
  if (item.slot === 'jersey') return 'jersey'
  if (item.slot === 'pants') return 'pants'
  if (item.slot === 'shoes') return 'shoes'
  return 'accessory'
}

function StudioLockedItem({
  item,
  walletMedals,
  walletTokens,
  onOpenJersey,
  onBuyDirect,
}: {
  item: AvatarItem
  walletMedals: number
  walletTokens: number
  /** Maillots : ouvre le flux flocage + paiement */
  onOpenJersey?: () => void
  onBuyDirect: (currency: 'medals' | 'tokens') => void
}) {
  const tk = cosmeticTokenPrice(item.cost)
  const isJersey = item.slot === 'jersey'
  return (
    <div className="flex min-h-[92px] flex-col rounded-2xl border-2 border-amber-400/35 bg-amber-500/10 p-3 text-left text-xs font-bold text-amber-50">
      <span className="text-2xl">{item.emoji}</span>
      <span className="mt-1 line-clamp-2 leading-snug">{item.name}</span>
      <p className="mt-2 text-[10px] font-semibold leading-tight text-amber-200/85">
        Solde : {walletMedals} 🏅 · {walletTokens}{' '}
        <TokenGlyph className="inline size-[0.9em] align-[-0.1em] opacity-90" />
      </p>
      {isJersey ? (
        <Button
          type="button"
          variant="primary"
          className="mt-2 h-9 w-full rounded-xl text-[11px] font-black"
          onClick={() => onOpenJersey?.()}
        >
          Acheter & personnaliser
        </Button>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant="soft"
            className="h-9 min-w-0 flex-1 rounded-xl px-2 text-[10px] font-black"
            onClick={() => onBuyDirect('medals')}
          >
            {item.cost} 🏅
          </Button>
          <Button
            type="button"
            variant="success"
            className="h-9 min-w-0 flex-1 rounded-xl px-2 text-[10px] font-semibold"
            onClick={() => onBuyDirect('tokens')}
          >
            <span className="inline-flex items-center justify-center gap-1">
              {tk}
              <TokenGlyph variant="onDark" className="size-3.5 shrink-0" />
            </span>
          </Button>
        </div>
      )}
      <Link
        to="/boutique"
        className="mt-2 text-center text-[10px] font-bold text-amber-200/75 underline-offset-2 hover:text-amber-50 hover:underline"
      >
        Catalogue boutique
      </Link>
    </div>
  )
}

export function CharacterLayerStudio() {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const { wallet, spendMedals, spendTokens } = useWallet()
  const { profile, updateCharacterLook, equipItem, ownsItem, addOwnedItem, setJerseyCustomization } = useProfile()
  const [cat, setCat] = useState<CustomizerCategoryId>('hair')
  const [jerseyBuy, setJerseyBuy] = useState<AvatarItem | null>(null)
  const [shopNotice, setShopNotice] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)

  const pushNotice = (tone: 'ok' | 'err', text: string) => setShopNotice({ tone, text })

  useEffect(() => {
    if (!shopNotice) return
    const id = window.setTimeout(() => setShopNotice(null), 3200)
    return () => window.clearTimeout(id)
  }, [shopNotice])

  const buyDirectCosmetic = (item: AvatarItem) => {
    return (currency: 'medals' | 'tokens') => {
      const medalPrice = item.cost
      if (currency === 'medals') {
        if (!spendMedals(medalPrice).ok) {
          pushNotice('err', 'Pas assez de médailles — ouvre la boutique pour un pack, ou paie en jetons.')
          return
        }
      } else {
        const tokenCost = cosmeticTokenPrice(medalPrice)
        if (!spendTokens(tokenCost).ok) {
          pushNotice('err', 'Pas assez de jetons — gagne des paris ou le bonus quotidien.')
          return
        }
      }
      addOwnedItem(item.id)
      equipItem(item.id, equipSlotForItem(item))
      pushNotice('ok', `${item.name} acheté et équipé.`)
    }
  }

  const look = useMemo(() => mergeCharacterLook(profile.characterLook), [profile.characterLook])
  const loadout = useMemo(() => resolveAvatarLoadout(profile), [profile])

  const tops = useMemo(() => avatarItems.filter((i) => i.slot === 'jersey'), [])
  const bottoms = useMemo(() => avatarItems.filter((i) => i.slot === 'pants'), [])
  const shoes = useMemo(() => avatarItems.filter((i) => i.slot === 'shoes'), [])
  const shopAccessories = useMemo(() => avatarItems.filter((i) => i.slot === 'accessory'), [])

  const equippedPants = profile.equippedItems?.pants ?? 'pants-kit'
  const equippedShoes = profile.equippedItems?.shoes ?? 'shoes-studs'
  const equippedKit = loadout.kit
  const equippedAccessory = loadout.accessory

  const panel = (() => {
    switch (cat) {
      case 'hair':
        return (
          <div className="space-y-4">
            <p className="text-[11px] font-semibold text-white/65">Coupe — calque au-dessus du visage</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {HAIR_STYLE_OPTIONS.map(({ id, label }) => (
                <SelectTile
                  key={id}
                  selected={look.hairStyle === id}
                  onClick={() => updateCharacterLook({ hairStyle: id })}
                >
                  <span className="block text-lg leading-none">💇</span>
                  <span className="mt-1 block">{label}</span>
                </SelectTile>
              ))}
            </div>
            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-white/50">Couleur cheveux</p>
              <ColorSwatchRow colors={[...PRESET_HAIR]} value={look.hairColor} onPick={(h) => updateCharacterLook({ hairColor: h })} />
            </div>
          </div>
        )
      case 'beard':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BEARD_STYLE_OPTIONS.map(({ id, label }) => (
                <SelectTile
                  key={id}
                  selected={look.beard === id}
                  onClick={() => updateCharacterLook({ beard: id })}
                >
                  <span className="block text-lg leading-none">{id === 'none' ? '🙂' : '🧔'}</span>
                  <span className="mt-1 block">{label}</span>
                </SelectTile>
              ))}
            </div>
            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-white/50">Couleur barbe</p>
              <ColorSwatchRow
                colors={[...PRESET_HAIR]}
                value={look.beardColor ?? look.hairColor}
                onPick={(h) => updateCharacterLook({ beardColor: h })}
              />
              <p className="mt-2 text-[10px] font-medium text-white/45">Par défaut, suit la couleur des cheveux.</p>
            </div>
          </div>
        )
      case 'face':
        return (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-white/50">Peau</p>
              <ColorSwatchRow colors={[...PRESET_SKIN]} value={look.skinTone} onPick={(h) => updateCharacterLook({ skinTone: h })} />
            </div>
            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-white/50">Yeux — iris</p>
              <ColorSwatchRow colors={[...PRESET_EYES]} value={look.eyeColor} onPick={(h) => updateCharacterLook({ eyeColor: h })} />
            </div>
            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-white/50">Forme des yeux</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {EYE_SHAPE_OPTIONS.map(({ id, label }) => (
                  <SelectTile
                    key={id}
                    selected={look.eyeShape === id}
                    onClick={() => updateCharacterLook({ eyeShape: id })}
                  >
                    {label}
                  </SelectTile>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-white/50">Expression</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {FACE_EXPR_OPTIONS.map(({ id, label }) => (
                  <SelectTile
                    key={id}
                    selected={(look.faceExpression ?? 'happy') === id}
                    onClick={() => updateCharacterLook({ faceExpression: id })}
                  >
                    {label}
                  </SelectTile>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-white/50">Lunettes</p>
              <div className="grid grid-cols-3 gap-2">
                {GLASSES_OPTIONS.map(({ id, label }) => (
                  <SelectTile
                    key={id}
                    selected={look.glasses === id}
                    onClick={() => updateCharacterLook({ glasses: id })}
                  >
                    {label}
                  </SelectTile>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-white/50">Coiffe</p>
              <div className="grid grid-cols-3 gap-2">
                {HEADWEAR_OPTIONS.map(({ id, label }) => (
                  <SelectTile
                    key={id}
                    selected={look.headwear === id}
                    onClick={() => updateCharacterLook({ headwear: id })}
                  >
                    {label}
                  </SelectTile>
                ))}
              </div>
            </div>
          </div>
        )
      case 'tops':
        return (
          <div className="space-y-3">
            <p className="text-[11px] font-medium text-white/60">
              Maillots payants : achat direct (flocage) si tu as les médailles ou les jetons. Gratuits : base toujours dispo.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {tops.map((item) => {
                const locked = !ownsItem(item.id)
                const selected = equippedKit === item.id
                return (
                  <div key={item.id}>
                    {locked ? (
                      <StudioLockedItem
                        item={item}
                        walletMedals={wallet.medals}
                        walletTokens={wallet.tokens}
                        onOpenJersey={() => setJerseyBuy(item)}
                        onBuyDirect={buyDirectCosmetic(item)}
                      />
                    ) : (
                      <SelectTile selected={selected} onClick={() => equipItem(item.id, 'jersey')}>
                        <span className="text-2xl">{item.emoji}</span>
                        <span className="mt-1 block line-clamp-2">{item.name}</span>
                        {item.cost === 0 ? (
                          <span className="mt-1 text-[10px] font-semibold text-emerald-200/90">Gratuit</span>
                        ) : null}
                      </SelectTile>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      case 'bottoms':
        return (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {bottoms.map((item) => {
              const locked = !ownsItem(item.id)
              const selected = equippedPants === item.id
              return (
                <div key={item.id}>
                  {locked ? (
                    <StudioLockedItem
                      item={item}
                      walletMedals={wallet.medals}
                      walletTokens={wallet.tokens}
                      onBuyDirect={buyDirectCosmetic(item)}
                    />
                  ) : (
                    <SelectTile selected={selected} onClick={() => equipItem(item.id, 'pants')}>
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="mt-1 block">{item.name}</span>
                    </SelectTile>
                  )}
                </div>
              )
            })}
          </div>
        )
      case 'shoes':
        return (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {shoes.map((item) => {
              const locked = !ownsItem(item.id)
              const selected = equippedShoes === item.id
              return (
                <div key={item.id}>
                  {locked ? (
                    <StudioLockedItem
                      item={item}
                      walletMedals={wallet.medals}
                      walletTokens={wallet.tokens}
                      onBuyDirect={buyDirectCosmetic(item)}
                    />
                  ) : (
                    <SelectTile selected={selected} onClick={() => equipItem(item.id, 'shoes')}>
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="mt-1 block">{item.name}</span>
                    </SelectTile>
                  )}
                </div>
              )
            })}
          </div>
        )
      case 'accessories':
        return (
          <div className="space-y-3">
            <p className="text-[11px] text-white/55">Objets portés sur le personnage (aperçu emoji à droite du buste).</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {shopAccessories.map((item) => {
                const locked = !ownsItem(item.id)
                const selected = equippedAccessory === item.id
                return (
                  <div key={item.id}>
                    {locked ? (
                      <StudioLockedItem
                        item={item}
                        walletMedals={wallet.medals}
                        walletTokens={wallet.tokens}
                        onBuyDirect={buyDirectCosmetic(item)}
                      />
                    ) : (
                      <SelectTile selected={selected} onClick={() => equipItem(item.id, 'accessory')}>
                        <span className="text-2xl">{item.emoji}</span>
                        <span className="mt-1 block line-clamp-2">{item.name}</span>
                      </SelectTile>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      default:
        return null
    }
  })()

  return (
    <Card
      className={cn(
        'overflow-hidden border-2 p-0 shadow-[0_24px_80px_rgba(0,0,0,0.35)]',
        L
          ? 'border-slate-200/80 bg-gradient-to-br from-white via-sky-50/40 to-slate-100'
          : 'border-cyan-500/20 bg-gradient-to-br from-[#051525] via-[#0a1f38] to-[#030912]',
      )}
      elevation="soft"
    >
      <div
        className={cn(
          'border-b px-4 py-4 sm:px-6',
          L ? 'border-slate-200/80 bg-white/70' : 'border-white/10 bg-white/[0.04]',
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={cn('text-[11px] font-black uppercase tracking-[0.2em]', L ? 'text-slate-500' : 'text-sky-200/80')}>
              Personnage 2D
            </p>
            <h2 className={cn('font-display text-xl font-black tracking-tight sm:text-2xl', L ? 'text-slate-900' : 'text-white')}>
              Studio d’équipement
            </h2>
            <p className={cn('mt-1 max-w-xl text-sm font-medium', L ? 'text-slate-600' : 'text-sky-100/80')}>
              Mascotte TalkFoot — calques modulaires (corps, maillot, visage, barbe, cheveux). Conçue pour tous les maillots boutique.
            </p>
          </div>
          <Link to="/boutique">
            <Button variant="primary" className="rounded-2xl shadow-lg shadow-cyan-500/20">
              Boutique
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(300px,400px)]">
        <div
          className={cn(
            'relative flex min-h-[min(52vh,420px)] flex-col items-center justify-end bg-[radial-gradient(ellipse_at_50%_0%,rgba(56,189,248,0.18),transparent_55%)] px-4 pb-8 pt-10',
            L ? 'border-b border-slate-200/80 lg:border-b-0 lg:border-r' : 'border-b border-white/10 lg:border-b-0 lg:border-r lg:border-white/10',
          )}
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="relative z-[1] scale-[1.72] sm:scale-[1.92]" style={{ transformOrigin: '50% 100%' }}>
            <Avatar2DComposer profile={profile} />
          </div>
          <p className={cn('relative z-[1] mt-6 text-center text-[11px] font-bold', L ? 'text-slate-500' : 'text-white/45')}>
            Aperçu temps réel · corps, visage, cheveux, barbe, maillot, bas, chaussures
          </p>
        </div>

        <aside className="flex flex-col border-t border-white/10 bg-gradient-to-b from-[#0c1829] to-[#050b14] text-white lg:border-l lg:border-t-0">
          <div className="flex gap-1 overflow-x-auto border-b border-white/10 p-2 sm:flex-wrap sm:overflow-visible">
            {CUSTOMIZER_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCat(c.id)}
                className={cn(
                  'shrink-0 rounded-xl border px-2.5 py-2 text-left text-[11px] font-black transition',
                  cat === c.id
                    ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-50'
                    : 'border-white/10 bg-white/5 text-white/80 hover:border-white/25 hover:bg-white/10',
                )}
              >
                <span className="mr-1">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
          <div className="max-h-[min(52vh,480px)] flex-1 overflow-y-auto p-4 sm:p-5">
            {shopNotice ? (
              <div
                role="status"
                className={cn(
                  'mb-3 rounded-xl border px-3 py-2.5 text-[11px] font-bold leading-snug',
                  shopNotice.tone === 'ok'
                    ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-50'
                    : 'border-rose-400/45 bg-rose-950/40 text-rose-100',
                )}
              >
                {shopNotice.text}
              </div>
            ) : null}
            {panel}
          </div>
        </aside>
      </div>

      {jerseyBuy ? (
        <JerseyPurchaseModal
          item={jerseyBuy}
          walletMedals={wallet.medals}
          walletTokens={wallet.tokens}
          spendMedals={spendMedals}
          spendTokens={spendTokens}
          addOwnedItem={addOwnedItem}
          setJerseyCustomization={setJerseyCustomization}
          equipItem={equipItem}
          onClose={() => setJerseyBuy(null)}
          onSuccess={(msg) => pushNotice('ok', msg)}
          onError={(msg) => pushNotice('err', msg)}
        />
      ) : null}
    </Card>
  )
}
