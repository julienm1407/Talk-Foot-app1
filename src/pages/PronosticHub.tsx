import { Navigate } from 'react-router-dom'
import { useMatches } from '../contexts/MatchesContext'

/**
 * Porte d’entrée nav « Pronostic » : salon live (paris) si dispo, sinon calendrier matchs.
 */
export function PronosticHubPage() {
  const { matches } = useMatches()
  const live = matches.find((m) => m.status === 'live')
  if (live) {
    return <Navigate to={`/channel/${live.id}?paris=1`} replace />
  }
  const upcoming = matches.find((m) => m.status === 'upcoming')
  if (upcoming) {
    return <Navigate to={`/channel/${upcoming.id}?paris=1`} replace />
  }
  return <Navigate to="/match" replace />
}
