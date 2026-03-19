import type { User } from '../../types/chat'
import { Avatar } from '../ui/Avatar'

export function ActiveUsers({ users }: { users: User[] }) {
  const shown = users.slice(0, 6)
  const remaining = Math.max(0, users.length - shown.length)

  return (
    <div className="flex shrink-0 items-center gap-3">
      <div className="flex -space-x-2.5">
        {shown.map((u) => (
          <Avatar
            key={u.id}
            seed={u.avatarSeed}
            accent={u.accent}
            alt={u.username}
            className="ring-2 ring-white"
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-slate-600">
        {users.length} en live
        {remaining > 0 ? ` (+${remaining})` : ''}
      </span>
    </div>
  )
}
