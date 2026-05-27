import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMatches } from '../contexts/MatchesContext'
import { useSupporterGroups } from '../hooks/useSupporterGroups'
import { salonsForMatch } from '../utils/matchSalons'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ChannelHeader } from '../components/channel/ChannelHeader'
import { StadiumTribunes } from '../components/channel/StadiumTribunes'
import { MatchSalonsModal } from '../components/channel/MatchSalonsModal'
import { useMatchStadiumGroup } from '../hooks/useMatchStadiumGroup'

export function ChannelStadiumPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromSalonEntry = searchParams.get('salons') === '1'
  const { matches } = useMatches()
  const match = useMemo(
    () => matches.find((m) => m.id === matchId) ?? null,
    [matches, matchId],
  )
  const { stadiumGroupId, setStadiumGroup } = useMatchStadiumGroup(matchId)
  const { groups: supporterGroups } = useSupporterGroups()
  const matchSalonPicks = useMemo(
    () => (match ? salonsForMatch(match, supporterGroups) : []),
    [match, supporterGroups],
  )
  const [salonModalOpen, setSalonModalOpen] = useState(false)

  if (!match || !matchId) {
    return (
      <Card className="p-6">
        <div className="font-display text-lg font-black tracking-tight text-tf-dark">
          Stade introuvable
        </div>
        <div className="mt-2 text-sm font-medium text-tf-grey">
          Ce match n’existe pas dans les données de test.
        </div>
        <Link to="/match" className="mt-4 inline-block text-sm font-black text-tf-electric">
          ← Retour aux matchs
        </Link>
      </Card>
    )
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-2 sm:max-w-4xl sm:gap-3">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <Link
          to={`/channel/${matchId}`}
          className="text-xs font-black text-tf-electric underline decoration-2 underline-offset-2 sm:text-sm"
        >
          {match.status === 'live' ? '← Retour au live' : '← Retour à la tribune'}
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link to={`/channel/${matchId}`}>
            <Button variant="primary" className="h-9 px-3 text-xs sm:h-10 sm:text-sm">
              {match.status === 'live'
                ? 'Rejoindre le live'
                : match.status === 'upcoming'
                  ? 'Avant-match'
                  : 'Tribune match'}
            </Button>
          </Link>
          {fromSalonEntry ? (
            <Button
              type="button"
              variant="soft"
              className="h-9 px-3 text-xs sm:h-10 sm:text-sm"
              onClick={() => setSalonModalOpen(true)}
            >
              Tribunes du match
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-tf-grey-pastel/50 bg-tf-white shadow-sm">
        <div className="shrink-0 border-b border-tf-grey-pastel/50 px-3 py-2 sm:px-4 sm:py-2.5">
          <ChannelHeader match={match} />
        </div>
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
          <StadiumTribunes
            match={match}
            layout="stadiumPage"
            salonPicks={matchSalonPicks}
            selectedGroupId={stadiumGroupId}
            onSelectGroup={(id) => {
              setStadiumGroup(id)
              navigate(`/channel/${matchId}`)
            }}
          />
        </div>
      </div>

      <MatchSalonsModal
        open={salonModalOpen}
        onClose={() => setSalonModalOpen(false)}
        match={match}
        picks={matchSalonPicks}
      />
    </div>
  )
}
