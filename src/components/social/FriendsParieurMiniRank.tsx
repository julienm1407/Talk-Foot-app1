import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import { cn } from '../../utils/cn'
import { useAppearance } from '../../contexts/AppearanceContext'
import { useCloudFriends } from '../../hooks/useCloudFriends'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { useBettingHubStats } from '../../hooks/useBettingHubStats'

type FriendRankRow = {
  userId: string
  username: string
  rank: number
  points: number
  accuracy: number
  streakLabel: string
  isMe?: boolean
}

function accuracyFromEntry(wins: number, totalBets: number): number {
  if (totalBets <= 0) return 0
  return Math.round((wins / totalBets) * 100)
}

export function FriendsParieurMiniRank({ className }: { className?: string }) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const { acceptedPeers, loading: friendsLoading } = useCloudFriends()
  const { top250, myEntry } = useLeaderboard()
  const myStats = useBettingHubStats()

  const rows = useMemo((): FriendRankRow[] => {
    const byId = new Map(top250.map((e) => [e.userId, e]))
    const meCloud = byId.get(myEntry.userId)

    const draft: Omit<FriendRankRow, 'rank'>[] = [
      {
        userId: myEntry.userId,
        username: myEntry.username || 'Toi',
        points: meCloud?.score ?? myEntry.score,
        accuracy: meCloud
          ? accuracyFromEntry(meCloud.wins, meCloud.totalBets)
          : myStats.accuracy,
        streakLabel: myStats.streak > 0 ? `${myStats.streak}` : '0',
        isMe: true,
      },
      ...acceptedPeers.map((peer) => {
        const e = byId.get(peer.id)
        return {
          userId: peer.id,
          username: peer.displayName,
          points: e?.score ?? 0,
          accuracy: e ? accuracyFromEntry(e.wins, e.totalBets) : 0,
          streakLabel: e && e.wins > 0 ? `${e.wins}V` : '—',
        }
      }),
    ]

    draft.sort((a, b) => b.points - a.points || b.accuracy - a.accuracy)
    return draft.map((row, index) => ({ ...row, rank: index + 1 }))
  }, [acceptedPeers, myEntry, myStats.accuracy, myStats.streak, top250])

  const headerBg = L ? 'bg-violet-50/60' : 'bg-violet-950/35'
  const headerText = L ? 'text-violet-800' : 'text-violet-200'
  const borderC = L ? 'border-tf-nav-groups/20' : 'border-white/10'
  const subBorderC = L ? 'border-tf-nav-groups/15' : 'border-white/8'
  const headText = L ? 'text-tf-grey' : 'text-sky-300/70'
  const rowBorder = L ? 'border-tf-dark/[0.05]' : 'border-white/[0.06]'
  const meRow = L ? 'bg-sky-50/70 font-semibold' : 'bg-sky-500/10 font-semibold'
  const nameC = L ? 'text-tf-dark' : 'text-sky-50'
  const hintC = L ? 'text-tf-grey' : 'text-sky-200/75'

  return (
    <Card className={cn('overflow-hidden p-0', className)} elevation="soft">
      <div className={cn('border-b px-4 py-2.5 sm:px-5 sm:py-3', borderC, headerBg)}>
        <p className={cn('text-[10px] font-black uppercase tracking-[0.16em]', headerText)}>
          Toi &amp; tes amis
        </p>
      </div>

      {acceptedPeers.length === 0 && !friendsLoading ? (
        <p className={cn('border-b px-4 py-2.5 text-[11px] font-semibold leading-snug', subBorderC, hintC)}>
          Ajoute des amis depuis ton{' '}
          <Link to="/profile" className="font-bold text-tf-cta underline-offset-2 hover:underline">
            profil
          </Link>{' '}
          ou la messagerie pour les comparer ici.
        </p>
      ) : null}

      {friendsLoading ? (
        <p className={cn('px-4 py-3 text-[11px] font-semibold', hintC)}>Chargement de tes amis…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px] text-left text-xs sm:text-sm">
            <thead>
              <tr className={cn('border-b text-[10px] font-black uppercase tracking-wider', rowBorder, headText)}>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Joueur</th>
                <th className="px-4 py-2 text-right">Points</th>
                <th className="px-4 py-2 text-right">Précision</th>
                <th className="px-4 py-2 text-right">Série</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.userId}
                  className={cn('border-b', rowBorder, row.isMe && meRow)}
                >
                  <td className="px-4 py-2 tabular-nums font-black">{row.rank}</td>
                  <td className={cn('px-4 py-2', nameC)}>{row.username}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{row.points}</td>
                  <td
                    className={cn(
                      'px-4 py-2 text-right tabular-nums',
                      row.accuracy >= 50
                        ? L
                          ? 'text-emerald-700'
                          : 'text-emerald-300'
                        : L
                          ? 'text-slate-600'
                          : 'text-sky-200/80',
                    )}
                  >
                    {row.accuracy}%
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{row.streakLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
