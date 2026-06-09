import { describe, expect, it } from 'vitest'
import {
  betWinTokenCredit,
  canCreateDebate,
  canCreateGroup,
  canJoinGroup,
  createGroupLimitMessage,
  joinGroupLimitMessage,
  effectiveTier,
  liveMatchTokenGrantAllowed,
  liveTokensEarnedThisHour,
  monthlyTokenGrantEligible,
  normalizeSubscription,
  toLocalHourKey,
  toLocalMonthKey,
} from './subscriptionEntitlements'

describe('subscriptionEntitlements', () => {
  it('effectiveTier repasse freemium après activeUntil', () => {
    const sub = normalizeSubscription({
      tier: 'supporter_plus',
      activeUntil: new Date(Date.now() - 86400000).toISOString(),
    })
    expect(effectiveTier(sub)).toBe('freemium')
  })

  it('canCreateGroup respecte le plafond freemium', () => {
    expect(canCreateGroup('freemium', 2).ok).toBe(false)
    expect(canCreateGroup('freemium', 1).ok).toBe(true)
  })

  it('canJoinGroup freemium max 5 tribunes au total', () => {
    expect(canJoinGroup('freemium', 5).ok).toBe(false)
    expect(canJoinGroup('freemium', 4).ok).toBe(true)
    expect(canJoinGroup('supporter_plus', 99).ok).toBe(true)
  })

  it('messages de limite tribunes freemium', () => {
    expect(joinGroupLimitMessage('freemium', 5, 5)).toContain('5/5')
    expect(joinGroupLimitMessage('freemium', 5, 4)).toContain('4/5')
    expect(createGroupLimitMessage('freemium', 2)).toContain('tribunes créées')
  })

  it('freemium ne peut pas créer de débat', () => {
    expect(canCreateDebate('freemium', {}).ok).toBe(false)
    expect(canCreateDebate('supporter_plus', {}).ok).toBe(true)
  })

  it('admin contourne les limites de débats', () => {
    expect(canCreateDebate('freemium', {}, new Date(), true).ok).toBe(true)
    expect(
      canCreateDebate(
        'supporter_plus',
        { debatesWeekKey: '2099-W01', debatesCreatedThisWeek: 99 },
        new Date('2099-01-10T12:00:00'),
        true,
      ).ok,
    ).toBe(true)
  })

  it('betWinTokenCredit double le profit au ×2', () => {
    expect(betWinTokenCredit(200, 100, 2)).toBe(300)
    expect(betWinTokenCredit(200, 100, 1)).toBe(200)
  })

  it('liveMatchTokenGrantAllowed plafond 40/h', () => {
    const hour = toLocalHourKey()
    expect(liveMatchTokenGrantAllowed('freemium', {}, 1).limit).toBe(40)
    expect(
      liveMatchTokenGrantAllowed('freemium', { liveTokensHourKey: hour, liveTokensThisHour: 40 }, 1)
        .ok,
    ).toBe(false)
    expect(liveTokensEarnedThisHour({ liveTokensHourKey: hour, liveTokensThisHour: 12 })).toBe(12)
  })

  it('monthlyTokenGrantEligible une fois par mois', () => {
    const month = toLocalMonthKey()
    expect(monthlyTokenGrantEligible('supporter_plus', {})).toBe(true)
    expect(monthlyTokenGrantEligible('freemium', {})).toBe(false)
    expect(
      monthlyTokenGrantEligible('supporter_plus', { monthlyTokensMonthKey: month }),
    ).toBe(false)
  })
})
