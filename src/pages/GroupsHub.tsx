import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useSupporterGroups } from '../hooks/useSupporterGroups'
import { GroupCard } from '../components/group/GroupCard'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useFanPreferences } from '../contexts/FanPreferencesContext'
import { sortGroupsByFanAffinity, getGroupAccess } from '../utils/groupAccess'
import { CreateGroupModal } from '../components/group/CreateGroupModal'
import { SectionIntro } from '../components/ui/SectionIntro'
import { cn } from '../utils/cn'
import {
  groupMatchesInterestTokens,
  normalizeHashtag,
  parseHashtagInput,
} from '../utils/groupHashtags'

type HubTab = 'mine' | 'discover'

export function GroupsHubPage() {
  const navigate = useNavigate()
  const { groups, createGroup, joinGroup, isJoined } = useSupporterGroups()
  const {
    favoriteClubIds,
    favoriteLeagueId,
    hideRivalSalons,
  } = useFanPreferences()
  const [createOpen, setCreateOpen] = useState(false)
  const [interestFilter, setInterestFilter] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  const tabParam = searchParams.get('tab')
  const activeTab: HubTab =
    tabParam === 'discover' || tabParam === 'mine' ? tabParam : 'mine'

  const setTab = (t: HubTab) => {
    setSearchParams(t === 'mine' ? {} : { tab: 'discover' }, { replace: true })
  }

  const accessPrefs = useMemo(
    () => ({
      favoriteClubIds,
      favoriteLeagueId,
      hideRivalSalons,
    }),
    [favoriteClubIds, favoriteLeagueId, hideRivalSalons],
  )

  const sorted = useMemo(
    () => sortGroupsByFanAffinity(groups, accessPrefs),
    [groups, accessPrefs],
  )

  const visibleDiscover = useMemo(
    () => sorted.filter((g) => getGroupAccess(g, accessPrefs) !== 'hidden'),
    [sorted, accessPrefs],
  )

  const myGroups = useMemo(() => {
    return visibleDiscover.filter(
      (g) => isJoined(g.id) || g.createdBy === 'me',
    )
  }, [visibleDiscover, isJoined])

  const discoverFiltered = useMemo(() => {
    const q = interestFilter.trim()
    if (!q) return visibleDiscover
    const tokens = parseHashtagInput(q)
    const effective =
      tokens.length > 0
        ? tokens
        : (() => {
            const one = normalizeHashtag(q)
            return one ? [one] : []
          })()
    if (effective.length === 0) return visibleDiscover
    return visibleDiscover.filter((g) =>
      groupMatchesInterestTokens(g, effective),
    )
  }, [visibleDiscover, interestFilter])

  const tabBtn = (t: HubTab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(t)}
      className={cn(
        'tf-interactive-press min-h-11 flex-1 rounded-2xl px-4 py-2.5 text-center text-xs font-black sm:min-h-0 sm:flex-none sm:px-6 sm:text-sm',
        activeTab === t
          ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-violet-400/45'
          : 'bg-tf-grey-pastel/30 text-tf-dark hover:bg-violet-50/80 hover:text-tf-dark',
      )}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-6">
      <SectionIntro
        section="groups"
        titleAs="h1"
        uppercaseTitle={false}
        eyebrow="Groupes"
        title="Salons supporters"
        description={
          <>
            <strong className="text-tf-dark">Mes groupes</strong> regroupe tout ce que tu as rejoint ; explore le
            reste dans <strong className="text-tf-dark">Tous les salons</strong>.
          </>
        }
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Link
              to="/debates"
              className="tf-interactive-press inline-flex min-h-11 items-center justify-center rounded-3xl border-2 border-violet-300/55 bg-violet-50/90 px-4 text-xs font-black text-tf-dark shadow-sm hover:bg-violet-100 sm:px-5 sm:text-sm"
            >
              💬 Débats
            </Link>
            <Button
              variant="primary"
              className="tf-interactive-press shrink-0 rounded-3xl px-5"
              onClick={() => setCreateOpen(true)}
            >
              ➕ Créer un groupe
            </Button>
          </div>
        }
      />

      <div
        className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
        role="tablist"
        aria-label="Mes groupes ou découverte"
      >
        {tabBtn('mine', `Mes groupes${myGroups.length ? ` (${myGroups.length})` : ''}`)}
        {tabBtn(
          'discover',
          `Tous les salons${visibleDiscover.length ? ` (${visibleDiscover.length})` : ''}`,
        )}
      </div>

      {activeTab === 'mine' ? (
        <section aria-labelledby="hub-mine-heading" className="space-y-4">
          <h2 id="hub-mine-heading" className="sr-only">
            Mes groupes
          </h2>
          {myGroups.length === 0 ? (
            <Card className="p-8 text-center" elevation="soft">
              <p className="text-4xl" aria-hidden>
                👥
              </p>
              <p className="mt-3 font-display text-lg font-black text-tf-dark">
                Aucun groupe pour l’instant
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-tf-grey">
                Ouvre un salon depuis la liste : tu seras ajouté automatiquement à{' '}
                <strong className="text-tf-dark">Mes groupes</strong>. Tu peux aussi créer le tien.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button variant="primary" className="rounded-2xl" onClick={() => setTab('discover')}>
                  Parcourir les salons
                </Button>
                <Button variant="soft" className="rounded-2xl" onClick={() => setCreateOpen(true)}>
                  Créer un groupe
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="space-y-3 p-4 sm:p-5" elevation="soft">
              {myGroups.map((g) => (
                <Link
                  key={g.id}
                  to={`/group/${g.id}`}
                  onClick={() => joinGroup(g.id)}
                  className="group block tf-card-hover rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20"
                  aria-label={`Ouvrir le groupe ${g.name}`}
                >
                  <GroupCard
                    group={g}
                    accessLevel={getGroupAccess(g, accessPrefs)}
                    member={isJoined(g.id) || g.createdBy === 'me'}
                  />
                </Link>
              ))}
            </Card>
          )}
        </section>
      ) : (
        <section aria-labelledby="hub-discover-heading" className="space-y-4">
          <h2 id="hub-discover-heading" className="sr-only">
            Tous les salons
          </h2>
          <Card className="p-4 sm:p-5" elevation="soft">
            <label
              htmlFor="hub-interest-filter"
              className="text-xs font-black uppercase tracking-wide text-tf-grey"
            >
              Centres d’intérêt
            </label>
            <Input
              id="hub-interest-filter"
              value={interestFilter}
              onChange={(e) => setInterestFilter(e.target.value)}
              placeholder="Ex : psg, ligue1, pronos…"
              className="mt-2 rounded-2xl"
            />
            <p className="mt-2 text-xs font-semibold text-tf-grey">
              Même principe que les hashtags des salons publics : tape un ou plusieurs mots-clés.
            </p>
          </Card>
          <Card className="space-y-3 p-4 sm:p-5" elevation="soft">
            {interestFilter.trim() && discoverFiltered.length === 0 ? (
              <p className="py-6 text-center text-sm font-semibold text-tf-grey">
                Aucun salon ne correspond à « {interestFilter.trim()} ». Essaie un autre hashtag
                ou efface la recherche.
              </p>
            ) : null}
            {discoverFiltered.map((g) => (
              <Link
                key={g.id}
                to={`/group/${g.id}`}
                onClick={() => joinGroup(g.id)}
                className="group block tf-card-hover rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20"
                aria-label={`Rejoindre le groupe ${g.name}`}
              >
                <GroupCard
                  group={g}
                  accessLevel={getGroupAccess(g, accessPrefs)}
                  member={isJoined(g.id) || g.createdBy === 'me'}
                />
              </Link>
            ))}
          </Card>
        </section>
      )}

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(payload) => {
          const created = createGroup(payload)
          navigate(`/group/${created.id}`)
        }}
      />
    </div>
  )
}
