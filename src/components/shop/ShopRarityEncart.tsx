import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../../utils/cn'

export type ShopRarity = 'common' | 'rare' | 'epic' | 'legendary'

const RARITY_BG: Record<ShopRarity, string> = {
  common: '/shop-rarity/common.png',
  rare: '/shop-rarity/rare.png',
  epic: '/shop-rarity/epic.png',
  legendary: '/shop-rarity/legendary.png',
}

const RARITY_LABEL: Record<ShopRarity, string> = {
  common: 'commun',
  rare: 'rare',
  epic: 'épique',
  legendary: 'légendaire',
}

/** Zoom du PNG : on remplit l’encart avec la matière colorée au centre, sans le cadre de la carte source */
const RARITY_BG_ZOOM: Record<ShopRarity, { size: string; pos: string }> = {
  common: { size: '520% 520%', pos: '50% 36%' },
  rare: { size: '500% 500%', pos: '50% 38%' },
  epic: { size: '500% 500%', pos: '50% 37%' },
  legendary: { size: '480% 480%', pos: '50% 40%' },
}

/** Contours + aura extérieure (dessinés en CSS, pas le cadre du PNG) */
const RARITY_FRAME: Record<ShopRarity, string> = {
  common:
    'ring-2 ring-cyan-400/75 shadow-[0_0_0_1px_rgba(34,211,238,0.35),0_0_28px_rgba(34,211,238,0.5),0_0_72px_rgba(14,165,233,0.22),inset_0_0_0_1px_rgba(255,255,255,0.12)]',
  rare: 'ring-2 ring-orange-400/80 shadow-[0_0_0_1px_rgba(251,146,60,0.4),0_0_32px_rgba(251,146,60,0.52),0_0_76px_rgba(234,88,12,0.2),inset_0_0_0_1px_rgba(255,255,255,0.1)]',
  epic: 'ring-2 ring-violet-400/80 shadow-[0_0_0_1px_rgba(192,132,252,0.42),0_0_32px_rgba(168,85,247,0.5),0_0_76px_rgba(124,58,237,0.2),inset_0_0_0_1px_rgba(255,255,255,0.1)]',
  legendary:
    'ring-2 ring-amber-300/85 shadow-[0_0_0_1px_rgba(251,191,36,0.45),0_0_36px_rgba(251,191,36,0.58),0_0_88px_rgba(245,158,11,0.24),inset_0_0_0_1px_rgba(255,250,235,0.15)]',
}

const RARITY_BLOOM: Record<ShopRarity, string> = {
  common: 'rgba(34,211,238,0.42)',
  rare: 'rgba(251,146,60,0.45)',
  epic: 'rgba(192,132,252,0.45)',
  legendary: 'rgba(251,191,36,0.5)',
}

/** Pastille rareté */
const RARITY_PILL: Record<ShopRarity, string> = {
  common:
    'border border-cyan-300/70 bg-slate-950/80 shadow-[0_0_18px_rgba(34,211,238,0.55),0_0_32px_rgba(14,165,233,0.25),inset_0_1px_0_rgba(255,255,255,0.12)]',
  rare: 'border border-amber-400/75 bg-black/55 shadow-[0_0_20px_rgba(251,146,60,0.55),0_0_36px_rgba(234,88,12,0.2),inset_0_1px_0_rgba(255,255,255,0.12)]',
  epic:
    'border border-violet-400/75 bg-violet-950/80 shadow-[0_0_20px_rgba(192,132,252,0.55),0_0_36px_rgba(124,58,237,0.22),inset_0_1px_0_rgba(255,255,255,0.1)]',
  legendary:
    'border border-amber-200/85 bg-gradient-to-b from-amber-950/90 to-black/70 shadow-[0_0_22px_rgba(251,191,36,0.65),0_0_40px_rgba(245,158,11,0.28),inset_0_1px_0_rgba(255,250,235,0.2)]',
}

function ShopRarityPill({ rarity }: { rarity: ShopRarity }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 rounded-full px-3.5 py-1 font-display text-[11px] font-black lowercase tracking-[0.14em] text-white sm:px-4 sm:text-xs',
        RARITY_PILL[rarity],
      )}
      style={{ top: '0.65rem' }}
    >
      <span className="[text-shadow:0_0_12px_rgba(255,255,255,0.35)]">{RARITY_LABEL[rarity]}</span>
    </div>
  )
}

function FrameEdgeBloom({ rarity }: { rarity: ShopRarity }) {
  const c = RARITY_BLOOM[rarity]
  const top: CSSProperties = {
    background: `radial-gradient(ellipse 72% 100% at 50% 0%, ${c}, transparent 68%)`,
  }
  const bottom: CSSProperties = {
    background: `radial-gradient(ellipse 60% 100% at 50% 100%, ${c}, transparent 72%)`,
  }
  return (
    <>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-[26%] rounded-t-2xl mix-blend-screen opacity-90"
        style={top}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[22%] rounded-b-2xl mix-blend-screen opacity-80"
        style={bottom}
        aria-hidden
      />
    </>
  )
}

function ShopParticles({ rarity }: { rarity: ShopRarity }) {
  const count = rarity === 'legendary' ? 10 : rarity === 'epic' ? 8 : 6
  const positions = [
    { t: '8%', l: '12%', s: 3 },
    { t: '18%', r: '10%', s: 2 },
    { t: '42%', l: '6%', s: 2 },
    { t: '38%', r: '14%', s: 4 },
    { t: '62%', l: '18%', s: 2 },
    { t: '72%', r: '8%', s: 3 },
    { t: '22%', l: '48%', s: 2 },
    { t: '55%', r: '42%', s: 2 },
    { t: '12%', r: '28%', s: 2 },
    { t: '78%', l: '42%', s: 3 },
  ]
  return (
    <div className="pointer-events-none absolute inset-0 z-[3] overflow-hidden rounded-2xl" aria-hidden>
      {positions.slice(0, count).map((p, i) => (
        <span
          key={i}
          className="tf-shop-particle absolute rounded-full bg-white blur-[1px]"
          style={{
            top: p.t,
            left: 'l' in p ? p.l : undefined,
            right: 'r' in p ? p.r : undefined,
            width: p.s,
            height: p.s,
            opacity: rarity === 'legendary' ? 0.55 : 0.35,
            animationDelay: `${i * 0.45}s`,
          }}
        />
      ))}
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
  const src = RARITY_BG[rarity]
  const zoom = RARITY_BG_ZOOM[rarity]
  const bgStyle: CSSProperties = {
    backgroundImage: `url(${encodeURI(src)})`,
    backgroundSize: zoom.size,
    backgroundPosition: zoom.pos,
    backgroundRepeat: 'no-repeat',
  }

  return (
    <article
      className={cn(
        'group relative isolate aspect-[3/4] w-full overflow-hidden rounded-2xl transition duration-300',
        RARITY_FRAME[rarity],
        className,
      )}
      aria-label={`Carte boutique, rareté ${RARITY_LABEL[rarity]}`}
    >
      <div
        className="pointer-events-none absolute inset-0 transition duration-500 group-hover:brightness-105"
        style={bgStyle}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.11] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.07] via-transparent to-transparent mix-blend-soft-light"
        aria-hidden
      />
      <FrameEdgeBloom rarity={rarity} />
      <ShopParticles rarity={rarity} />
      <ShopRarityPill rarity={rarity} />
      <div className="absolute inset-0 z-20 flex min-h-0 flex-col px-[6%] pb-[4.5%] pt-12">
        {children}
      </div>
    </article>
  )
}

/** Panneau lisible — corps en Manrope ; titres / prix en Bigail via classes sur les enfants */
export function ShopEncartContentPanel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'mt-auto space-y-1.5 rounded-xl bg-black/45 px-3 py-2.5 font-sans text-white shadow-inner backdrop-blur-md ring-1 ring-white/15',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Boutons encart : contrastes garantis + police display (charte Talk Foot) */
export const shopEncartButtonClass = (owned: boolean) =>
  cn(
    'rounded-xl px-3 py-1.5 text-xs font-black font-display outline-none transition',
    'focus-visible:ring-2 focus-visible:ring-tf-electric/50',
    owned
      ? 'border border-white/50 bg-tf-dark text-tf-white shadow-none hover:bg-tf-dark hover:text-tf-white disabled:cursor-not-allowed disabled:bg-tf-dark disabled:text-tf-white disabled:opacity-100'
      : 'border border-tf-dark/20 bg-tf-white text-tf-dark shadow-md hover:border-tf-electric/35 hover:bg-tf-ice hover:text-tf-dark',
  )
