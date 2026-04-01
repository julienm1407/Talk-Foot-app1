import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { SupporterGroup } from '../../types/group'
import { cn } from '../../utils/cn'
import { GroupCard } from '../group/GroupCard'
import { useSupporterGroups } from '../../hooks/useSupporterGroups'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { getGroupAccess } from '../../utils/groupAccess'

/**
 * Encart accueil : même carte que la page Groupes (`GroupCard` en variant encart),
 * avec accès / membre alignés sur les préférences fan.
 */
export function TribuneShowcaseCard({
  group,
  variant = 'grid',
  className,
  dense = false,
}: {
  group: SupporterGroup
  variant?: 'grid' | 'rail'
  className?: string
  /** Rail colonne droite : carte plus courte (moins de répétition visuelle) */
  dense?: boolean
}) {
  const { isJoined } = useSupporterGroups()
  const { favoriteClubIds, favoriteLeagueId, hideRivalSalons } = useFanPreferences()
  const accessPrefs = useMemo(
    () => ({ favoriteClubIds, favoriteLeagueId, hideRivalSalons }),
    [favoriteClubIds, favoriteLeagueId, hideRivalSalons],
  )
  const accessLevel = getGroupAccess(group, accessPrefs)
  const member = isJoined(group.id) || group.createdBy === 'me'
  const cardVariant = variant === 'rail' ? 'encartRail' : 'encart'

  return (
    <Link
      to={`/group/${group.id}`}
      className={cn(
        'group block h-full min-h-0 tf-card-hover rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20',
        className,
      )}
      aria-label={`Ouvrir le salon ${group.name}`}
    >
      <GroupCard
        className="h-full min-h-0 w-full"
        group={group}
        variant={cardVariant}
        accessLevel={accessLevel}
        member={member}
        dense={variant === 'rail' ? dense : false}
      />
    </Link>
  )
}
