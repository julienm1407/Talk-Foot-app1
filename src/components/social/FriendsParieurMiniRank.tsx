import { Card } from '../ui/Card'
import { cn } from '../../utils/cn'
import { mockFriendsLeaderboard } from '../../data/friendsHubMock'

export function FriendsParieurMiniRank({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden p-0', className)} elevation="soft">
      <div className="border-b border-tf-nav-groups/20 bg-violet-50/60 px-4 py-2.5 sm:px-5 sm:py-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-800">Tes amis</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[280px] text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-tf-dark/8 text-[10px] font-black uppercase tracking-wider text-tf-grey">
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Joueur</th>
              <th className="px-4 py-2 text-right">Jetons</th>
              <th className="px-4 py-2 text-right">ROI</th>
              <th className="px-4 py-2 text-right">Streak</th>
            </tr>
          </thead>
          <tbody>
            {mockFriendsLeaderboard.map((row) => (
              <tr
                key={row.userId}
                className={cn('border-b border-tf-dark/[0.05]', row.isMe && 'bg-sky-50/70 font-semibold')}
              >
                <td className="px-4 py-2 tabular-nums font-black">{row.rank}</td>
                <td className="px-4 py-2 text-tf-dark">{row.username}</td>
                <td className="px-4 py-2 text-right tabular-nums">{row.gains}</td>
                <td
                  className={cn(
                    'px-4 py-2 text-right tabular-nums',
                    row.roiPct >= 0 ? 'text-emerald-700' : 'text-rose-600',
                  )}
                >
                  {row.roiPct > 0 ? '+' : ''}
                  {row.roiPct}%
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{row.streak} j</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
