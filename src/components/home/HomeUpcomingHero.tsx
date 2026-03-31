import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import { HubStripUpcoming } from '../match/HubMatchEncart'
import { useAppearance } from '../../contexts/AppearanceContext'
import { HubEncartTopAccent } from '../ui/HubEncartTopAccent'

/** Bloc « prochains matchs » : grille de bandeaux (même DA que le hub), hiérarchie lisible. */
export function HomeUpcomingHero({
  matches,
  maxVisible = 3,
}: {
  matches: Match[]
  maxVisible?: number
}) {
  const { appearance } = useAppearance()
  if (matches.length === 0) return null

  const list = matches.slice(0, maxVisible)

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-sky-400/25 shadow-[0_8px_28px_rgba(14,165,233,0.12)] sm:rounded-3xl"
      aria-label="Prochains matchs"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-tf-night via-tf-dark to-black" aria-hidden />
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
            <Link to="/match" className="text-[10px] font-black text-sky-300 hover:text-sky-200 hover:underline sm:text-xs">
              Voir tout
            </Link>
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3">
          {list.map((m) => (
            <HubStripUpcoming key={m.id} match={m} className="min-w-0" />
          ))}
        </div>
      </div>
    </section>
  )
}
