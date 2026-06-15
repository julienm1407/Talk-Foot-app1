import { describe, expect, it } from 'vitest'
import {
  createDefaultModularAvatarState,
  resolveModularAvatarState,
  sanitizeModularAvatarState,
} from './modularAvatarState'

describe('modularAvatarState optional slots', () => {
  it('keeps hair null (chauve) after resolve and sanitize', () => {
    const bald = createDefaultModularAvatarState()
    bald.data.hair = null

    const resolved = resolveModularAvatarState(bald)
    expect(resolved.data.hair).toBeNull()

    const sanitized = sanitizeModularAvatarState(resolved)
    expect(sanitized.data.hair).toBeNull()
  })

  it('keeps beard null (sans barbe) after resolve and sanitize', () => {
    const noBeard = createDefaultModularAvatarState()
    noBeard.data.beard = null

    const resolved = resolveModularAvatarState(noBeard)
    expect(resolved.data.beard).toBeNull()

    const sanitized = sanitizeModularAvatarState(resolved)
    expect(sanitized.data.beard).toBeNull()
  })
})
