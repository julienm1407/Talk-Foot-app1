import { Link } from 'react-router-dom'
import type { Debate } from '../../data/debates'
import { Card } from '../ui/Card'
import { cn } from '../../utils/cn'
import { getAppSectionTheme } from '../../theme/appSectionThemes'
import { DebateMessagePreview } from '../debate/DebateMessagePreview'

export function TrendingDebatesSection({
  debates,
  variant = 'default',
}: {
  debates: Debate[]
  /** `band` : encart pleine largeur sur l’accueil (fond déjà porté par le parent). */
  variant?: 'default' | 'band'
}) {
  if (debates.length === 0) return null

  const gridCols =
    debates.length >= 6
      ? 'grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 lg:gap-4'
      : 'grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3'

  const debatesEncart = getAppSectionTheme('debates').encart

  return (
    <section
      className={cn(
        'relative space-y-4 sm:space-y-5',
        variant === 'band' &&
          cn(
            'sm:space-y-6 sm:pl-3.5',
            'before:pointer-events-none before:absolute before:left-0 before:top-2 before:z-0 before:h-[calc(100%-1rem)] before:w-1.5 before:rounded-full before:bg-gradient-to-b before:from-tf-ember before:to-orange-600 before:content-[""]',
          ),
      )}
      aria-labelledby="trending-debates-heading"
    >
      <header
        className={cn(
          'flex flex-col gap-3 pb-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pb-4',
          variant === 'band'
            ? 'border-b-2 border-tf-dark/14 pb-3 sm:pb-4'
            : 'border-b border-tf-grey-pastel/50',
        )}
      >
        <div className="min-w-0 flex-1 space-y-2 sm:space-y-2.5">
          {variant === 'band' ? (
            <p
              className={cn(
                'inline-flex w-fit rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] ring-1 sm:text-[11px]',
                debatesEncart.badge,
              )}
            >
              Débats
            </p>
          ) : (
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-tf-electric-deep sm:text-xs">
              Débats
            </p>
          )}
          <h2
            id="trending-debates-heading"
            className={cn(
              'font-display text-2xl font-black uppercase leading-[1.1] tracking-tight text-tf-dark',
              'sm:text-[1.65rem] lg:text-3xl',
            )}
          >
            Tendances
          </h2>
          <p className="max-w-xl text-sm font-semibold leading-relaxed text-tf-dark/75 line-clamp-2 sm:line-clamp-none">
            Ouvre un fil — même importance que le match.
          </p>
        </div>
        <Link
          to="/debates"
          className={cn(
            'inline-flex w-full items-center justify-center sm:w-auto',
            debatesEncart.pillButton,
          )}
        >
          Tous les débats
        </Link>
      </header>

      <div className={cn('grid', gridCols)}>
        {debates.map((d) => {
          const snippet = d.previewMessages[0]

          return (
            <Link
              key={d.id}
              to={`/debate/${d.id}`}
              className="group block outline-none focus-visible:ring-2 focus-visible:ring-orange-400/45"
            >
              <Card
                elevation="soft"
                className={cn(
                  'tf-card-hover h-full overflow-hidden border border-orange-200/45 p-0 transition-shadow',
                  variant === 'band'
                    ? 'shadow-[0_12px_32px_rgba(234,88,12,0.1)] ring-1 ring-orange-200/30'
                    : '',
                )}
                style={{ ['--debate-accent' as string]: d.accent }}
              >
                {/* Bandeau question : tout le bloc teinté (accent → nuit) pour lisibilité max du titre */}
                <div
                  className="relative px-3.5 py-3.5 sm:px-4 sm:py-4"
                  style={{
                    background: `linear-gradient(155deg, ${d.accent} 0%, color-mix(in srgb, ${d.accent} 42%, #0a1628) 52%, #061018 100%)`,
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.14]"
                    style={{
                      background: `radial-gradient(ellipse 120% 80% at 20% 0%, #fff, transparent 55%)`,
                    }}
                    aria-hidden
                  />
                  <div className="relative min-w-0">
                    {d.trending ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/18 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white ring-1 ring-white/35 backdrop-blur-[2px]">
                        🔥 Trending
                      </span>
                    ) : null}
                    <h3 className="mt-2.5 font-display text-base font-black leading-[1.22] tracking-tight text-white sm:text-[1.0625rem] sm:leading-[1.2] [text-shadow:0_2px_14px_rgba(0,0,0,0.35),0_1px_2px_rgba(0,0,0,0.5)]">
                      {d.title}
                    </h3>
                    <p className="mt-2 text-[11px] font-bold text-white/88 sm:text-xs">
                      💬 {d.messagesCount.toLocaleString('fr-FR')} messages
                    </p>
                  </div>
                </div>

                {snippet ? (
                  <div className="border-t border-orange-100/80 bg-gradient-to-b from-orange-50/40 to-white px-2.5 py-2.5 sm:px-3 sm:py-3">
                    <DebateMessagePreview
                      message={snippet}
                      compact
                      className="border-orange-100/70 bg-white/95 shadow-[0_1px_0_rgba(234,88,12,0.06)]"
                    />
                  </div>
                ) : (
                  <p className="border-t border-orange-100/80 bg-orange-50/25 px-3 py-2.5 text-xs font-semibold leading-snug text-tf-dark/80 sm:px-4">
                    {d.excerpt}
                  </p>
                )}
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
