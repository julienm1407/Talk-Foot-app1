import { themeForCompetition } from '../../data/competitionThemes'
import { cn } from '../../utils/cn'

/** Dégradés discrets par type d’encart (accueil hub) */
const PRESET_GRADIENT: Record<
  'live' | 'upcoming' | 'nav' | 'debate' | 'tribune' | 'personal',
  string
> = {
  live: 'linear-gradient(90deg, #fb7185 0%, #f97316 45%, #fbbf24 100%)',
  upcoming: 'linear-gradient(90deg, #38bdf8 0%, #22d3ee 50%, #0ea5e9 100%)',
  nav: 'linear-gradient(90deg, #0ea5e9 0%, #2563eb 55%, #0369a1 100%)',
  debate: 'linear-gradient(90deg, #fb923c 0%, #f97316 40%, #e11d48 100%)',
  tribune: 'linear-gradient(90deg, #a855f7 0%, #6366f1 50%, #4f46e5 100%)',
  personal: 'linear-gradient(90deg, #2dd4bf 0%, #14b8a6 50%, #0d9488 100%)',
}

/**
 * Fine bande supérieure colorée pour rappeler le thème de l’encart (compétition ou preset).
 */
export function HubEncartTopAccent({
  appearance,
  preset,
  competitionId,
  className,
}: {
  appearance: 'light' | 'dark'
  preset?: keyof typeof PRESET_GRADIENT
  competitionId?: string
  className?: string
}) {
  const th = competitionId ? themeForCompetition(competitionId) : null
  const background = th
    ? `linear-gradient(90deg, ${th.accent2} 0%, ${th.accent} 48%, ${th.accent2} 100%)`
    : preset
      ? PRESET_GRADIENT[preset]
      : undefined
  if (!background) return null

  return (
    <div
      className={cn(
        'h-[3px] w-full shrink-0',
        appearance === 'light' ? 'opacity-[0.88]' : 'opacity-[0.95]',
        className,
      )}
      style={{ background }}
      aria-hidden
    />
  )
}
