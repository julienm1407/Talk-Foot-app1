import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import { MatchSpotlightCard } from '../match/MatchSpotlightCard'
import { useAppearance } from '../../contexts/AppearanceContext'
import { HubEncartTopAccent } from '../ui/HubEncartTopAccent'

/**
 * Encart principal quand **aucun live** : même emplacement que `LiveMatchHero` — premier match en
 * `MatchSpotlightCard`, les suivants en bandeaux. Dès qu’un live existe, la page parent bascule sur le hero live.
 */
export function HomeUpcomingHero({
  matches,
  /** Nombre max de matchs : 1 carte « à l’affiche » + 2 bandeaux (aligné sur le hub live : 1 + 2). */
  maxVisible = 3,
}: {
  matches: Match[]
  maxVisible?: number
}) {
  const { appearance } = useAppearance()
  if (matches.length === 0) return null

  const list = matches.slice(0, Math.max(1, maxVisible))
  const [featured, ...rest] = list

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-sky-400/25 shadow-[0_8px_28px_rgba(14,165,233,0.12)] sm:rounded-3xl"
      aria-label="Prochains matchs"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-tf-night via-tf-dark to-black"
        aria-hidden
      />
      <div className="relative z-[1]">
        <HubEncartTopAccent appearance={appearance} preset="upcoming" />
        <div className="border-b border-white/10 px-3 py-2 sm:px-4 sm:py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-black text-white sm:text-lg">Prochains matchs</h2>
              <span className="rounded-md bg-sky-600 px-1.5 py-0.5 text-[9px] font-black uppercase text-white ring-1 ring-sky-400/45">
                À venir
              </span>
            </div>
            <Link
              to="/match"
              className="text-[10px] font-black text-sky-300 hover:text-sky-200 hover:underline sm:text-xs"
            >
              Voir tout
            </Link>
          </div>
        </div>
        <div className="min-w-0 space-y-3 p-3 sm:space-y-4 sm:p-4">
          {featured ? (
            <div className="min-w-0">
              <MatchSpotlightCard match={featured} className="min-h-0 w-full min-w-0" />
            </div>
          ) : null}
          {rest.length > 0 ? (
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5">
              {rest.map((m) => (
                <MatchSpotlightCard key={m.id} match={m} density="grid" className="min-h-0 min-w-0" />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
