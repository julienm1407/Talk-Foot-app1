import { useMemo } from 'react'
import { useMessageLikes } from '../../hooks/useMessageLikes'
import { Card } from '../ui/Card'
import { Link } from 'react-router-dom'
import { Avatar } from '../ui/Avatar'
import { ProfileCharacterThumb } from '../profile/ProfileCharacterThumb'
import { chatPersonasPool, currentUser } from '../../data/users'
import { useProfile } from '../../hooks/useProfile'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { LIVE_FIL_EQUIPE_COEUR } from '../../data/tribunes'
import { useSupporterTintMode } from '../../hooks/useSupporterTintMode'
import { cn } from '../../utils/cn'

const usersById = Object.fromEntries(
  [currentUser, ...chatPersonasPool].map((u) => [u.id, u]),
)

export function TopCommentsFeed({
  embedded,
}: {
  embedded?: boolean
} = {}) {
  const { topComments } = useMessageLikes()
  const { profile } = useProfile()
  const { virageMode, favoriteClubIds } = useFanPreferences()
  const { supporterTintActive, team } = useSupporterTintMode()

  const filtered = useMemo(() => {
    const active = favoriteClubIds.length > 0 && virageMode
    if (!active) return topComments
    return topComments.filter((c) => {
      if (c.userId === currentUser.id) return true
      const u = usersById[c.userId]
      const fid = u?.fanClubId
      return Boolean(fid && favoriteClubIds.includes(fid))
    })
  }, [topComments, virageMode, favoriteClubIds])

  const filterHint =
    favoriteClubIds.length > 0 && virageMode ? (
      <p className="text-[10px] font-bold text-violet-700 sm:text-xs">
        {LIVE_FIL_EQUIPE_COEUR.label} : commentaires liés à tes clubs favoris.
      </p>
    ) : null

  const empty = (
    <div className={cn('text-center', embedded ? 'px-4 py-8 sm:py-10' : 'px-5 py-12 sm:px-6')}>
      <div className="text-3xl opacity-40 sm:text-4xl">💬</div>
      <p className="mt-2 text-sm font-bold text-slate-600">Aucun commentaire liké pour l’instant</p>
      <p className="mt-1 text-xs font-medium text-slate-500">
        Like des commentaires dans les lives pour les voir ici
      </p>
      <Link
        to="/match"
        className="mt-3 inline-flex rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-black text-slate-900 transition hover:bg-white sm:mt-4 sm:px-4 sm:text-sm"
      >
        Voir les matchs →
      </Link>
    </div>
  )

  const list = filtered.length === 0 ? (
    empty
  ) : (
    <div className="divide-y divide-slate-200/80">
      {filtered.map((c) => {
        const u = usersById[c.userId]
        return (
          <Link
            key={c.id}
            to={`/channel/${c.matchId}`}
            className={cn(
              'flex gap-3 transition hover:bg-slate-50/80 sm:gap-4',
              embedded ? 'px-4 py-3 sm:px-5' : 'px-5 py-4 sm:px-6',
            )}
          >
            {c.userId === currentUser.id ? (
              <ProfileCharacterThumb
                profile={profile}
                size="sm"
                className="mt-0.5 !h-9 !w-9 !min-h-9 !min-w-9 shrink-0 self-start rounded-[20px] border-0 p-0 sm:!h-10 sm:!w-10 sm:!min-h-10 sm:!min-w-10"
                aria-label={u?.username ?? 'Moi'}
              />
            ) : (
              <Avatar
                seed={u?.avatarSeed ?? 'fan'}
                accent={u?.accent ?? 'violet'}
                alt={u?.username ?? ''}
                className="mt-0.5 size-9 shrink-0 sm:size-10"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-xs font-bold text-slate-800 sm:text-sm">{c.username}</span>
                <span className="text-[10px] font-medium text-slate-500 sm:text-[11px]">
                  • {c.matchLabel}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs font-medium leading-snug text-slate-700 sm:text-sm">
                {c.text}
              </p>
              <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-rose-600 sm:mt-2 sm:text-xs">
                <span aria-hidden>❤️</span>
                <span>
                  {c.likes} like{c.likes > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )

  if (embedded) {
    return (
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm">
        {filterHint ? <div className="border-b border-slate-200/60 px-4 py-2">{filterHint}</div> : null}
        {list}
      </div>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="space-y-1.5 px-5 py-4 sm:space-y-2 sm:px-6 sm:py-5">
        <div className="text-[11px] font-black tracking-wide text-slate-600">COMMUNAUTÉ</div>
        <div className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          {supporterTintActive && team?.shortName
            ? `Top com. ${team.shortName}`
            : 'Top commentaires'}
        </div>
        <div className="text-sm font-semibold text-slate-700 sm:text-base">
          Les meilleurs commentaires des lives, likés par la communauté
          {filterHint ? <span className="mt-1 block">{filterHint}</span> : null}
        </div>
      </div>
      {list}
    </Card>
  )
}
