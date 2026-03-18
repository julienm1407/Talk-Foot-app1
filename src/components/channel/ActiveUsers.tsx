import type { User } from '../../types/chat'
import { Avatar } from '../ui/Avatar'

export function ActiveUsers({
  users,
}: {
  users: User[]
}) {
  const shown = users.slice(0, 5)
  const remaining = Math.max(0, users.length - shown.length)

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex -space-x-2">
        {shown.map((u) => (
          <Avatar
            key={u.id}
            seed={u.avatarSeed}
            accent={u.accent}
            alt={u.username}
            className="ring-2 ring-black/30"
          />
        ))}
      </div>
      <div className="text-xs font-semibold text-white/55">
        {users.length} active
        {remaining > 0 ? ` • +${remaining} more` : ''}
      </div>
    </div>
  )
}

