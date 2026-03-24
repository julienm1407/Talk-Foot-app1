import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMatches } from '../contexts/MatchesContext'
import { useFanPreferences } from '../contexts/FanPreferencesContext'
import { Card } from '../components/ui/Card'
import { MatchCarousel } from '../components/match/MatchCarousel'
import { MatchQuickAccess } from '../components/home/MatchQuickAccess'
import { Button } from '../components/ui/Button'
import {
  filterMatchesForSupporterClub,
  filterMatchesForSupporterClubs,
} from '../utils/supporterMode'
import { useSupporterTintMode } from '../hooks/useSupporterTintMode'
import { ALL_CLUBS_BY_ID } from '../data/allClubsCatalog'

export function MatchesPage() {
  const { carouselMatches, loading } = useMatches()
  const { favoriteClubIds } = useFanPreferences()
  const { supporterTintActive, team } = useSupporterTintMode()

  const displayMatches = useMemo(() => {
    if (!supporterTintActive || favoriteClubIds.length === 0) return carouselMatches
    if (favoriteClubIds.length === 1) {
      return filterMatchesForSupporterClub(carouselMatches, favoriteClubIds[0])
    }
    return filterMatchesForSupporterClubs(carouselMatches, favoriteClubIds)
  }, [carouselMatches, supporterTintActive, favoriteClubIds])

  const clubFocusLabel = useMemo(() => {
    if (favoriteClubIds.length === 0) return ''
    return favoriteClubIds
      .map((id) => ALL_CLUBS_BY_ID[id]?.shortName ?? id)
      .join(' · ')
  }, [favoriteClubIds])

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-sm font-semibold text-tf-grey">Chargement des matchs…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-black tracking-[0.2em] text-tf-grey">MATCHS</p>
        <h1 className="font-display text-2xl font-black tracking-tight text-tf-dark sm:text-3xl">
          Live & calendrier
        </h1>
        <p className="mt-1 text-sm font-semibold text-tf-grey">
          Accède aux salons, avant-matchs et replays. L’agenda détaillé reste disponible.
        </p>
        <div className="mt-4">
          <Link to="/calendar">
            <Button variant="soft" className="rounded-2xl">
              Ouvrir l’agenda complet
            </Button>
          </Link>
        </div>
      </header>

      <Card className="overflow-visible p-4 sm:p-5" elevation="soft">
        <div className="grid gap-3 md:grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr] lg:items-start">
          <aside
            className="min-w-0 max-h-[280px] overflow-y-auto sm:max-h-[320px] lg:max-h-[300px]"
            aria-label="Accès rapide aux matchs"
          >
            <MatchQuickAccess
              matches={carouselMatches}
              clubFocusIds={
                supporterTintActive && favoriteClubIds.length > 0 ? favoriteClubIds : null
              }
            />
          </aside>
          <div className="min-w-0">
            <MatchCarousel
              matches={displayMatches}
              eyebrow={supporterTintActive && clubFocusLabel ? `FOCUS ${clubFocusLabel}` : 'LIVE & À VENIR'}
              title={supporterTintActive && clubFocusLabel ? `Matchs ${clubFocusLabel}` : 'Tous les matchs'}
              titleId="matches-page-heading"
              subtitle={
                supporterTintActive && team
                  ? `Priorité aux matchs de ${clubFocusLabel || team.name}.`
                  : 'Rejoindre le live ou l’avant-match depuis chaque carte.'
              }
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
