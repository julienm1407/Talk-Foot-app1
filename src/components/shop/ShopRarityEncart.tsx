import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../../utils/cn'

export type ShopRarity = 'common' | 'rare' | 'epic' | 'legendary'

const RARITY_LABEL: Record<ShopRarity, string> = {
  common: '⚪ Commun',
  rare: '🔵 Rare',
  epic: '🟣 Épique',
  legendary: '🟡 Légendaire',
}

/**
 * Fonds type encart match « à venir » : dégradés dynamiques (couleurs ↔ nuit centrale),
 * sans image — même logique visuelle que MatchSpotlightCard (overlay radial + assombrissement bas).
 */
const RARITY_GRADIENT: Record<ShopRarity, string> = {
  common:
    'linear-gradient(125deg, #0e7490 0%, #38bdf8 34%, #0a0f1a 50%, #155e75 66%, #22d3ee 100%)',
  rare: 'linear-gradient(125deg, #c2410c 0%, #fb923c 34%, #0a0f1a 50%, #ea580c 64%, #fdba74 100%)',
  epic: 'linear-gradient(125deg, #5b21b6 0%, #a78bfa 32%, #0a0f1a 50%, #7c3aed 62%, #e879f9 100%)',
  legendary:
    'linear-gradient(125deg, #92400e 0%, #fcd34d 30%, #0a0f1a 48%, #d97706 58%, #fef9c3 100%)',
}

const MATCH_STYLE_OVERLAY =
  'radial-gradient(ellipse 120% 80% at 50% 0%, rgba(255,255,255,0.14), transparent 55%), linear-gradient(to bottom, rgba(0,0,0,0.12), rgba(0,0,0,0.52))'

/** Bordure / ombre proches de la carte à venir + halo rareté léger */
const RARITY_SHELL: Record<ShopRarity, string> = {
  common:
    'border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.26)] ring-1 ring-cyan-400/35',
  rare: 'border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.26)] ring-1 ring-orange-400/40',
  epic: 'border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.26)] ring-1 ring-violet-400/40',
  legendary:
    'border-white/15 shadow-[0_18px_52px_rgba(0,0,0,0.3)] ring-1 ring-amber-300/45',
}

const RARITY_BADGE_TOP: Record<ShopRarity, string> = {
  common: 'bg-sky-600 ring-sky-400/45',
  rare: 'bg-orange-600 ring-orange-400/45',
  epic: 'bg-violet-600 ring-violet-400/45',
  legendary: 'bg-amber-500 text-amber-950 ring-amber-200/50',
}

function ShopRarityTopBadges({ rarity }: { rarity: ShopRarity }) {
  return (
    <div className="pointer-events-none absolute left-3 right-3 top-3 z-30 flex flex-wrap items-center justify-between gap-2">
      <span
        className={cn(
          'rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wide shadow-md ring-1',
          RARITY_BADGE_TOP[rarity],
          rarity !== 'legendary' && 'text-white',
        )}
      >
        {RARITY_LABEL[rarity]}
      </span>
      <span className="rounded-lg bg-white/15 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white ring-1 ring-white/25 backdrop-blur-sm">
        Boutique
      </span>
    </div>
  )
}

export function ShopRarityEncart({
  rarity,
  children,
  className,
}: {
  rarity: ShopRarity
  children: ReactNode
  className?: string
}) {
  const bgStyle: CSSProperties = {
    background: RARITY_GRADIENT[rarity],
  }

  return (
    <article
      className={cn(
        'group relative isolate aspect-[3/4] w-full overflow-hidden rounded-2xl border transition duration-300',
        'hover:-translate-y-0.5 hover:shadow-[0_20px_56px_rgba(0,0,0,0.32)]',
        RARITY_SHELL[rarity],
        className,
      )}
      aria-label={`Carte boutique, rareté ${RARITY_LABEL[rarity]}`}
    >
      <div className="pointer-events-none absolute inset-0" style={bgStyle} aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.92]"
        style={{ background: MATCH_STYLE_OVERLAY }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.06] via-transparent to-transparent"
        aria-hidden
      />

      <ShopRarityTopBadges rarity={rarity} />

      <div className="absolute inset-0 z-20 flex min-h-0 flex-col px-[5%] pb-[4%] pt-14 sm:px-[6%] sm:pb-[4.5%] sm:pt-16">
        {children}
      </div>
    </article>
  )
}

/** Bandeau bas type carte match (footer sombre + bordure haute) */
export function ShopEncartContentPanel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'mt-auto space-y-1.5 rounded-b-xl border-t border-white/10 bg-[#050a12]/92 px-3 py-2.5 font-sans text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * Boutons encart (footer sombre) — `!` pour écraser le `variant="soft"` du composant Button
 * (text-tf-dark / fond clair) qui rendait le bouton « Jetons » illisible.
 */
export const shopEncartButtonClass = (owned: boolean) =>
  cn(
    'rounded-xl px-3 py-2 text-xs font-black font-display outline-none transition',
    'focus-visible:ring-2 focus-visible:ring-sky-300',
    owned
      ? '!border !border-white/60 !bg-white/20 !text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] [text-shadow:0_1px_2px_rgba(0,0,0,0.85)] hover:!bg-white/28 disabled:cursor-not-allowed disabled:!opacity-100'
      : '!border-2 !border-sky-200/50 !bg-gradient-to-b !from-sky-400 !to-blue-700 !text-white shadow-md [text-shadow:0_1px_2px_rgba(0,0,0,0.5)] hover:!from-sky-300 hover:!to-blue-600',
  )

/** Jetons : fort contraste sur panneau sombre (texte blanc + relief lisible) */
export const shopEncartTokenButtonClass = (owned: boolean) =>
  cn(
    'rounded-xl px-3 py-2 text-xs font-black font-display outline-none transition',
    'focus-visible:ring-2 focus-visible:ring-lime-300',
    owned
      ? '!border !border-emerald-300/70 !bg-emerald-950/75 !text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] [text-shadow:0_1px_2px_rgba(0,0,0,0.9)] hover:!bg-emerald-950/90 disabled:cursor-not-allowed disabled:!opacity-100'
      : '!border-2 !border-lime-200/80 !bg-gradient-to-b !from-lime-400 !to-emerald-800 !text-white shadow-lg [text-shadow:0_1px_3px_rgba(0,0,0,0.85)] hover:!from-lime-300 hover:!to-emerald-700',
  )
