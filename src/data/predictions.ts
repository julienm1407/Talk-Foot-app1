import type { Prediction } from '../types/prediction'

const now = Date.now()
const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60_000).toISOString()
const inDays = (d: number) => new Date(now + d * 24 * 60 * 60_000).toISOString()

export const mockPredictions: Prediction[] = [
  {
    id: 'p-1',
    createdAt: daysAgo(8),
    match: {
      id: 'pm-psg-om-1',
      competition: { id: 'ligue-1', name: 'Ligue 1', shortName: 'L1' },
      home: { id: 'psg', name: 'Paris SG', shortName: 'PSG' },
      away: { id: 'om', name: 'Marseille', shortName: 'OM' },
      kickoffAt: daysAgo(7),
    },
    predictedScore: { home: 2, away: 1 },
    actualScore: { home: 2, away: 1 },
    outcome: 'won',
    points: 12,
  },
  {
    id: 'p-2',
    createdAt: daysAgo(6),
    match: {
      id: 'pm-rma-fcb-1',
      competition: { id: 'laliga', name: 'LaLiga', shortName: 'LL' },
      home: { id: 'rma', name: 'Real Madrid', shortName: 'RMA' },
      away: { id: 'fcb', name: 'Barcelona', shortName: 'FCB' },
      kickoffAt: daysAgo(5),
    },
    predictedScore: { home: 1, away: 1 },
    actualScore: { home: 2, away: 1 },
    outcome: 'lost',
    points: 0,
  },
  {
    id: 'p-3',
    createdAt: daysAgo(4),
    match: {
      id: 'pm-mci-liv-1',
      competition: { id: 'epl', name: 'Premier League', shortName: 'EPL' },
      home: { id: 'mci', name: 'Man City', shortName: 'MCI' },
      away: { id: 'liv', name: 'Liverpool', shortName: 'LIV' },
      kickoffAt: daysAgo(3),
    },
    predictedScore: { home: 3, away: 2 },
    actualScore: { home: 2, away: 2 },
    outcome: 'lost',
    points: 0,
  },
  {
    id: 'p-4',
    createdAt: daysAgo(2),
    match: {
      id: 'pm-inter-juve-1',
      competition: { id: 'serie-a', name: 'Serie A', shortName: 'SA' },
      home: { id: 'int', name: 'Inter', shortName: 'INT' },
      away: { id: 'juv', name: 'Juventus', shortName: 'JUV' },
      kickoffAt: daysAgo(1),
    },
    predictedScore: { home: 1, away: 0 },
    actualScore: { home: 1, away: 0 },
    outcome: 'won',
    points: 10,
  },
  {
    id: 'p-5',
    createdAt: daysAgo(1),
    match: {
      id: 'pm-psg-om-2',
      competition: { id: 'ligue-1', name: 'Ligue 1', shortName: 'L1' },
      home: { id: 'psg', name: 'Paris SG', shortName: 'PSG' },
      away: { id: 'om', name: 'Marseille', shortName: 'OM' },
      kickoffAt: inDays(1),
    },
    predictedScore: { home: 2, away: 0 },
    outcome: 'pending',
    points: 0,
  },
  {
    id: 'p-6',
    createdAt: daysAgo(0),
    match: {
      id: 'pm-bvb-bay-2',
      competition: { id: 'bund', name: 'Bundesliga', shortName: 'BUN' },
      home: { id: 'bvb', name: 'Dortmund', shortName: 'BVB' },
      away: { id: 'bay', name: 'Bayern', shortName: 'BAY' },
      kickoffAt: inDays(3),
    },
    predictedScore: { home: 1, away: 2 },
    outcome: 'pending',
    points: 0,
  },
]

