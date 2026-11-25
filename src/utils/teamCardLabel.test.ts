import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { hubTeamLabel, shortNameFromApiTeamName } from './teamCardLabel'

describe('teamCardLabel', () => {
  it('n’abrège pas FC Bayern en FC', () => {
    assert.equal(shortNameFromApiTeamName('FC Bayern München'), 'Bayern')
    assert.equal(hubTeamLabel({ name: 'FC Bayern München', shortName: 'FC ' }), 'Bayern')
    assert.equal(hubTeamLabel({ name: 'Lille', shortName: 'LIL' }), 'Lille')
  })

  it('affiche Lille – Bayern de façon lisible', () => {
    const home = hubTeamLabel({ name: 'Lille OSC', shortName: 'LIL' })
    const away = hubTeamLabel({ name: 'FC Bayern Munich', shortName: 'FC' })
    assert.equal(`${home} – ${away}`, 'Lille – Bayern')
  })
})
