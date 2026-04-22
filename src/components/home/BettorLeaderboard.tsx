import { useLeaderboard } from '../../hooks/useLeaderboard'
import { useProfile } from '../../hooks/useProfile'
import { Avatar } from '../ui/Avatar'
import { ProfileCharacterThumb } from '../profile/ProfileCharacterThumb'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

export function BettorLeaderboard({
  embedded,
  extended,
}: {
  embedded?: boolean
  /** Page classements : plus de lignes + stats perso */
  extended?: boolean
}) {
  const { top12, top250, myRank, myEntry } = useLeaderboard()
  const { profile } = useProfile()
  const rows = extended ? top250.slice(0, 40) : top12

  return (
    <div
      className={cn(
        embedded
          ? 'p-0'
          : 'rounded-2xl border border-tf-grey-pastel/50 bg-tf-white/95 p-3 sm:p-4',
      )}
    >
      <div className="flex items-end justify-between gap-2">
        <h3 className="text-sm font-black tracking-tight text-tf-dark">
          {extended ? 'Classement des parieurs' : 'Top 250 parieurs'}
        </h3>
        <span className="text-[10px] font-bold text-tf-grey">Classement live</span>
      </div>
      <p className="mt-0.5 text-[11px] font-medium text-tf-grey">
        {extended
          ? 'Pronos + paris gagnants (mock) — top 40 affichés'
          : 'Meilleurs pronostiqueurs'}
      </p>

      {extended ? (
        <div className="mt-4 grid gap-3 rounded-xl border border-tf-electric/20 bg-tf-electric-soft/40 p-3 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-black uppercase text-tf-grey">Ton rang</p>
            <p className="font-display text-2xl font-black text-tf-dark">#{myRank}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-tf-grey">Points</p>
            <p className="font-display text-2xl font-black text-tf-dark">{myEntry.score}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-tf-grey">Victoires / tentatives</p>
            <p className="text-lg font-black text-tf-dark">
              {myEntry.wins} / {myEntry.totalBets || '—'}
            </p>
          </div>
        </div>
      ) : null}

      <ol
        className={cn(
          'mt-3 space-y-1.5',
          extended && 'max-h-[min(520px,55vh)] overflow-y-auto pr-1 sm:grid sm:max-h-none sm:grid-cols-2 sm:gap-x-4 sm:gap-y-1.5 sm:space-y-0',
        )}
        role="list"
      >
        {rows.map((e) => (
          <li
            key={e.userId}
            className={cn(
              'flex items-center gap-2 rounded-xl px-2 py-1.5',
              e.userId === 'me' && 'bg-emerald-50/80 ring-1 ring-emerald-200/60',
            )}
          >
            <span
              className={cn(
                'flex w-6 shrink-0 justify-center text-[11px] font-black',
                e.rank <= 3 ? 'text-amber-600' : 'text-tf-grey',
              )}
            >
              {e.rank}
            </span>
            {e.userId === 'me' ? (
              <ProfileCharacterThumb
                profile={profile}
                size="sm"
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
            <span className="min-w-0 flex-1 truncate text-xs font-bold text-tf-dark">
              {e.username}
            </span>
            <span className="shrink-0 text-[11px] font-black text-tf-grey">
              {e.score} pts
              {extended && e.totalBets ? (
                <span className="ml-1 font-medium text-tf-grey/80">· {e.wins}V</span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-3 flex items-center justify-between border-t border-tf-grey-pastel/40 pt-3">
        <span className="text-[10px] font-medium text-tf-grey">
          Ton rang : #{myRank}
        </span>
        <Link
          to="/profile"
          className="text-[11px] font-bold text-tf-dark underline decoration-tf-grey-pastel underline-offset-2 hover:text-tf-dark/80"
        >
          Voir ton profil →
        </Link>
      </div>
    </div>
  )
}
