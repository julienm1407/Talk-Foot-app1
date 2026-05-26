import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMatches } from '../../contexts/MatchesContext'
import { matchCalendarDayKeyParis, formatKickoff } from '../../utils/time'
import { WC_2026_COMP_ID } from '../../utils/seasonMode'
import { cn } from '../../utils/cn'
import { useFavoriteNationsLookup } from '../../hooks/useFavoriteNationsMatches'

/**
 * Bandeau « Matchs CDM du jour » — vu sur la home en mode CDM.
 *
 * Filtre `MatchesContext` sur la compétition `wc-2026` et ne garde que les matchs
 * du jour civil Paris (live + à venir). Si aucun, on affiche un message d'attente.
 */
export function CdmTodayMatches() {
  const { matches, loading } = useMatches()
  const { matchTeam } = useFavoriteNationsLookup()

  const todays = useMemo(() => {
    const todayKey = matchCalendarDayKeyParis(new Date())
    return matches
      .filter((m) => m.competition.id === WC_2026_COMP_ID)
      .filter((m) => matchCalendarDayKeyParis(m.kickoffAt) === todayKey)
      .sort((a, b) => Date.parse(a.kickoffAt) - Date.parse(b.kickoffAt))
  }, [matches])

  return (
    <section
      aria-label="Matchs Coupe du Monde du jour"
      className={cn(
        'rounded-tf-xl border border-tf-c30-border bg-tf-c30-surface p-3 shadow-tf-elev-1 sm:p-4',
      )}
    >
      <header className="flex items-end justify-between px-1 pb-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-tf-cdm-gold">
            Aujourd'hui · CDM 2026
          </p>
          <h2 className="font-display text-lg font-black tracking-tight text-tf-app-fg sm:text-xl">
            Matchs du jour
          </h2>
        </div>
        <Link
          to="/match"
          className="text-xs font-black uppercase tracking-wide text-tf-cdm-gold hover:underline"
        >
          Calendrier →
        </Link>
      </header>

      {loading && todays.length === 0 ? (
        <p className="rounded-xl border border-dashed border-tf-c30-border/80 px-3 py-6 text-center text-sm font-bold text-tf-app-muted">
          Chargement…
        </p>
      ) : todays.length === 0 ? (
        <p className="rounded-xl border border-dashed border-tf-c30-border/80 px-3 py-6 text-center text-sm font-bold text-tf-app-muted">
          Aucun match Coupe du Monde aujourd'hui. Reviens demain ou consulte le calendrier complet.
        </p>
      ) : (
        <ul className="grid gap-2">
          {todays.map((m) => {
            const favHome = matchTeam(m.home.name)
            const favAway = matchTeam(m.away.name)
            const isFav = Boolean(favHome || favAway)
            return (
            <li key={m.id}>
              <Link
                to={`/channel/${encodeURIComponent(m.id)}`}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-xl border border-tf-c30-border bg-white/[0.04] px-3 py-2.5 transition',
                  'hover:border-tf-cdm-gold/55 hover:bg-white/[0.08]',
                  m.status === 'live' ? 'ring-1 ring-rose-400/45' : null,
                  isFav && m.status !== 'live'
                    ? 'border-tf-cdm-gold/60 bg-tf-cdm-gold/[0.07] ring-1 ring-tf-cdm-gold/40'
                    : null,
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {m.status === 'live' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                        <span aria-hidden className="h-1 w-1 animate-pulse rounded-full bg-white" />
                        Live · {m.minute ?? 0}'
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider text-tf-app-muted">
                        {formatKickoff(m.kickoffAt)}
                      </span>
                    )}
                    {isFav ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full border border-tf-cdm-gold/60 bg-tf-cdm-gold/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-tf-cdm-gold"
                        title="Une de tes sélections favorites joue"
                      >
                        <span aria-hidden>★</span>
                        Ma sélection
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 truncate font-display text-sm font-black text-tf-app-fg">
                    <span className={favHome ? 'text-tf-cdm-gold' : undefined}>{m.home.name}</span>{' '}
                    <span className="text-tf-app-muted">vs</span>{' '}
                    <span className={favAway ? 'text-tf-cdm-gold' : undefined}>{m.away.name}</span>
                  </div>
                </div>
                {m.score ? (
                  <div className="font-display text-xl font-black tabular-nums text-tf-app-fg">
                    {m.score.home}–{m.score.away}
                  </div>
                ) : (
                  <div className="text-xs font-black uppercase tracking-wide text-tf-cdm-gold">
                    Salon →
                  </div>
                )}
              </Link>
            </li>
          )
          })}
        </ul>
      )}
    </section>
  )
}
