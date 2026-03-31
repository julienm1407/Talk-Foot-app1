import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import { AdSlot } from '../ui/AdSlot'
import { HubStripFinished, HubStripUpcoming } from '../match/HubMatchEncart'

const hubListShell =
  'rounded-2xl border border-white/10 bg-[#030b18]/95 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:p-4'

export function HomeLeftColumn({
  upcomingPool,
  resultsPool,
  omitUpcoming = false,
}: {
  upcomingPool: Match[]
  resultsPool: Match[]
  /** Sur l’accueil : le hero couvre déjà les prochains matchs */
  omitUpcoming?: boolean
}) {
  const upcoming = useMemo(() => {
    return [...upcomingPool]
      .filter((m) => m.status === 'upcoming')
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
      .slice(0, 4)
  }, [upcomingPool])

  const results = useMemo(() => {
    const fin = resultsPool.filter((m) => m.status === 'finished' && m.score)
    return [...fin]
      .sort((a, b) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime())
      .slice(0, 3)
  }, [resultsPool])

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {!omitUpcoming ? (
        <>
          <div className={hubListShell}>
            <h3 className="border-b border-white/10 pb-2 font-display text-xs font-black uppercase tracking-[0.18em] text-white">
              Matchs à venir
            </h3>
            <ul className="mt-3 space-y-3" role="list">
              {upcoming.length === 0 ? (
                <li className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-4 text-center text-xs font-semibold text-tf-app-muted">
                  Aucun match à venir dans la fenêtre affichée.
                </li>
              ) : (
                upcoming.map((m) => (
                  <li key={m.id}>
                    <HubStripUpcoming match={m} className="max-w-full" />
                  </li>
                ))
              )}
            </ul>
            <Link
              to="/match"
              className="mt-3 block rounded-lg border border-white/15 py-2 text-center text-[11px] font-black text-sky-300 transition hover:border-sky-400/40 hover:bg-white/[0.06]"
            >
              Calendrier
            </Link>
          </div>

          <AdSlot
            compact
            tone="sky"
            brand="Matchs & billets"
            body="Encart colonne gauche — mock calendrier / billetterie."
            imageSeed="home-left-mid"
          />
        </>
      ) : null}

      <div className={hubListShell}>
        <h3 className="border-b border-white/10 pb-2 font-display text-xs font-black uppercase tracking-[0.18em] text-white">
          Derniers résultats
        </h3>
        <ul className="mt-3 space-y-3" role="list">
          {results.length === 0 ? (
            <li className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-4 text-center text-xs font-semibold text-tf-app-muted">
              Pas encore de matchs terminés dans les données chargées.
            </li>
          ) : (
            results.map((m) => (
              <li key={m.id}>
                <HubStripFinished match={m} className="max-w-full" />
              </li>
            ))
          )}
        </ul>
        {omitUpcoming ? (
          <Link
            to="/match"
            className="mt-3 block rounded-lg border border-white/15 py-2 text-center text-[11px] font-black text-sky-300 transition hover:border-sky-400/40 hover:bg-white/[0.06]"
          >
            Calendrier
          </Link>
        ) : null}
      </div>
    </div>
  )
}
