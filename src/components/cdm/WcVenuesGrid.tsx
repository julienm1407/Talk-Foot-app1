import type { WcVenue } from '../../types/wc2026'
import { cn } from '../../utils/cn'

const COUNTRY_LABEL: Record<WcVenue['country'], { flag: string; name: string }> = {
  US: { flag: '🇺🇸', name: 'États-Unis' },
  CA: { flag: '🇨🇦', name: 'Canada' },
  MX: { flag: '🇲🇽', name: 'Mexique' },
}

/**
 * Grille des 16 stades CDM 2026. À enrichir avec photos et carte interactive
 * dans une seconde passe.
 */
export function WcVenuesGrid({
  venues,
  className,
}: {
  venues: WcVenue[]
  className?: string
}) {
  return (
    <section
      aria-label="Stades de la Coupe du Monde 2026"
      className={cn('grid gap-2 sm:grid-cols-2 lg:grid-cols-3', className)}
    >
      {venues.map((v) => (
        <article
          key={v.id}
          className="flex flex-col gap-1 rounded-tf-lg border border-tf-c30-border bg-tf-c30-surface p-3 text-xs shadow-tf-elev-1"
        >
          <header className="flex items-center justify-between gap-2">
            <p className="truncate font-display text-sm font-black uppercase tracking-wider text-tf-app-fg">
              {v.fifaName ?? v.name}
            </p>
            <span aria-hidden className="text-base">
              {COUNTRY_LABEL[v.country].flag}
            </span>
          </header>
          {v.fifaName ? (
            <p className="text-[10px] text-tf-app-muted">Aussi connu sous : {v.name}</p>
          ) : null}
          <p className="text-tf-app-muted">
            {v.city} · {COUNTRY_LABEL[v.country].name}
          </p>
          <footer className="mt-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-tf-cdm-gold">
            <span>{v.capacity.toLocaleString('fr-FR')} places</span>
            {v.roof ? (
              <span>
                Toit{' '}
                {v.roof === 'open'
                  ? 'ouvert'
                  : v.roof === 'closed'
                    ? 'fermé'
                    : 'rétractable'}
              </span>
            ) : null}
          </footer>
        </article>
      ))}
    </section>
  )
}
