import { useSeasonMode } from '../contexts/SeasonModeContext'
import { RankingsLeaguesView } from '../components/rankings/RankingsLeaguesView'
import { RankingsWc2026View } from '../components/rankings/RankingsWc2026View'

export function RankingsPage() {
  const { isCdm2026 } = useSeasonMode()

  if (isCdm2026) {
    return <RankingsWc2026View />
  }

  return <RankingsLeaguesView />
}
