import { Link } from 'react-router-dom'
import { NATIONS } from '../../data/nations'
import { NationCard } from './NationCard'
import { cn } from '../../utils/cn'

const FEATURED_ISO = ['FRA', 'ARG', 'BRA', 'DEU', 'ESP', 'PRT', 'ENG', 'MAR', 'NLD', 'BEL', 'JPN', 'USA']

/**
 * Bandeau saisonnier — Collection CDM 2026.
 *
 * Affiche un rail horizontal des maillots vedettes + un lien vers l'index `/nations`.
 * À placer en haut des pages Boutique et Home quand `seasonMode === 'cdm2026'`.
 */
export function CdmShopBanner() {
  const featured = FEATURED_ISO.map((iso) => NATIONS.find((n) => n.iso === iso)).filter(
    (n): n is (typeof NATIONS)[number] => Boolean(n),
  )

  return (
    <section
      aria-label="Collection Coupe du Monde 2026"
      className={cn(
        'relative overflow-hidden rounded-3xl border shadow-tf-elev-2',
        'text-white',
      )}
      style={{
        background: 'var(--tf-cdm-hero-bg)',
        borderColor: 'var(--tf-cdm-hero-border, rgba(255,255,255,0.18))',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(60% 40% at 90% 0%, rgba(244,197,66,0.42) 0%, transparent 60%), radial-gradient(50% 50% at 5% 110%, rgba(230,57,70,0.35) 0%, transparent 65%)',
        }}
        aria-hidden
      />
      <div className="relative px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-200/90">
              Talk Foot · Édition limitée
            </p>
            <h2 className="mt-1 font-display text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
              Collection Coupe du Monde 2026
            </h2>
            <p className="mt-2 text-sm font-medium text-white/85">
              48 sélections, 48 maillots. Choisis ta nation, équipe-le sur ton avatar et porte les couleurs
              de ton équipe tout au long du tournoi.
            </p>
          </div>
          <Link
            to="/nations"
            className={cn(
              'inline-flex min-h-tf-touch shrink-0 items-center justify-center rounded-full border-2 border-white/30 bg-white/12 px-5 py-2.5 text-sm font-black uppercase tracking-wide text-white shadow-sm backdrop-blur-sm transition',
              'hover:border-white/55 hover:bg-white/22',
            )}
          >
            Toutes les nations
            <span aria-hidden className="ml-1.5">
              →
            </span>
          </Link>
        </div>

        <div className="mt-5 -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin] sm:gap-4">
          {featured.map((nation) => (
            <NationCard key={nation.iso} nation={nation} variant="jersey" className="snap-start" />
          ))}
        </div>
      </div>
    </section>
  )
}
