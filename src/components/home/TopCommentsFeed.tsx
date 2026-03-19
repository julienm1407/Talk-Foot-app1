import { useMessageLikes } from '../../hooks/useMessageLikes'
import { Card } from '../ui/Card'
import { Link } from 'react-router-dom'
import { Avatar } from '../ui/Avatar'
import { currentUser, mockUsers } from '../../data/users'

const usersById = Object.fromEntries(
  [currentUser, ...mockUsers].map((u) => [u.id, u]),
)

export function TopCommentsFeed() {
  const { topComments } = useMessageLikes()

  return (
    <Card className="overflow-hidden">
      <div className="space-y-2 px-5 py-5 sm:px-6 sm:py-6">
        <div className="text-[11px] font-black tracking-wide text-slate-600">
          COMMUNAUTÉ
        </div>
        <div className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Commentaires marquants
        </div>
        <div className="text-sm font-semibold text-slate-700 sm:text-base">
          Les meilleurs commentaires des lives, likés par la communauté
        </div>
      </div>
      {topComments.length === 0 ? (
        <div className="px-5 py-12 text-center sm:px-6">
          <div className="text-4xl opacity-40">💬</div>
          <p className="mt-3 text-sm font-bold text-slate-600">
            Aucun commentaire liké pour l'instant
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Like des commentaires dans les lives pour les voir apparaître ici
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-black text-slate-900 transition hover:bg-white"
          >
            Voir les matchs →
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-200/80">
          {topComments.map((c) => {
            const u = usersById[c.userId]
            return (
              <Link
                key={c.id}
                to={`/channel/${c.matchId}`}
                className="flex gap-4 px-5 py-4 transition hover:bg-slate-50/80 sm:px-6"
              >
                <Avatar
                  seed={u?.avatarSeed ?? 'fan'}
                  accent={u?.accent ?? 'violet'}
                  alt={u?.username ?? ''}
                  className="mt-0.5 shrink-0 size-10"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">
                      {c.username}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      • {c.matchLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-slate-700 line-clamp-2">
                    {c.text}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                    <span aria-hidden>❤️</span>
                    <span>{c.likes} like{c.likes > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </Card>
  )
}
