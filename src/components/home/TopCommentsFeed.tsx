import { useMemo } from 'react'
import { useMessageLikes } from '../../hooks/useMessageLikes'
import { Card } from '../ui/Card'
import { Link } from 'react-router-dom'
import {
  MODULAR_PP_NAV_FRAMING,
  ProfileCharacterThumb,
} from '../profile/ProfileCharacterThumb'
import { chatPersonasPool, currentUser } from '../../data/users'
import { useProfile } from '../../hooks/useProfile'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { LIVE_FIL_EQUIPE_COEUR } from '../../data/tribunes'
import { useSupporterTintMode } from '../../hooks/useSupporterTintMode'
import { useAppearance } from '../../contexts/AppearanceContext'
import { TF_TEXT_FG, TF_TEXT_MUTED, TF_TEXT_SUBTLE, tfGhostOnCard } from '../../theme/appearanceClasses'
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
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  const filtered = useMemo(() => {
    const active = favoriteClubIds.length > 0 && virageMode
    if (!active) return topComments
    return topComments.filter((c) => {
      if (c.userId === currentUser.id) return true
      const u = usersById[c.userId]
      const fid = u?.fanClubId
      // Les auteurs cloud n'existent pas dans le pool local -> on garde le commentaire.
      if (!fid) return true
      return favoriteClubIds.includes(fid)
    })
  }, [topComments, virageMode, favoriteClubIds])

  const filterHint =
    favoriteClubIds.length > 0 && virageMode ? (
      <p className={cn('text-[10px] font-bold sm:text-xs', L ? 'text-violet-700' : 'text-violet-200')}>
        {LIVE_FIL_EQUIPE_COEUR.label} : commentaires liés à tes clubs favoris.
      </p>
    ) : null

  const empty = (
    <div className={cn('text-center', embedded ? 'px-4 py-8 sm:py-10' : 'px-5 py-12 sm:px-6')}>
      <div className="text-3xl opacity-40 sm:text-4xl">💬</div>
      <p className={cn('mt-2 text-sm font-bold', TF_TEXT_FG)}>Aucun commentaire liké pour l’instant</p>
      <p className={cn('mt-1 text-xs font-medium', TF_TEXT_MUTED)}>
        Like des commentaires dans les lives pour les voir ici
      </p>
      <Link
        to="/match"
        className={cn(
          'mt-3 inline-flex rounded-xl px-3 py-2 text-xs font-black sm:mt-4 sm:px-4 sm:text-sm',
          tfGhostOnCard(L, 'hover:opacity-95'),
        )}
      >
        Voir les matchs →
      </Link>
    </div>
  )

  const list = filtered.length === 0 ? (
    empty
  ) : (
    <div className="space-y-2.5 p-2 sm:space-y-3 sm:p-3">
      {filtered.map((c) => {
        const u = usersById[c.userId]
        return (
          <Link
            key={c.id}
            to={`/channel/${c.matchId}`}
            className={cn(
              'flex gap-3 rounded-xl border transition sm:gap-4',
              embedded
                ? 'px-3 py-2.5 sm:px-3.5 sm:py-3'
                : 'px-5 py-4 sm:px-6',
              L
                ? 'border-slate-200/80 bg-white/95 hover:border-slate-300 hover:bg-white'
                : 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface-soft)] hover:border-sky-300/35 hover:bg-[color:color-mix(in_srgb,var(--tf-c30-surface-soft)_92%,white)]',
            )}
          >
            <ProfileCharacterThumb
              profile={profile}
              size="sm"
              {...MODULAR_PP_NAV_FRAMING}
              className="mt-0.5 !h-9 !w-9 !min-h-9 !min-w-9 shrink-0 self-start rounded-[20px] border-0 p-0 sm:!h-10 sm:!w-10 sm:!min-h-10 sm:!min-w-10"
              aria-label={u?.username ?? 'Utilisateur'}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className={cn('text-xs font-bold sm:text-sm', TF_TEXT_FG)}>{c.username}</span>
                <span className={cn('text-[10px] font-medium sm:text-[11px]', TF_TEXT_SUBTLE)}>
                  • {c.matchLabel}
                </span>
              </div>
              <p className={cn('mt-1 line-clamp-2 text-xs font-medium leading-snug sm:text-sm', TF_TEXT_FG)}>
                {c.text}
              </p>
              <div
                className={cn(
                  'mt-1.5 flex items-center gap-1 text-[11px] font-semibold sm:mt-2 sm:text-xs',
                  L ? 'text-rose-600' : 'text-rose-300',
                )}
              >
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
      <div
        className={cn(
          'flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border',
          L ? 'border-slate-200/70 bg-slate-50/70' : 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface-soft)]',
        )}
      >
        {filterHint ? (
          <div className={cn('border-b px-4 py-2', L ? 'border-slate-200/60' : 'border-[color:var(--tf-c30-border)]')}>
            {filterHint}
          </div>
        ) : null}
        {list}
      </div>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="space-y-1.5 px-5 py-4 sm:space-y-2 sm:px-6 sm:py-5">
        <div className={cn('text-[11px] font-black tracking-wide', TF_TEXT_MUTED)}>COMMUNAUTÉ</div>
        <div className={cn('text-2xl font-black tracking-tight sm:text-3xl', TF_TEXT_FG)}>
          {supporterTintActive && team?.shortName
            ? `Top com. ${team.shortName}`
            : 'Top commentaires'}
        </div>
        <div className={cn('text-sm font-semibold sm:text-base', TF_TEXT_MUTED)}>
          Les meilleurs commentaires des lives, likés par la communauté
          {filterHint ? <span className="mt-1 block">{filterHint}</span> : null}
        </div>
      </div>
      {list}
    </Card>
  )
}
