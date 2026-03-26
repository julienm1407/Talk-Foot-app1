import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMatches } from '../contexts/MatchesContext'
import { useFanPreferences } from '../contexts/FanPreferencesContext'
import { Card } from '../components/ui/Card'
import { MatchCarousel } from '../components/match/MatchCarousel'
import { MatchQuickAccess } from '../components/home/MatchQuickAccess'
import { Button } from '../components/ui/Button'
import { useSupporterTintMode } from '../hooks/useSupporterTintMode'
import { ALL_CLUBS_BY_ID } from '../data/allClubsCatalog'
import { FavoritesEncart } from '../components/fan/FavoritesEncart'
import { SectionIntro } from '../components/ui/SectionIntro'

export function MatchesPage() {
  const { carouselMatches, loading } = useMatches()
  const { favoriteClubIds } = useFanPreferences()
  const { supporterTintActive, team } = useSupporterTintMode()

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
      <FavoritesEncart />
      <SectionIntro
        section="matches"
        titleAs="h1"
        uppercaseTitle={false}
        eyebrow="Matchs"
        title="Live & calendrier"
        description="Accède aux salons, avant-matchs et replays. L’agenda détaillé reste disponible."
        actions={
          <Link to="/calendar">
            <Button variant="soft" className="rounded-2xl">
              Ouvrir l’agenda complet
            </Button>
          </Link>
        }
      />

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
              matches={carouselMatches}
              eyebrow={supporterTintActive && clubFocusLabel ? `Tes clubs · ${clubFocusLabel}` : 'LIVE & À VENIR'}
              title={supporterTintActive && clubFocusLabel ? `À l’affiche (${clubFocusLabel})` : 'Tous les matchs'}
              titleId="matches-page-heading"
              subtitle={
                supporterTintActive && team
                  ? `Tous les matchs affichés — raccourci à gauche : ${clubFocusLabel || team.name}.`
                  : 'Avant le coup d’envoi : avant-match uniquement ; en direct : accès live.'
              }
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
