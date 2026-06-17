export type Match1x2BetCounts = {
  home: number
  draw: number
  away: number
}

const STORAGE_KEY = 'talkfoot.match1x2Volume.v1'

function readAll(): Record<string, Match1x2BetCounts> {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, Match1x2BetCounts>
  } catch {
    return {}
  }
}

function writeAll(data: Record<string, Match1x2BetCounts>) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* quota */
  }
}

export function emptyMatch1x2BetCounts(): Match1x2BetCounts {
  return { home: 0, draw: 0, away: 0 }
}

export function readLocalMatch1x2BetCounts(matchId: string): Match1x2BetCounts {
  const row = readAll()[matchId]
  if (!row) return emptyMatch1x2BetCounts()
  return {
    home: Math.max(0, Number(row.home) || 0),
    draw: Math.max(0, Number(row.draw) || 0),
    away: Math.max(0, Number(row.away) || 0),
  }
}

export function recordLocalMatch1x2Bet(matchId: string, selection: 'home' | 'draw' | 'away') {
  if (!matchId) return
  const all = readAll()
  const cur = readLocalMatch1x2BetCounts(matchId)
  cur[selection] += 1
  all[matchId] = cur
  writeAll(all)
}

/** Parts en % des paris 1N2 (0 si aucun pari sur le match). */
export function match1x2BetShares(counts: Match1x2BetCounts): [number, number, number] {
  const total = counts.home + counts.draw + counts.away
  if (total <= 0) return [0, 0, 0]
  const home = Math.round((counts.home / total) * 100)
  const draw = Math.round((counts.draw / total) * 100)
  const away = Math.max(0, 100 - home - draw)
  return [home, draw, away]
}

export function mergeMatch1x2BetCounts(
  a: Match1x2BetCounts,
  b: Match1x2BetCounts,
): Match1x2BetCounts {
  return {
    home: a.home + b.home,
    draw: a.draw + b.draw,
    away: a.away + b.away,
  }
}
