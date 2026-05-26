import { Link } from 'react-router-dom'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { useFavoriteNationsMatches } from '../../hooks/useFavoriteNationsMatches'
import { useNotificationPermission } from '../../hooks/useFavoriteNationsAlerts'
import { getNationByIso, type Nation } from '../../data/nations'
import { NationCrest } from '../brand/NationCrest'
import { NationFavoriteButton } from './NationFavoriteButton'
import { formatHubDayLabel, formatKickoff } from '../../utils/time'
import { cn } from '../../utils/cn'

/**
 * Section « Mes sélections » sur la home (mode CDM).
 *
 * - Si l'utilisateur n'a pas encore choisi de sélection favorite : invitation à
 *   en suivre une (CTA vers /nations).
 * - Sinon : crests + nom des nations suivies, prochains matchs CDM mis en
 *   avant (max 4), CTA vers la fiche pays.
 *
 * La section est intentionnellement compacte pour rester au-dessus de la
 * fold ; le scroll/découverte se fait via les liens vers les fiches.
 */
export function FavoriteNationsHomeSection({ className }: { className?: string }) {
  const { favoriteNationIsos } = useFanPreferences()
  const upcoming = useFavoriteNationsMatches({ limit: 4 })
  const { state: notifPermission, supported: notifSupported, request: requestNotif } =
    useNotificationPermission()

  const favNations = favoriteNationIsos
    .map((iso) => getNationByIso(iso))
    .filter((n): n is Nation => !!n)

  if (favNations.length === 0) {
    return (
      <section
        aria-label="Tes sélections favorites"
        className={cn(
          'relative overflow-hidden rounded-2xl border border-tf-c30-border bg-tf-c30-surface px-4 py-4 shadow-tf-elev-1 sm:px-5',
          className,
        )}
      >
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-tf-cdm-gold">
              Personnalise ton Mondial
            </p>
            <h2 className="mt-1 font-display text-lg font-black tracking-tight text-tf-app-fg">
              Suis ta sélection favorite
            </h2>
            <p className="mt-1 text-xs font-medium leading-snug text-tf-app-muted">
              Ajoute jusqu'à 5 sélections — on te prévient avant chaque match et on met en avant ses
              infos sur la home.
            </p>
          </div>
        </header>
        <div className="mt-3">
          <Link
            to="/nations"
            className="inline-flex min-h-tf-touch items-center justify-center rounded-full border-2 border-tf-cdm-gold bg-tf-cdm-gold px-4 py-2 text-xs font-black uppercase tracking-wide text-tf-cdm-deep shadow-tf-elev-1 transition hover:bg-tf-cdm-gold/90"
          >
            Choisir mes sélections →
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section
      aria-label="Tes sélections favorites"
      className={cn(
        'relative overflow-hidden rounded-2xl border border-tf-c30-border bg-tf-c30-surface px-4 py-4 shadow-tf-elev-1 sm:px-5',
        className,
      )}
    >
      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-tf-cdm-gold">
            Mes sélections · {favNations.length}/5
          </p>
          <h2 className="mt-1 font-display text-lg font-black tracking-tight text-tf-app-fg">
            {favNations.length === 1
              ? `Vamos ${favNations[0].nameFr} !`
              : 'Tes sélections du Mondial'}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {notifSupported && notifPermission === 'default' ? (
            <button
              type="button"
              onClick={requestNotif}
              title="Recevoir une notification 60 min et 5 min avant chaque match"
              className="hidden rounded-full border border-tf-cdm-gold/60 bg-tf-cdm-gold/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-tf-cdm-gold transition hover:bg-tf-cdm-gold/20 sm:inline-flex"
            >
              🔔 Activer alertes
            </button>
          ) : null}
          {notifSupported && notifPermission === 'granted' ? (
            <span
              className="hidden rounded-full border border-emerald-400/50 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400 sm:inline-flex"
              title="Tu seras prévenu 60 min et 5 min avant chaque match"
            >
              🔔 Alertes ON
            </span>
          ) : null}
          <Link
            to="/nations"
            className="text-[11px] font-black uppercase tracking-wide text-tf-cdm-gold hover:underline"
          >
            Gérer →
          </Link>
        </div>
      </header>

      {/* Rail des nations favorites */}
      <ul className="mt-3 flex flex-wrap gap-2">
        {favNations.map((n) => (
          <li key={n.iso}>
            <Link
              to={`/nation/${n.iso.toLowerCase()}`}
              className={cn(
                'group/nat inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 transition',
                'border-tf-c30-border bg-white/[0.04] text-tf-app-fg hover:border-tf-cdm-gold/55 hover:bg-white/[0.08]',
              )}
            >
              <span className="inline-flex h-7 w-7 items-center justify-center">
                <NationCrest nation={n} size="sm" withRing={false} />
              </span>
              <span className="font-display text-xs font-black uppercase tracking-wide">
                {n.nameFr}
              </span>
              <NationFavoriteButton
                iso={n.iso}
                nationLabel={n.nameFr}
                size="sm"
                variant="icon"
                className="-mr-1 ml-0.5 h-6 w-6"
              />
            </Link>
          </li>
        ))}
      </ul>

      {/* Prochains matchs des sélections suivies */}
      {upcoming.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-tf-c30-border bg-white/[0.03] px-3 py-3 text-xs font-medium text-tf-app-muted">
          Aucun match au programme pour l'instant. Le calendrier CDM 2026 s'affichera ici dès la
          publication des fixtures.
        </p>
      ) : (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {upcoming.map(({ match: m, primaryIso, nations }) => {
            const primary = getNationByIso(primaryIso)
            return (
              <li key={m.id}>
                <Link
                  to={`/channel/${encodeURIComponent(m.id)}`}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border bg-white/[0.04] px-3 py-2 transition',
                    'border-tf-cdm-gold/35 hover:border-tf-cdm-gold/75 hover:bg-white/[0.08]',
                  )}
                >
                  {primary ? (
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center">
                      <NationCrest nation={primary} size="sm" />
                    </span>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-tf-cdm-gold">
                      <span>{formatHubDayLabel(m.kickoffAt)}</span>
                      <span aria-hidden className="text-tf-app-muted">·</span>
                      <span className="text-tf-app-muted">{formatKickoff(m.kickoffAt)}</span>
                      {m.status === 'live' ? (
                        <span className="ml-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                          LIVE
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 truncate font-display text-sm font-black text-tf-app-fg">
                      {m.home.name} <span className="text-tf-app-muted">vs</span> {m.away.name}
                    </div>
                    <div className="text-[10px] font-medium text-tf-app-muted">
                      {m.competition.shortName ?? m.competition.name}
                      {nations.length > 1 ? ' · Choc tes sélections' : ''}
                    </div>
                  </div>
                  <span aria-hidden className="text-xs font-black text-tf-app-muted">→</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
