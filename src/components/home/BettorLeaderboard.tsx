import { useLeaderboard } from '../../hooks/useLeaderboard'
import { Avatar } from '../ui/Avatar'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

export function BettorLeaderboard() {
  const { top12, myRank } = useLeaderboard()

  return (
    <div className="rounded-2xl border border-tf-grey-pastel/50 bg-tf-white/95 p-4">
      <div className="flex items-end justify-between gap-2">
        <h3 className="text-sm font-black tracking-tight text-tf-dark">
          Top 250 parieurs
        </h3>
        <span className="text-[10px] font-bold text-tf-grey">Classement live</span>
      </div>
      <p className="mt-0.5 text-[11px] font-medium text-tf-grey">
        Meilleurs pronostiqueurs
      </p>

      <ol className="mt-3 space-y-1.5" role="list">
        {top12.map((e) => (
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
            <Avatar
              seed={e.avatarSeed}
              accent={e.accent}
              alt={e.username}
              className="size-7 shrink-0 rounded-lg"
            />
            <span className="min-w-0 flex-1 truncate text-xs font-bold text-tf-dark">
              {e.username}
            </span>
            <span className="shrink-0 text-[11px] font-black text-tf-grey">
              {e.score} pts
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
