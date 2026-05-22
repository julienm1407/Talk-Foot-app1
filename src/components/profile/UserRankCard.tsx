import { useLeaderboard } from '../../hooks/useLeaderboard'
import { useAppearance } from '../../contexts/AppearanceContext'
import { Card } from '../ui/Card'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

export function UserRankCard() {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const { myRank, myEntry, totalActive } = useLeaderboard()
  const pool = Math.max(1, totalActive)
  const rankPercent = Math.min(100, Math.round((myRank / pool) * 100))

  return (
    <Card id="classement" className="scroll-mt-4 p-4 sm:p-5" elevation="soft">
      <div className="mb-1 flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-black tracking-[0.18em] text-tf-app-muted">
            CLASSEMENT
          </div>
          <h3 className="mt-1 font-display text-lg font-black tracking-tight text-tf-app-fg">
            Meilleurs parieurs
          </h3>
        </div>
      </div>

      <div
        className={cn(
          'mt-5 flex flex-wrap items-center gap-5 rounded-2xl p-5',
          L &&
            (myRank <= 10
              ? 'bg-amber-50/80 ring-1 ring-amber-200/50'
              : myRank > 10 && myRank <= 50
                ? 'bg-slate-50/80 ring-1 ring-slate-200/50'
                : 'bg-tf-grey-pastel/20 ring-1 ring-tf-grey-pastel/50'),
          !L &&
            (myRank <= 10
              ? 'bg-amber-950/45 ring-1 ring-amber-500/30'
              : myRank > 10 && myRank <= 50
                ? 'bg-slate-900/50 ring-1 ring-slate-500/25'
                : 'bg-white/[0.05] ring-1 ring-white/10'),
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex size-14 shrink-0 items-center justify-center rounded-xl font-display text-2xl font-black',
              myRank <= 3 && 'bg-amber-500 text-white',
              myRank > 3 && myRank <= 10 && (L ? 'bg-amber-200 text-amber-900' : 'bg-amber-700/50 text-amber-100'),
              myRank > 10 && (L ? 'bg-tf-grey-pastel/60 text-tf-app-fg' : 'bg-white/15 text-tf-app-fg'),
            )}
          >
            #{myRank}
          </div>
          <div>
            <div className="text-2xl font-black text-tf-app-fg">
              {myEntry.score} pts
            </div>
            <div className="text-xs font-medium text-tf-app-muted">
              {myEntry.wins} victoires / {myEntry.totalBets} paris
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-[160px]">
          <div className="flex items-center justify-between text-[10px] font-bold text-tf-app-muted">
            <span>{totalActive > 0 ? `${totalActive} parieur${totalActive > 1 ? 's' : ''} actifs` : 'Classement'}</span>
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
          to="/pronostic?vue=classement"
          className="text-xs font-bold text-tf-app-fg underline decoration-tf-app-muted/60 underline-offset-2 hover:opacity-85"
        >
          Voir le classement complet →
        </Link>
      </div>
    </Card>
  )
}
