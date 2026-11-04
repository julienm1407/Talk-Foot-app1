import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  classifyLiveMatchEvent,
  liveAlertsFromFixture,
  sportMonksFixtureIdFromMatch,
} from './liveMatchAlertEvents'

describe('liveMatchAlertEvents', () => {
  it('détecte un but via type_id même sans libellé', () => {
    const alert = classifyLiveMatchEvent({
      id: 88,
      type_id: 14,
      minute: 12,
      player: { display_name: 'Come' },
    })
    assert.equal(alert?.kind, 'g:88')
    assert.match(alert?.body ?? '', /BUT/)
    assert.match(alert?.body ?? '', /Come/)
  })

  it('ignore un but refusé', () => {
    assert.equal(
      classifyLiveMatchEvent({
        id: 1,
        type: { developer_name: 'GOAL_DISALLOWED' },
      }),
      null,
    )
  })

  it('extrait l’id SportMonks', () => {
    assert.equal(sportMonksFixtureIdFromMatch({ id: 'm-sm-194012' }), 194012)
  })

  it('déduplique les events d’une fixture', () => {
    const alerts = liveAlertsFromFixture({
      events: [
        { id: 1, type_id: 14, minute: 9, player: { name: 'Come' } },
        { id: 1, type_id: 14, minute: 9, player: { name: 'Come' } },
      ],
    })
    assert.equal(alerts.length, 1)
  })
})
