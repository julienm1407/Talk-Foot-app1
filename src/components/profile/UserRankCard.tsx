import { useLeaderboard } from '../../hooks/useLeaderboard'
import { Card } from '../ui/Card'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

export function UserRankCard() {
  const { myRank, myEntry } = useLeaderboard()
  const rankPercent = Math.min(100, Math.round((myRank / 250) * 100))

  return (
    <Card className="p-4 sm:p-5" elevation="soft">
      <div className="flex items-end justify-between gap-4 mb-1">
        <div>
          <div className="text-[11px] font-black tracking-[0.18em] text-tf-grey">
            CLASSEMENT
          </div>
          <h3 className="mt-1 font-display text-lg font-black tracking-tight text-tf-dark">
            Meilleurs parieurs
          </h3>
        </div>
      </div>

      <div
        className={cn(
          'mt-5 flex flex-wrap items-center gap-5 rounded-2xl p-5',
          myRank <= 10 && 'bg-amber-50/80 ring-1 ring-amber-200/50',
          myRank > 10 && myRank <= 50 && 'bg-slate-50/80 ring-1 ring-slate-200/50',
          myRank > 50 && 'bg-tf-grey-pastel/20 ring-1 ring-tf-grey-pastel/50',
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex size-14 shrink-0 items-center justify-center rounded-xl font-display text-2xl font-black',
              myRank <= 3 && 'bg-amber-500 text-white',
              myRank > 3 && myRank <= 10 && 'bg-amber-200 text-amber-900',
              myRank > 10 && 'bg-tf-grey-pastel/60 text-tf-dark',
            )}
          >
            #{myRank}
          </div>
          <div>
            <div className="text-2xl font-black text-tf-dark">
              {myEntry.score} pts
            </div>
            <div className="text-xs font-medium text-tf-grey">
              {myEntry.wins} victoires / {myEntry.totalBets} paris
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-[160px]">
          <div className="flex items-center justify-between text-[10px] font-bold text-tf-grey">
            <span>Top 250</span>
            <span>Tu es dans le top {rankPercent}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-tf-grey-pastel/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600"
              style={{ width: `${100 - rankPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3">
        <Link
          to="/"
          className="text-xs font-bold text-tf-dark underline decoration-tf-grey-pastel underline-offset-2 hover:text-tf-dark/80"
        >
          Voir le classement complet sur l'accueil →
        </Link>
      </div>
    </Card>
  )
}
