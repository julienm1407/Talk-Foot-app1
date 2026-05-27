/**
 * Données démo pour la page Amis (MVP sans backend).
 * Remplacer par API + hooks quand le module social est branché.
 */

export type FriendLeaderboardRow = {
  userId: string
  username: string
  rank: number
  /** Jetons gagnés sur la fenêtre (paris) */
  gains: number
  /** ROI approximatif % */
  roiPct: number
  /** Série jours / interactions */
  streak: number
  isMe?: boolean
}

/** Démo : toi + l’assistant (pas de faux profils « amis »). */
export const mockFriendsLeaderboard: FriendLeaderboardRow[] = [
  { userId: 'me', username: 'Toi', rank: 1, gains: 0, roiPct: 0, streak: 0, isMe: true },
  {
    userId: 'u-tf-bot',
    username: 'Coach Talk Foot',
    rank: 2,
    gains: 0,
    roiPct: 0,
    streak: 0,
  },
]

export type FriendsActivityItem = {
  id: string
  type: 'bet' | 'live' | 'post' | 'duel'
  actor: string
  summary: string
  timeLabel: string
  href?: string
}

export const mockFriendsActivity: FriendsActivityItem[] = [
  {
    id: 'a1',
    type: 'bet',
    actor: 'LucasVirage',
    summary: 'Pari simple · victoire à domicile',
    timeLabel: 'Il y a 12 min',
    href: '/match',
  },
  {
    id: 'a2',
    type: 'live',
    actor: 'Nina92',
    summary: 'A rejoint le tribune live',
    timeLabel: 'Il y a 34 min',
    href: '/match',
  },
  {
    id: 'a3',
    type: 'post',
    actor: 'SarahGoal',
    summary: 'Message en tribune groupe',
    timeLabel: 'Il y a 1 h',
    href: '/groups',
  },
  {
    id: 'a4',
    type: 'duel',
    actor: 'TomChant',
    summary: 'T’a proposé un duel sur le prochain match',
    timeLabel: 'Il y a 2 h',
    href: '/rankings',
  },
]

export type MockDuelInvite = {
  id: string
  opponentUsername: string
  matchLabel: string
  rewardTokens: number
  /** null = en attente de ton choix */
  yourPick: 'home' | 'away' | 'draw' | null
  theirPick: 'home' | 'away' | 'draw' | null
  status: 'pending_you' | 'locked' | 'settled'
}

export const mockDuelInvite: MockDuelInvite = {
  id: 'duel-demo-1',
  opponentUsername: 'TomChant',
  matchLabel: 'Lens – Marseille',
  rewardTokens: 75,
  yourPick: null,
  theirPick: 'away',
  status: 'pending_you',
}

export type MockBroncaSnapshot = {
  matchLabel: string
  leaderUsername: string
  friendsInSalon: number
  /** secondes jusqu’à fin démo badge match */
  expiresInLabel: string
}

export const mockBroncaSnapshot: MockBroncaSnapshot = {
  matchLabel: 'Replay démo (tribune)',
  leaderUsername: 'SarahGoal',
  friendsInSalon: 3,
  expiresInLabel: 'jusqu’à la fin du live',
}

export type MockStreakRow = {
  id: string
  label: string
  days: number
  hint: string
}

export const mockStreakRows: MockStreakRow[] = [
  {
    id: 's1',
    label: 'Série « même jour »',
    days: 5,
    hint: 'Tu as ouvert l’app ou envoyé un message à un ami chaque jour.',
  },
  {
    id: 's2',
    label: 'Co-présence live',
    days: 2,
    hint: 'Deux soirs d’affilée avec au moins un ami sur le même match.',
  },
]
