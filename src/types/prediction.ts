export type PredictionOutcome = 'won' | 'lost' | 'pending'

export type PredictionMatchRef = {
  id: string
  competition: { id: string; name: string; shortName: string }
  home: { id: string; name: string; shortName: string; colors?: { primary: string; secondary: string } }
  away: { id: string; name: string; shortName: string; colors?: { primary: string; secondary: string } }
  kickoffAt: string
}

export type Score = { home: number; away: number }

export type Prediction = {
  id: string
  match: PredictionMatchRef
  predictedScore: Score
  actualScore?: Score
  outcome: PredictionOutcome
  points: number
  createdAt: string
}

