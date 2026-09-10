import { describe, expect, it } from 'vitest'
import { GOOGLE_PLAY_REVIEW_EMAIL, isAdminEmail, isGooglePlayReviewEmail } from './adminAccess'

describe('adminAccess', () => {
  it('accorde toujours admin au compte Google Play Review', () => {
    expect(isAdminEmail(GOOGLE_PLAY_REVIEW_EMAIL)).toBe(true)
    expect(isAdminEmail('TalkFootTest@Gmail.com')).toBe(true)
    expect(isGooglePlayReviewEmail('talkfoottest@gmail.com')).toBe(true)
  })

  it('refuse un email hors liste', () => {
    expect(isAdminEmail('random-user@example.com')).toBe(false)
    expect(isAdminEmail('')).toBe(false)
    expect(isAdminEmail(null)).toBe(false)
  })
})
