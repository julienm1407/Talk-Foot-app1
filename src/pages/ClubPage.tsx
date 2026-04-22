import { useMemo, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { getClubPageMock } from '../data/clubPageMock'
import { useSupporterGroups } from '../hooks/useSupporterGroups'
import { usePageSeo } from '../hooks/usePageSeo'
import { SITE_NAME } from '../seo/siteCopy'
import { findTeamById, resolveClubIdFromSlug } from '../utils/clubRoute'
import { countSalonChannelsForClub, getGroupsForClubPage } from '../utils/groupsForClubPage'
import { cn } from '../utils/cn'
import { ClubDataBar } from '../components/club-page/ClubDataBar'
import { ClubInfoDrawer } from '../components/club-page/ClubInfoDrawer'
import { ClubPageGrid } from '../components/club-page/ClubPageGrid'
import { ClubPageHero } from '../components/club-page/ClubPageHero'

export function ClubPage() {
  const { clubSlug = '' } = useParams()
  const { pathname } = useLocation()
  const [infoOpen, setInfoOpen] = useState(false)

  const team = useMemo(() => {
    const id = resolveClubIdFromSlug(clubSlug)
    if (!id) return null
    return findTeamById(id)
  }, [clubSlug])

  const data = useMemo(() => (team ? getClubPageMock(team) : null), [team])
  const { groups } = useSupporterGroups()
  const clubGroups = useMemo(
    () => (team ? getGroupsForClubPage(team.id, groups, 6) : []),
    [team, groups],
  )
  const salonChannelCount = useMemo(
    () => (team ? countSalonChannelsForClub(team.id, groups) : 0),
    [team, groups],
  )

  usePageSeo(
    pathname,
    team
      ? {
          title: `${team.name} — hub & communauté — ${SITE_NAME}`,
          description: `Hub social ${team.shortName} : salons live, débats, voix, fans. Infos match en second plan.`,
          robots: 'noindex, nofollow',
        }
      : 'skip',
  )

  if (!team || !data) {
    return <Navigate to="/" replace />
  }

  return (
    <div
      className={cn(
        'min-w-0 overflow-x-hidden bg-[#030712] pb-2',
        data.onFire && 'shadow-[inset_0_0_80px_rgba(251,191,36,0.06)]',
        data.matchMode && 'ring-1 ring-rose-500/10',
      )}
    >
      <ClubPageHero team={team} data={data} />
      <ClubDataBar
        data={data}
        onOpenInfo={() => setInfoOpen(true)}
        matchMode={data.matchMode}
        onFire={data.onFire}
        salonChannelCount={salonChannelCount}
        salonsHubTo={`/groups?tab=discover&club=${encodeURIComponent(team.id)}`}
        salonClubName={team.shortName}
      />
      <ClubPageGrid team={team} data={data} matchMode={data.matchMode} clubGroups={clubGroups} />
      <ClubInfoDrawer
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        data={data}
        clubName={team.shortName}
      />
    </div>
  )
}
