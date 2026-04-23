import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { API_TOKENS_CHANGED_EVENT, LS_KEY_SPORTMONKS_TOKEN } from '../constants/apiKeysStorage'
import {
  fetchSportMonksTeamSchedule,
  findNextClubMatchFromSchedule,
  lastFiveFormFromTeamSchedule,
} from '../api/sportMonks'
import { getClubPageMock } from '../data/clubPageMock'
import type { ClubPageMock } from '../data/clubPageMock'
import { useMatches } from '../contexts/MatchesContext'
import { useSupporterGroups } from '../hooks/useSupporterGroups'
import { usePageSeo } from '../hooks/usePageSeo'
import { SITE_NAME } from '../seo/siteCopy'
import { SPORTMONKS_TEAM_ID_BY_CLUB_ID } from '../data/sportMonksKnownTeamIds'
import { findTeamById, resolveClubIdFromSlug } from '../utils/clubRoute'
import { countSalonChannelsForClub, getGroupsForClubPage } from '../utils/groupsForClubPage'
import { cn } from '../utils/cn'
import { ClubDataBar } from '../components/club-page/ClubDataBar'
import { ClubInfoDrawer } from '../components/club-page/ClubInfoDrawer'
import { ClubPageGrid } from '../components/club-page/ClubPageGrid'
import { ClubPageHero } from '../components/club-page/ClubPageHero'
import { getSportMonksToken } from '../utils/apiTokens'
import { formatKickoff } from '../utils/time'

export function ClubPage() {
  const { clubSlug = '' } = useParams()
  const { pathname } = useLocation()
  const [infoOpen, setInfoOpen] = useState(false)
  const { sportMonksTeamIdByClubId } = useMatches()
  const [smScheduleUi, setSmScheduleUi] = useState<{
    upcoming: ClubPageMock['upcoming'] | null
    formStrip: Array<'V' | 'N' | 'D'> | null
  } | null>(null)
  /** Pourquoi l’encart reste en démo (token, CORS, 401, etc.). */
  const [clubScheduleHint, setClubScheduleHint] = useState<string | null>(null)
  const scheduleFetchSeq = useRef(0)
  /** Incrémenté quand la clé SportMonks change (localStorage / autre onglet) pour relancer le schedule. */
  const [smTokenTick, setSmTokenTick] = useState(0)

  useEffect(() => {
    const bump = () => setSmTokenTick((n) => n + 1)
    window.addEventListener(API_TOKENS_CHANGED_EVENT, bump)
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY_SPORTMONKS_TOKEN || e.key === null) bump()
    }
    window.addEventListener('storage', onStorage)
    let tabWasHidden = document.visibilityState === 'hidden'
    const onVis = () => {
      if (document.visibilityState === 'hidden') tabWasHidden = true
      else if (document.visibilityState === 'visible' && tabWasHidden) {
        tabWasHidden = false
        bump()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener(API_TOKENS_CHANGED_EVENT, bump)
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  const team = useMemo(() => {
    const id = resolveClubIdFromSlug(clubSlug)
    if (!id) return null
    return findTeamById(id)
  }, [clubSlug])

  const dataBase = useMemo(() => (team ? getClubPageMock(team) : null), [team])

  const smTeamId = team
    ? sportMonksTeamIdByClubId[team.id] ?? SPORTMONKS_TEAM_ID_BY_CLUB_ID[team.id]
    : undefined

  useEffect(() => {
    if (!team || smTeamId == null) {
      setSmScheduleUi(null)
      setClubScheduleHint(null)
      return
    }
    const token = getSportMonksToken()
    if (!token) {
      setSmScheduleUi(null)
      setClubScheduleHint(
        'Jeton SportMonks introuvable dans ce navigateur : menu Profil → Données, ou variable VITE_SPORTMONKS_TOKEN + redémarrage de `npm run dev`.',
      )
      return
    }
    const seq = ++scheduleFetchSeq.current
    setClubScheduleHint(null)
    setSmScheduleUi(null)
    let cancelled = false
    void fetchSportMonksTeamSchedule(token, smTeamId)
      .then((json) => {
        if (cancelled || seq !== scheduleFetchSeq.current) return
        const smOpts = { sportMonksTeamId: smTeamId }
        const next = findNextClubMatchFromSchedule(json, team.id, smOpts)
        const formStrip = lastFiveFormFromTeamSchedule(json, team.id, smOpts)
        setClubScheduleHint(null)
        setSmScheduleUi({
          upcoming: next
            ? {
                league: next.league,
                matchday: next.matchday,
                opponent: next.opponent,
                kickoff: formatKickoff(next.kickoffIso),
                venue: next.venue,
              }
            : null,
          formStrip,
        })
      })
      .catch((err: unknown) => {
        if (cancelled || seq !== scheduleFetchSeq.current) return
        const msg = err instanceof Error ? err.message : String(err)
        setClubScheduleHint(
          `Impossible de charger le calendrier SportMonks (${msg}). L’encart reste en démo.`,
        )
        setSmScheduleUi(null)
      })
    return () => {
      cancelled = true
    }
  }, [team, smTeamId, smTokenTick])

  const data = useMemo(() => {
    if (!dataBase) return null
    if (!smScheduleUi) return dataBase
    let out: ClubPageMock = { ...dataBase }
    if (smScheduleUi.upcoming) out = { ...out, upcoming: smScheduleUi.upcoming }
    if (smScheduleUi.formStrip?.length) {
      out = { ...out, formStrip: smScheduleUi.formStrip, formStripFromApi: true }
    }
    return out
  }, [dataBase, smScheduleUi])
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
      <ClubPageGrid
        team={team}
        data={data}
        matchMode={data.matchMode}
        clubGroups={clubGroups}
        clubScheduleHint={clubScheduleHint}
      />
      <ClubInfoDrawer
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        data={data}
        clubName={team.shortName}
      />
    </div>
  )
}
