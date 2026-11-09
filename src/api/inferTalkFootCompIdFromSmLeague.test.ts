import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { inferTalkFootCompIdFromSmLeague } from './footballApi'

describe('inferTalkFootCompIdFromSmLeague', () => {
  it('mappe la Coupe de France, pas les amicaux clubs', () => {
    assert.equal(inferTalkFootCompIdFromSmLeague({ id: 307 }), 'cdf')
    assert.equal(inferTalkFootCompIdFromSmLeague({ name: 'Coupe de France' }), 'cdf')
    assert.equal(inferTalkFootCompIdFromSmLeague({ id: 1101, name: 'Club Friendlies 1' }), 'ext-1101')
  })
})
