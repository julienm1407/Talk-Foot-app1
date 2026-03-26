import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import { cn } from '../../utils/cn'
import { HubStripUpcoming } from '../match/HubMatchEncart'

/** Même emplacement que le hero live (responsive) — cartes identiques au hub desktop. */
export function HomeUpcomingHero({ matches }: { matches: Match[] }) {
  if (matches.length === 0) return null

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-sky-400/25 shadow-[0_16px_48px_rgba(14,165,233,0.15)]"
      aria-label="Prochains matchs"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-tf-night via-tf-dark to-black" aria-hidden />
      <div className="relative border-b border-white/10 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-black text-white">Prochains matchs</h2>
            <span className="rounded-md bg-sky-600 px-2 py-0.5 text-[10px] font-black uppercase text-white ring-1 ring-sky-400/45">
              À venir
            </span>
          </div>
          <Link to="/matches" className="text-xs font-black text-sky-300 hover:text-sky-200 hover:underline">
            Voir tout
          </Link>
        </div>
      </div>
      <div
        className={cn(
          'relative flex gap-3 overflow-x-auto px-3 pb-4 pt-3 sm:gap-4 sm:px-4',
          '[scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25',
        )}
      >
        {matches.map((m) => (
          <HubStripUpcoming key={m.id} match={m} className="min-w-[280px] max-w-[300px]" />
        ))}
      </div>
    </section>
  )
}
