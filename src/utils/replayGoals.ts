/**
 * Construit la timeline des buts pour un replay à partir des scores mi-temps / fin de match.
 * Répartition déterministe : 1re mi-temps 5'-45', 2e mi-temps 50'-88'.
 */
export type GoalEvent = { minute: number; side: 'home' | 'away' }

export function buildGoalTimeline(
  htHome: number,
  htAway: number,
  ftHome: number,
  ftAway: number,
  seed: number = 0,
): GoalEvent[] {
  const events: GoalEvent[] = []
  let idx = 0

  // 1re mi-temps : répartition entre 5' et 45'
  const firstHalfSlots = [
    8, 15, 22, 28, 35, 42, 45,
  ]
  for (let i = 0; i < htHome; i++) {
    const slot = firstHalfSlots[idx++ % firstHalfSlots.length]
    events.push({ minute: slot + ((seed + i) % 3), side: 'home' })
  }
  for (let i = 0; i < htAway; i++) {
    const slot = firstHalfSlots[idx++ % firstHalfSlots.length]
    events.push({ minute: slot + ((seed + i + 1) % 3), side: 'away' })
  }

  // 2e mi-temps : répartition entre 50' et 88'
  const secondHalfSlots = [
    52, 58, 65, 72, 78, 85, 88,
  ]
  const secondHome = ftHome - htHome
  const secondAway = ftAway - htAway
  for (let i = 0; i < secondHome; i++) {
    const slot = secondHalfSlots[idx++ % secondHalfSlots.length]
    events.push({ minute: slot + ((seed + i) % 4), side: 'home' })
  }
  for (let i = 0; i < secondAway; i++) {
    const slot = secondHalfSlots[idx++ % secondHalfSlots.length]
    events.push({ minute: slot + ((seed + i + 2) % 4), side: 'away' })
  }

  return events.sort((a, b) => a.minute - b.minute)
}
