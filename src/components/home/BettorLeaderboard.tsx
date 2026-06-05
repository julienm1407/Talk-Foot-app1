import { useLeaderboard } from '../../hooks/useLeaderboard'
import { useProfile } from '../../hooks/useProfile'
import { useAppearance } from '../../contexts/AppearanceContext'
import { Avatar } from '../ui/Avatar'
import {
  MODULAR_PP_NAV_FRAMING,
  ProfileCharacterThumb,
} from '../profile/ProfileCharacterThumb'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

export function BettorLeaderboard({
  embedded,
  extended,
}: {
  embedded?: boolean
  /** Page pronostic (onglet classement) : plus de lignes + stats perso */
  extended?: boolean
}) {
  const { appearance } = useAppearance()
  const dark = appearance === 'dark'
  const { top12, top250, myRank, myEntry, totalActive } = useLeaderboard()
  const { profile } = useProfile()
  const rows = extended ? top250.slice(0, 40) : top12
  const titleCount = extended ? totalActive : Math.min(totalActive, 12)

  return (
    <div
      className={cn(
        embedded
          ? 'p-0'
          : cn(
              'rounded-2xl border p-3 sm:p-4',
              dark
                ? 'border-white/14 bg-slate-900/50'
                : 'border-tf-grey-pastel/50 bg-tf-white/95',
            ),
      )}
    >
      <div className="flex items-end justify-between gap-2">
        <h3
          className={cn(
            'text-sm font-black tracking-tight',
            dark ? 'text-sky-50' : 'text-tf-dark',
          )}
        >
          {extended
            ? 'Classement public'
            : titleCount > 0
              ? `Top ${titleCount} parieur${titleCount > 1 ? 's' : ''}`
              : 'Classement parieurs'}
        </h3>
        <span className={cn('text-[10px] font-bold', dark ? 'text-sky-300/80' : 'text-tf-grey')}>
          Paris réels
        </span>
      </div>
      <p className={cn('mt-0.5 text-[11px] font-medium', dark ? 'text-sky-200/75' : 'text-tf-grey')}>
        {extended
          ? 'Tous les parieurs Talk Foot — top 40 affichés'
          : 'Parieurs actifs sur Talk Foot'}
      </p>

      {extended ? (
        <div
          className={cn(
            'mt-4 grid gap-3 rounded-xl border p-3 sm:grid-cols-3',
            dark
              ? 'border-sky-500/25 bg-sky-950/40'
              : 'border-tf-electric/20 bg-tf-electric-soft/40',
          )}
        >
          <div>
            <p className={cn('text-[10px] font-black uppercase', dark ? 'text-sky-300/80' : 'text-tf-grey')}>
              Ton rang
            </p>
            <p className={cn('font-display text-2xl font-black', dark ? 'text-sky-50' : 'text-tf-dark')}>
              #{myRank}
            </p>
          </div>
          <div>
            <p className={cn('text-[10px] font-black uppercase', dark ? 'text-sky-300/80' : 'text-tf-grey')}>
              Points
            </p>
            <p className={cn('font-display text-2xl font-black', dark ? 'text-sky-50' : 'text-tf-dark')}>
              {myEntry.score}
            </p>
          </div>
          <div>
            <p className={cn('text-[10px] font-black uppercase', dark ? 'text-sky-300/80' : 'text-tf-grey')}>
              Victoires / tentatives
            </p>
            <p className={cn('text-lg font-black', dark ? 'text-sky-50' : 'text-tf-dark')}>
              {myEntry.wins} / {myEntry.totalBets || '—'}
            </p>
          </div>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <p
          className={cn(
            'mt-4 rounded-xl border border-dashed px-3 py-4 text-center text-xs font-semibold',
            dark
              ? 'border-white/20 bg-white/[0.04] text-sky-200/80'
              : 'border-tf-grey-pastel/60 bg-tf-ice/50 text-tf-grey',
          )}
        >
          Aucun parieur actif pour l&apos;instant. Place un pari depuis un tribune live pour apparaître au
          classement.
        </p>
      ) : (
        <ol
          className={cn(
            'mt-3 space-y-1.5',
            extended &&
              'max-h-[min(520px,55vh)] overflow-y-auto pr-1 sm:grid sm:max-h-none sm:grid-cols-2 sm:gap-x-4 sm:gap-y-1.5 sm:space-y-0',
          )}
          role="list"
        >
          {rows.map((e) => (
            <li
              key={e.userId}
              className={cn(
                'flex items-center gap-2 rounded-xl px-2 py-1.5',
                e.userId === myEntry.userId &&
                  (dark
                    ? 'bg-emerald-500/15 ring-1 ring-emerald-400/35'
                    : 'bg-emerald-50/80 ring-1 ring-emerald-200/60'),
              )}
            >
              <span
                className={cn(
                  'flex w-6 shrink-0 justify-center text-[11px] font-black',
                  e.rank <= 3 ? (dark ? 'text-amber-300' : 'text-amber-600') : dark ? 'text-sky-300/70' : 'text-tf-grey',
                )}
              >
                {e.rank}
              </span>
              {e.userId === myEntry.userId ? (
                <ProfileCharacterThumb
                  profile={profile}
                  size="sm"
                  {...MODULAR_PP_NAV_FRAMING}
                  className="!h-7 !w-7 !min-h-7 !min-w-7 shrink-0 self-start rounded-lg border-0 p-0"
                  aria-label={e.username}
                />
              ) : (
                <Avatar
                  seed={e.avatarSeed}
                  accent={e.accent}
                  alt={e.username}
                  className="size-7 shrink-0 rounded-lg"
                />
              )}
              <span
                className={cn(
                  'min-w-0 flex-1 truncate text-xs font-bold',
                  dark ? 'text-sky-50' : 'text-tf-dark',
                )}
              >
                {e.username}
              </span>
              <span className={cn('shrink-0 text-[11px] font-black', dark ? 'text-sky-300/85' : 'text-tf-grey')}>
                {e.score} pts
                {extended && e.totalBets ? (
                  <span className={cn('ml-1 font-medium', dark ? 'text-sky-400/70' : 'text-tf-grey/80')}>
                    · {e.wins}V
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      )}

      <div
        className={cn(
          'mt-3 flex items-center justify-between border-t pt-3',
          dark ? 'border-white/12' : 'border-tf-grey-pastel/40',
        )}
      >
        <span className={cn('text-[10px] font-medium', dark ? 'text-sky-300/80' : 'text-tf-grey')}>
          Ton rang : #{myRank}
        </span>
        <Link
          to="/profile"
          className={cn(
            'text-[11px] font-bold underline underline-offset-2',
            dark
              ? 'text-sky-200 decoration-sky-500/50 hover:text-sky-50'
              : 'text-tf-dark decoration-tf-grey-pastel hover:text-tf-dark/80',
          )}
        >
          Voir ton profil →
        </Link>
      </div>
    </div>
  )
}
