import { useEffect, useState } from 'react'
import type { TribuneId } from '../types/tribune'

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

/** Stats mock animées par tribune (spectateurs + activité %) — même source que la page stade. */
export function useTribuneLiveStats() {
  const [stats, setStats] = useState<Record<TribuneId, { participants: number; activity: number }>>({
    virage: { participants: 428, activity: 86 },
    analyse: { participants: 156, activity: 52 },
    chill: { participants: 203, activity: 38 },
  })

  useEffect(() => {
    const id = window.setInterval(() => {
      setStats((s) => ({
        virage: {
          participants: clamp(s.virage.participants + ((Math.random() * 8) | 0) - 3, 380, 620),
          activity: clamp(s.virage.activity + ((Math.random() * 10) | 0) - 4, 55, 98),
        },
        analyse: {
          participants: clamp(s.analyse.participants + ((Math.random() * 6) | 0) - 2, 120, 220),
          activity: clamp(s.analyse.activity + ((Math.random() * 8) | 0) - 3, 35, 72),
        },
        chill: {
          participants: clamp(s.chill.participants + ((Math.random() * 6) | 0) - 2, 160, 280),
          activity: clamp(s.chill.activity + ((Math.random() * 8) | 0) - 3, 22, 55),
        },
      }))
    }, 1800)
    return () => window.clearInterval(id)
  }, [])

  return stats
}

export function aggregateTribuneStats(stats: Record<TribuneId, { participants: number; activity: number }>) {
  const participants = stats.virage.participants + stats.analyse.participants + stats.chill.participants
  const activity = Math.round(
    (stats.virage.activity + stats.analyse.activity + stats.chill.activity) / 3,
  )
  return { participants, activity }
}
