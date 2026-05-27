import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'
import { HubEncartTopAccent } from '../ui/HubEncartTopAccent'
import { hubPillLink } from '../../utils/hubSurface'

/**
 * Bloc d’accueil : promesse + CTA visibles sans scroll inutile + accès profil / page Match / etc.
 * Utilisé sur mobile (<xl) et dans le hub desktop (colonne centrale).
 */
export function HomeLandingHub({
  appearance,
  className,
  onCreateGroup,
  desktopToolbar,
  compact = false,
  /** `contextRail` : bandeau court sous le live (desktop), sans titre marketing */
  variant = 'full',
}: {
  appearance: 'light' | 'dark'
  className?: string
  onCreateGroup: () => void
  /** Barre optionnelle (recherche, notif…) — surtout desktop */
  desktopToolbar?: React.ReactNode
  /** Moins de padding / hauteurs : laisser les lives visibles au-dessus de la ligne de flottaison */
  compact?: boolean
  variant?: 'full' | 'contextRail'
}) {
  const L = appearance === 'light'

  if (variant === 'contextRail') {
    return (
      <section
        className={cn(
          'overflow-hidden rounded-2xl border',
          L ? 'border-tf-dark/12 bg-white/92' : 'border-white/[0.09] bg-white/[0.05]',
          className,
        )}
        aria-label="Actions rapides"
      >
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-3.5">
          <Button
            type="button"
            variant="primary"
            className={cn(
              'w-full rounded-xl text-sm font-black shadow-[0_6px_20px_rgba(255,59,59,0.22)] sm:w-auto sm:min-w-[13.5rem]',
              !L &&
                'border-tf-cta-hover/35 bg-tf-cta hover:border-orange-400/45 hover:bg-tf-cta-hover hover:shadow-[0_8px_28px_rgba(255,59,59,0.32)]',
            )}
            onClick={onCreateGroup}
          >
            ➕ Créer une tribune
          </Button>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
            <Link to="/profile" className={hubPillLink(appearance, 'sm')}>
              Profil
            </Link>
            <Link to="/boutique" className={hubPillLink(appearance, 'sm')}>
              Boutique
            </Link>
            <Link to="/videos" className={hubPillLink(appearance, 'sm')}>
              Vidéos
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className={cn('overflow-hidden rounded-tf-3xl border', className)}
      aria-labelledby="home-hero-heading"
    >
      <HubEncartTopAccent appearance={appearance} preset="nav" />
      <div
        className={cn(
          'flex flex-col',
          compact ? 'gap-tf-3 p-tf-3 sm:gap-tf-4 sm:p-tf-4' : 'gap-tf-5 p-tf-4 sm:gap-tf-6 sm:p-tf-6',
        )}
      >
        {/* Toujours en colonne : sur grands écrans, une rangée titre+toolbar crée un vide énorme et du wrap instable. */}
        <div className="flex flex-col gap-tf-3 sm:gap-tf-4">
          <div className="min-w-0 w-full text-left">
            <h1
              id="home-hero-heading"
              className={cn(
                'font-display font-black tracking-tight text-balance',
                L ? 'text-tf-dark' : 'text-tf-app-fg',
                compact ? 'text-tf-xl sm:text-2xl xl:text-3xl' : 'text-tf-display',
                'leading-[1.12]',
              )}
            >
              Le foot live, avec tes potes en tribunes
            </h1>
            <p
              className={cn(
                'mt-tf-2 w-full max-w-[48ch] text-left text-pretty text-tf-base font-semibold leading-relaxed sm:text-tf-md xl:leading-relaxed',
                L ? 'text-tf-dark/72' : 'text-tf-app-muted',
              )}
            >
              {compact
                ? 'Tribunes live, débats, actus foot : le hub des supporters en un seul endroit.'
                : 'Suivez les matchs en direct, rejoignez les tribunes, lisez les actus et participez aux débats — Talk Foot centralise l’expérience supporter autour du football.'}
            </p>
            <p
              className={cn(
                'mt-tf-2 max-w-[52ch] text-tf-xs font-bold leading-snug',
                L ? 'text-tf-grey' : 'text-sky-100/75',
              )}
            >
              Ambiance{' '}
              <span className={L ? 'font-black text-sky-700' : 'font-black text-orange-300'}>
                {L ? 'Jour' : 'Nuit stade'}
              </span>
              {' — les couleurs suivent ce choix (même bascule '}
              <span className="whitespace-nowrap font-black">Jour | Nuit</span>
              {' en haut à droite).'}
            </p>
          </div>
          {desktopToolbar ? (
            <div
              className={cn(
                'w-full min-w-0 border-t pt-tf-3 xl:border-t-0 xl:pt-0',
                L ? 'border-tf-dark/10' : 'border-white/10',
              )}
            >
              {desktopToolbar}
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            'h-px w-full shrink-0 bg-gradient-to-r from-transparent to-transparent',
            L ? 'via-tf-dark/14' : 'via-white/14',
          )}
          aria-hidden
        />

        <nav
          aria-label="Entrées principales"
          className={cn(
            'overflow-hidden rounded-tf-2xl border-2 shadow-tf-elev-2',
            L
              ? 'border-tf-dark/12 bg-gradient-to-b from-white to-tf-ice/40'
              : 'border-white/[0.12] bg-gradient-to-b from-white/[0.07] to-white/[0.02]',
          )}
        >
          <Link
            to="/match"
            className={cn(
              'group flex min-h-tf-touch items-center justify-between gap-tf-3 border-l-[3px] border-tf-nav-match text-left outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tf-nav-match/45',
              compact ? 'px-tf-3 py-tf-3 sm:px-tf-4 sm:py-tf-4' : 'px-tf-4 py-tf-4 sm:px-tf-5 sm:py-tf-5',
              'bg-tf-dark text-white shadow-tf-elev-2',
              'hover:bg-tf-dark-alt active:opacity-[0.97]',
            )}
          >
            <div className="min-w-0 flex-1 pr-tf-1">
              <div className="flex flex-wrap items-center gap-x-tf-2 gap-y-0.5">
                <span className="text-2xl leading-none sm:text-[1.75rem]" aria-hidden>
                  ⚽
                </span>
                <span className="font-display text-tf-lg font-black tracking-tight sm:text-xl">Match</span>
              </div>
              <p className="mt-tf-1 w-full text-pretty text-tf-xs font-semibold leading-snug text-white/95 sm:text-tf-sm">
                Lives, planning & tribunes — tout au même endroit
              </p>
            </div>
            <span
              className="shrink-0 self-center text-xl font-black text-white/80 transition group-hover:translate-x-0.5 group-hover:text-white"
              aria-hidden
            >
              →
            </span>
          </Link>

          <div
            className={cn(
              'grid grid-cols-2 divide-x',
              L ? 'divide-tf-dark/10 border-t border-tf-dark/10' : 'divide-white/10 border-t border-white/10',
            )}
          >
            <Link
              to="/groups"
              className={cn(
                'group flex w-full min-w-0 flex-col items-stretch justify-center gap-1 border-t-[2px] border-tf-nav-groups/30 px-tf-3 py-tf-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tf-nav-groups/40 sm:px-tf-4',
                compact ? 'min-h-[4.25rem] py-2.5' : 'min-h-[5rem] sm:py-tf-4',
                L ? 'bg-white/60 hover:bg-tf-nav-groups/[0.06]' : 'bg-transparent hover:bg-tf-nav-groups/[0.08]',
              )}
            >
              <span className="flex w-full min-w-0 items-center gap-tf-2 text-tf-sm font-black text-tf-app-fg sm:text-tf-md">
                <span className="shrink-0 text-lg" aria-hidden>
                  👥
                </span>
                <span className="min-w-0 leading-tight">Groupes</span>
              </span>
              <span
                className={cn(
                  'block w-full min-w-0 text-pretty text-tf-xs font-semibold leading-snug',
                  L ? 'text-tf-dark/75' : 'text-tf-app-muted',
                )}
              >
                Tribunes & débats
              </span>
            </Link>
            <Link
              to="/rankings"
              className={cn(
                'group flex w-full min-w-0 flex-col items-stretch justify-center gap-1 border-t-[2px] border-tf-nav-rankings/30 px-tf-3 py-tf-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tf-nav-rankings/40 sm:px-tf-4',
                compact ? 'min-h-[4.25rem] py-2.5' : 'min-h-[5rem] sm:py-tf-4',
                L ? 'bg-white/60 hover:bg-tf-nav-rankings/[0.07]' : 'bg-transparent hover:bg-tf-nav-rankings/[0.08]',
              )}
            >
              <span className="flex w-full min-w-0 items-center gap-tf-2 text-tf-sm font-black text-tf-app-fg sm:text-tf-md">
                <span className="shrink-0 text-lg" aria-hidden>
                  🏆
                </span>
                <span className="min-w-0 leading-tight">Classement</span>
              </span>
              <span
                className={cn(
                  'block w-full min-w-0 text-pretty text-tf-xs font-semibold leading-snug',
                  L ? 'text-tf-dark/75' : 'text-tf-app-muted',
                )}
              >
                Paris & ligues
              </span>
            </Link>
          </div>

          <div
            className={cn(
              'border-t',
              compact ? 'p-tf-2' : 'p-tf-3',
              L ? 'border-tf-dark/10 bg-white/40' : 'border-white/10 bg-black/20',
            )}
          >
            <Button
              type="button"
              variant="soft"
              className={cn(
                'w-full rounded-tf-xl text-tf-sm font-black',
                compact ? 'min-h-11 py-tf-2' : 'min-h-tf-touch',
                !L &&
                  'border-2 border-white/18 bg-white/[0.08] text-white shadow-none hover:border-sky-400/35 hover:bg-white/[0.12] hover:text-white',
              )}
              onClick={onCreateGroup}
            >
              ➕ Créer une tribune
            </Button>
          </div>
        </nav>
      </div>
    </section>
  )
}
