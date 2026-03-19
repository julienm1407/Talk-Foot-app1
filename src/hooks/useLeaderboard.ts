import { useMemo } from 'react'
import { useLocalStorageState } from './useLocalStorage'
import { mockPredictions } from '../data/predictions'
import { mockLeaderboard } from '../data/leaderboard'
import { currentUser } from '../data/users'
import type { Bet } from '../types/bet'
import type { LeaderboardEntry } from '../data/leaderboard'

export function useLeaderboard() {
  const [bets] = useLocalStorageState<Bet[]>('talkfoot.bets.v1', [])

  const { myScore, myWins, myTotal } = useMemo(() => {
    const predPoints = mockPredictions
      .filter((p) => p.outcome === 'won')
      .reduce((s, p) => s + (p.points ?? 0), 0)
    const wonBets = bets.filter((b) => b.status === 'won')
    const betPoints = wonBets.reduce((s, b) => s + (b.payout ?? b.stake * b.odds), 0)
    return {
      myScore: predPoints + Math.round(betPoints),
      myWins: mockPredictions.filter((p) => p.outcome === 'won').length + wonBets.length,
      myTotal: mockPredictions.filter((p) => p.outcome !== 'pending').length + bets.filter((b) => b.status !== 'open').length,
    }
  }, [bets])

  const { leaderboard, myRank, myEntry } = useMemo(() => {
    const me: LeaderboardEntry = {
      rank: 0,
      userId: 'me',
      username: currentUser.username,
      avatarSeed: currentUser.avatarSeed,
      accent: currentUser.accent,
      score: myScore,
      wins: myWins,
      totalBets: myTotal,
    }

    const sorted = [...mockLeaderboard, me].sort((a, b) => b.score - a.score)
    const ranked = sorted.map((e, i) => ({ ...e, rank: i + 1 }))
    const myIdx = ranked.findIndex((e) => e.userId === 'me')
    const myR = myIdx >= 0 ? myIdx + 1 : ranked.length + 1
    if (myIdx >= 0) ranked[myIdx] = { ...ranked[myIdx], rank: myR }

    return {
      leaderboard: ranked,
      myRank: myR,
      myEntry: myIdx >= 0 ? ranked[myIdx] : { ...me, rank: myR },
    }
  }, [myScore, myWins, myTotal])

  const top12 = useMemo(() => leaderboard.slice(0, 12), [leaderboard])
  const top250 = useMemo(() => leaderboard.slice(0, 250), [leaderboard])

  return {
    top12,
    top250,
    myRank,
    myEntry,
  }
}
