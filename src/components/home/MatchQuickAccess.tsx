import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import { HubRailRowLive, HubRailRowUpcoming } from '../match/HubMatchEncart'

export function MatchQuickAccess({
  matches,
  clubFocusIds = null,
}: {
  matches: Match[]
  /** Mode supporter : matchs impliquant au moins un de ces clubs */
  clubFocusIds?: string[] | null
}) {
  const { liveMatches, upcomingMatches } = useMemo(() => {
    const pool =
      clubFocusIds != null && clubFocusIds.length > 0
        ? (() => {
            const mine = matches.filter((m) =>
              clubFocusIds.some((id) => m.home.id === id || m.away.id === id),
            )
            return mine.length > 0 ? mine : matches
          })()
        : matches
    const live = pool.filter((m) => m.status === 'live')
    const upcoming = pool
      .filter((m) => m.status === 'upcoming')
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
      .slice(0, 3)
    return { liveMatches: live, upcomingMatches: upcoming }
  }, [matches, clubFocusIds])

  return (
    <div className="flex h-full flex-col gap-3">
      <h3 className="font-display text-lg font-black tracking-tight text-tf-dark">
        {clubFocusIds != null && clubFocusIds.length > 0 ? 'Tes clubs en direct' : 'Accès rapide'}
      </h3>

      {liveMatches.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#030b18]/95 shadow-[0_18px_52px_rgba(0,0,0,0.42)] ring-1 ring-white/10">
          <div className="border-b border-white/10 px-3 py-2 sm:px-4">
            <div className="flex items-center gap-2">
              <span
                className="flex h-2 w-2 animate-pulse rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.85)]"
                aria-hidden
              />
              <h4 className="text-sm font-black uppercase tracking-[0.12em] text-white">En direct</h4>
            </div>
          </div>
          <div className="space-y-2 p-2.5 sm:p-3">
            {liveMatches.map((m) => (
              <HubRailRowLive key={m.id} match={m} />
            ))}
          </div>
        </div>
      )}

      {upcomingMatches.length > 0 && (
        <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#030b18]/95 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <div className="border-b border-white/10 px-2.5 py-1.5 sm:px-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-white">À venir</h4>
          </div>
          <ul className="space-y-2 p-2 sm:p-2.5" role="list">
            {upcomingMatches.map((m) => (
              <li key={m.id}>
                <HubRailRowUpcoming match={m} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        to="/calendar"
        className="mt-auto rounded-xl border border-tf-grey-pastel/50 bg-tf-white px-3 py-2 text-center transition hover:border-tf-grey-pastel/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-grey/25"
      >
        <span className="text-sm font-bold text-tf-dark">Voir le calendrier</span>
      </Link>
    </div>
  )
}
