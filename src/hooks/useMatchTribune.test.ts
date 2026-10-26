import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import {
  MATCH_TRIBUNE_ZONE_KEY,
  readMatchTribuneZone,
  writeMatchTribuneZone,
} from './useMatchTribune'

const mem = new Map<string, string>()

beforeEach(() => {
  mem.clear()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, v)
      },
      removeItem: (k: string) => {
        mem.delete(k)
      },
    },
  })
})

describe('match tribune persistence', () => {
  it('revient sur le parcage (away-ultras) du même match', () => {
    assert.equal(readMatchTribuneZone('m-sm-1'), 'neutres')
    writeMatchTribuneZone('m-sm-1', 'away-ultras')
    assert.equal(readMatchTribuneZone('m-sm-1'), 'away-ultras')
    assert.equal(readMatchTribuneZone('m-sm-2'), 'neutres')
  })

  it('ignore une valeur invalide déjà en storage', () => {
    mem.set(MATCH_TRIBUNE_ZONE_KEY, JSON.stringify({ 'm-sm-1': 'virage' }))
    assert.equal(readMatchTribuneZone('m-sm-1'), 'neutres')
  })
})
