import { describe, expect, it } from 'vitest'
import { defaultUserProfile } from '../data/userAppStateDefaults'
import { buildCdmBetaBadge, isCdmBetaParticipantEligible, withCdmBetaParticipant } from './cdmBetaParticipant'
import { buildPronoBadges, computePronoHubStats } from './pronoStatsFromBets'

describe('cdmBetaParticipant', () => {
  it('accorde le badge pendant la fenêtre beta', () => {
    const granted = withCdmBetaParticipant(defaultUserProfile, Date.parse('2026-08-01T12:00:00.000Z'))
    expect(granted.cdmBetaParticipant).toBe(true)
  })

  it('refuse le badge après la date limite', () => {
    const denied = withCdmBetaParticipant(defaultUserProfile, Date.parse('2026-08-15T00:00:00.000Z'))
    expect(denied.cdmBetaParticipant).toBeUndefined()
  })

  it('conserve un badge déjà accordé', () => {
    const already = { ...defaultUserProfile, cdmBetaParticipant: true }
    expect(withCdmBetaParticipant(already, Date.parse('2026-09-01T00:00:00.000Z')).cdmBetaParticipant).toBe(true)
  })

  it('expose le badge dans buildPronoBadges', () => {
    const stats = computePronoHubStats([])
    const badges = buildPronoBadges(stats, false, { cdmBetaParticipant: true })
    expect(badges[0]?.kind).toBe('beta')
    expect(badges[0]?.label).toBe('Beta CDM 2026')
  })

  it('buildCdmBetaBadge a un libellé stable', () => {
    expect(buildCdmBetaBadge(true).hint).toMatch(/beta Coupe du Monde/i)
    expect(isCdmBetaParticipantEligible(Date.parse('2026-08-14T20:00:00.000Z'))).toBe(true)
  })
})
