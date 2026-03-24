import { Link } from 'react-router-dom'
import type { Debate } from '../../data/debates'
import { Card } from '../ui/Card'
import { ClubCrest } from '../brand/ClubCrest'
import { cn } from '../../utils/cn'
import { getTeamByClubId } from '../../utils/debateCrest'
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

  return (
    <section
      className={cn(
        'space-y-4 sm:space-y-5',
        variant === 'band' && 'sm:space-y-6',
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
          <p
            className={cn(
              'text-[11px] font-black uppercase tracking-[0.22em] sm:text-xs',
              variant === 'band' ? 'text-tf-dark/90' : 'text-tf-electric-deep',
            )}
          >
            Débats
          </p>
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
          className="inline-flex w-full items-center justify-center rounded-2xl border-2 border-tf-dark/15 bg-white px-4 py-2.5 text-center text-xs font-black uppercase tracking-wide text-tf-dark shadow-sm transition hover:border-tf-electric/40 hover:text-tf-electric-deep sm:w-auto sm:py-2"
        >
          Tous les débats
        </Link>
      </header>

      <div className={cn('grid', gridCols)}>
        {debates.map((d) => {
          const team = d.clubCrestId ? getTeamByClubId(d.clubCrestId) : null
          const snippet = d.previewMessages[0]

          return (
            <Link
              key={d.id}
              to={`/debate/${d.id}`}
              className="group block outline-none focus-visible:ring-2 focus-visible:ring-tf-electric/35"
            >
              <Card
                className={cn(
                  'tf-card-hover h-full overflow-hidden p-0 transition-shadow',
                  'border-tf-grey-pastel/60',
                )}
                elevation="soft"
              >
                <div
                  className="flex items-start justify-between gap-2 border-b border-tf-grey-pastel/40 px-3 py-3 sm:px-4"
                  style={{
                    background: `linear-gradient(135deg, ${d.accent}10, transparent 55%)`,
                  }}
                >
                  <div className="min-w-0 flex-1">
                    {d.trending ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/90 px-2 py-0.5 text-[10px] font-black text-amber-900">
                        🔥 Trending
                      </span>
                    ) : null}
                    <h3 className="mt-2 font-display text-sm font-black uppercase leading-snug tracking-tight text-tf-electric-deep sm:text-[0.95rem]">
                      {d.title}
                    </h3>
                    <p className="mt-1.5 text-[11px] font-bold text-tf-grey sm:text-xs">
                      💬 {d.messagesCount.toLocaleString('fr-FR')} messages
                    </p>
                  </div>
                  {team ? (
                    <ClubCrest
                      id={team.id}
                      shortName={team.shortName}
                      colors={team.colors}
                      size={44}
                      className="shrink-0 opacity-95 ring-2 ring-white shadow-sm"
                    />
                  ) : (
                    <div
                      className="grid size-11 shrink-0 place-items-center rounded-2xl bg-tf-grey-pastel/40 text-lg"
                      aria-hidden
                    >
                      💬
                    </div>
                  )}
                </div>
                {snippet ? (
                  <div className="px-2.5 pb-2.5 pt-2 sm:px-3 sm:pb-3">
                    <DebateMessagePreview message={snippet} compact className="bg-tf-grey-pastel/12" />
                  </div>
                ) : (
                  <p className="px-3 pb-3 pt-2 text-xs font-semibold text-tf-grey">{d.excerpt}</p>
                )}
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
