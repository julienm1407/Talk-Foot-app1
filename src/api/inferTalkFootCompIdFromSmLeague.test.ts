import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { inferTalkFootCompIdFromSmLeague } from './footballApi'

describe('inferTalkFootCompIdFromSmLeague', () => {
  it('mappe les ids SportMonks amicaux (pas l’Eredivisie 72)', () => {
    assert.equal(inferTalkFootCompIdFromSmLeague({ id: 1082 }), 'amicaux')
    assert.equal(inferTalkFootCompIdFromSmLeague({ id: 1325 }), 'amicaux')
    assert.equal(inferTalkFootCompIdFromSmLeague({ id: 1101 }), 'amicaux')
    assert.equal(inferTalkFootCompIdFromSmLeague({ id: 72, name: 'Eredivisie' }), 'ext-72')
  })

  it('reconnaît le nom et le sub_type friendly', () => {
    assert.equal(inferTalkFootCompIdFromSmLeague({ name: 'International Friendlies' }), 'amicaux')
    assert.equal(inferTalkFootCompIdFromSmLeague({ name: 'Club Friendlies 1' }), 'amicaux')
    assert.equal(inferTalkFootCompIdFromSmLeague({ name: 'Matchs amicaux' }), 'amicaux')
    assert.equal(inferTalkFootCompIdFromSmLeague({ id: 9999, sub_type: 'friendly' }), 'amicaux')
  })
})
