import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useSupporterGroups } from '../hooks/useSupporterGroups'
import { GroupCard } from '../components/group/GroupCard'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useFanPreferences } from '../contexts/FanPreferencesContext'
import { sortGroupsByFanAffinity, getGroupAccess } from '../utils/groupAccess'
import { CreateGroupModal } from '../components/group/CreateGroupModal'

export function GroupsHubPage() {
  const { groups, createGroup } = useSupporterGroups()
  const {
    favoriteClubIds,
    favoriteLeagueId,
    hideRivalSalons,
  } = useFanPreferences()
  const [createOpen, setCreateOpen] = useState(false)

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

  const visible = useMemo(
    () => sorted.filter((g) => getGroupAccess(g, accessPrefs) !== 'hidden'),
    [sorted, accessPrefs],
  )

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black tracking-[0.2em] text-tf-grey">GROUPES</p>
          <h1 className="font-display text-2xl font-black tracking-tight text-tf-dark sm:text-3xl">
            Salons supporters
          </h1>
          <p className="mt-1 text-sm font-semibold text-tf-grey">
            Aperçu d’activité, en ligne et derniers messages au survol.
          </p>
        </div>
        <Button
          variant="primary"
          className="tf-interactive-press shrink-0 rounded-3xl px-5"
          onClick={() => setCreateOpen(true)}
        >
          ➕ Créer un groupe
        </Button>
      </header>

      <Card className="space-y-3 p-4 sm:p-5" elevation="soft">
        {visible.map((g) => (
          <Link
            key={g.id}
            to={`/group/${g.id}`}
            className="group block tf-card-hover rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20"
            aria-label={`Rejoindre le groupe ${g.name}`}
          >
            <GroupCard group={g} accessLevel={getGroupAccess(g, accessPrefs)} />
          </Link>
        ))}
      </Card>

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(payload) => {
          createGroup(payload)
        }}
      />
    </div>
  )
}
