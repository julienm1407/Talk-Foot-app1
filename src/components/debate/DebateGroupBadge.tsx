import { Link } from 'react-router-dom'
import { useSupporterGroups } from '../../hooks/useSupporterGroups'

/** Étiquette facultative vers la tribune liée — n’impose pas l’adhésion. */
export function DebateGroupBadge({ groupId }: { groupId: string }) {
  const { byId } = useSupporterGroups()
  const group = byId(groupId)
  if (!group) {
    return (
      <Link
        to={`/group/${groupId}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/12 px-3 py-1 text-[11px] font-black text-white backdrop-blur-sm transition hover:bg-white/20"
      >
        👥 Tribune liée
      </Link>
    )
  }
  return (
    <Link
      to={`/group/${groupId}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/12 px-3 py-1 text-[11px] font-black text-white backdrop-blur-sm transition hover:bg-white/20"
    >
      <span aria-hidden>{group.emoji}</span>
      {group.name}
    </Link>
  )
}
