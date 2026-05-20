import { useEffect, useState } from 'react'
import type { Match } from '../types/match'
import type { FormResult } from '../types/standings'
import { fetchSportMonksTeamUpcoming, lastFiveFormFromTeamLatestEnvelope } from '../api/sportMonks'
import { getSportMonksToken } from '../utils/apiTokens'

function vnToWlForm(strip: Array<'V' | 'N' | 'D'>): FormResult[] {
  return strip.map((v) => (v === 'V' ? 'W' : v === 'N' ? 'D' : 'L'))
}

/**
 * Repli « forme » comme sur la fiche club : `GET /teams/{id}` + `latest` (derniers matchs terminés).
 * Utilisé seulement si les tendances fixture + lineups n’ont pas fourni de bandeau W/D/L.
 */
export function useSportMonksTeamLatestFormPair(match: Match | null, enabled: boolean) {
  const [form, setForm] = useState<{ home: FormResult[]; away: FormResult[] } | null>(null)
  const [loading, setLoading] = useState(false)

  const hSm = match?.home.sportMonksTeamId
  const aSm = match?.away.sportMonksTeamId

  useEffect(() => {
    if (!match || !enabled || hSm == null || aSm == null) {
      setForm(null)
      setLoading(false)
      return
    }
    const token = getSportMonksToken()
    if (!token) {
      setForm(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setForm(null)
    Promise.all([fetchSportMonksTeamUpcoming(token, hSm), fetchSportMonksTeamUpcoming(token, aSm)])
      .then(([envH, envA]) => {
        if (cancelled) return
        const hStrip = lastFiveFormFromTeamLatestEnvelope(envH, match.home.id, { sportMonksTeamId: hSm })
        const aStrip = lastFiveFormFromTeamLatestEnvelope(envA, match.away.id, { sportMonksTeamId: aSm })
        if (!hStrip?.length && !aStrip?.length) {
          setForm(null)
          return
        }
        setForm({
          home: hStrip?.length ? vnToWlForm(hStrip) : [],
          away: aStrip?.length ? vnToWlForm(aStrip) : [],
        })
      })
      .catch(() => {
        if (!cancelled) setForm(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled, hSm, aSm, match?.away.id, match?.home.id, match?.id])

  return { teamPairForm: form, teamPairFormLoading: loading }
}
