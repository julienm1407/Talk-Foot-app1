import type { Match } from '../types/match'
import { teams, teamColors } from '../data/teams'
import type { ApiFixture } from './footballApi'
import { apiNameToOurId, COMP_NAMES } from './footballApi'

function getTeam(
  compId: string,
  apiName: string,
): { id: string; name: string; shortName: string; colors: { primary: string; secondary: string } } {
  const ourId = apiNameToOurId(apiName)
  const compTeams = teams[compId as keyof typeof teams]
  if (!compTeams) {
    return {
      id: ourId,
      name: apiName,
      shortName: apiName.slice(0, 3).toUpperCase(),
      colors: { primary: '#111827', secondary: '#f9fafb' },
    }
  }
  const t = compTeams.find((x) => x.id === ourId)
  if (t) return t
  const [primary, secondary] = teamColors[ourId] ?? ['#111827', '#f9fafb']
  return {
    id: ourId,
    name: apiName,
    shortName: apiName.slice(0, 3).toUpperCase(),
    colors: { primary, secondary },
  }
}

export function apiFixtureToMatch(f: ApiFixture & { compId: string }): Match {
  const comp = COMP_NAMES[f.compId] ?? { name: f.league.name, shortName: f.league.name.slice(0, 2) }
  const home = getTeam(f.compId, f.teams.home.name)
  const away = getTeam(f.compId, f.teams.away.name)

  const statusShort = f.fixture.status.short
  let status: 'upcoming' | 'live' | 'finished' = 'upcoming'
  if (['FT', 'AET', 'PEN_LIVE'].includes(statusShort)) status = 'finished'
  else if (['1H', '2H', 'HT', 'ET', 'P'].includes(statusShort)) status = 'live'

  const id = `m-api-${f.fixture.id}`

  return {
    id,
    competition: { id: f.compId, name: comp.name, shortName: comp.shortName },
    home,
    away,
    kickoffAt: f.fixture.date,
    status,
    ...(status === 'live' && {
      minute: f.fixture.status.elapsed ?? 0,
      score: {
        home: f.goals.home ?? 0,
        away: f.goals.away ?? 0,
      },
    }),
    ...(status === 'finished' &&
      f.goals.home != null &&
      f.goals.away != null && {
        score: { home: f.goals.home, away: f.goals.away },
      }),
  }
}
