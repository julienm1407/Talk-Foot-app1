import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import { useLiveEncartSimulation } from '../../hooks/useLiveEncartSimulation'
import { useAppearance } from '../../contexts/AppearanceContext'
import { cn } from '../../utils/cn'
import { HubEncartTopAccent } from '../ui/HubEncartTopAccent'
import { LiveMatchHero } from './LiveMatchHero'
import { MatchSpotlightCard } from '../match/MatchSpotlightCard'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

/** Encart unique épinglé en haut de l’accueil. */
export function MatchTalkFootDuJour({
  match,
  className,
}: {
  match: Match
  className?: string
}) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const simulation = useLiveEncartSimulation(match)
  const live = match.status === 'live'

  return (
    <section
      className={cn('min-w-0 space-y-2', className)}
      aria-labelledby="tf-match-du-jour-heading"
    >
      <HubEncartTopAccent appearance={appearance} preset={live ? 'live' : 'upcoming'} />
      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-tf-app-muted">
            Talk Foot
          </p>
          <h2
            id="tf-match-du-jour-heading"
            className="font-display text-lg font-black tracking-tight text-tf-app-fg sm:text-xl"
          >
            Match Talk Foot du jour
          </h2>
        </div>
        <Link
          to={`/channel/${match.id}`}
          className={cn(TF_FOCUS_VISIBLE, 'text-[11px] font-black text-sky-400 hover:underline')}
        >
          {live ? 'Rejoindre le tchat' : 'Ouvrir le salon'}
        </Link>
      </div>
      {live ? (
        <LiveMatchHero match={match} simulation={simulation} />
      ) : (
        <div
          className={cn(
            'overflow-hidden rounded-2xl border',
            L ? 'border-tf-dark/10 bg-white/90' : 'border-white/12 bg-white/[0.04]',
          )}
        >
          <MatchSpotlightCard match={match} className="min-h-0 w-full min-w-0" />
        </div>
      )}
    </section>
  )
}
