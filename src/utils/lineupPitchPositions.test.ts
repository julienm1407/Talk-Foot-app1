import assert from 'node:assert/strict'
import test from 'node:test'
import { computeLineupPitchLayout } from './lineupPitchPositions'

function leftPct(layout: ReturnType<typeof computeLineupPitchLayout>, row: number, surname: string): number {
  const player = layout.rows
    .find((r) => r.row === row)
    ?.players.find((p) => p.fullName.includes(surname))
  assert.ok(player, `missing ${surname} on row ${row}`)
  return player.leftPct
}

/** France vs Senegal 2026 — données SportMonks (domicile). */
const FRANCE_HOME = [
  { label: 'Mike Maignan', number: '16', formationField: '1:1', formationPosition: 1 },
  { label: 'Jules Koundé', number: '5', formationField: '2:1', formationPosition: 2 },
  { label: 'William Saliba', number: '17', formationField: '2:2', formationPosition: 3 },
  { label: 'Dayot Upamecano', number: '4', formationField: '2:3', formationPosition: 4 },
  { label: 'Theo Hernández', number: '19', formationField: '2:4', formationPosition: 5 },
  { label: 'Aurélien Tchouaméni', number: '8', formationField: '3:1', formationPosition: 6 },
  { label: 'Adrien Rabiot', number: '14', formationField: '3:2', formationPosition: 7 },
  { label: 'Michael Olise', number: '11', formationField: '4:1', formationPosition: 8 },
  { label: 'Ousmane Dembélé', number: '7', formationField: '4:2', formationPosition: 9 },
  { label: 'Désiré Doué', number: '20', formationField: '4:3', formationPosition: 10 },
  { label: 'Kylian Mbappé', number: '10', formationField: '5:1', formationPosition: 11 },
]

/** Même match — Sénégal extérieur (cols SM inversés vs formation_position). */
const SENEGAL_AWAY = [
  { label: 'Edouard Mendy', number: '16', formationField: '1:1', formationPosition: 1 },
  { label: 'Krépin Diatta', number: '15', formationField: '2:4', formationPosition: 2 },
  { label: 'Kalidou Koulibaly', number: '3', formationField: '2:3', formationPosition: 3 },
  { label: 'Moussa Niakhaté', number: '19', formationField: '2:2', formationPosition: 4 },
  { label: 'El Hadji Malick Diouf', number: '25', formationField: '2:1', formationPosition: 5 },
  { label: 'Lamine Camara', number: '8', formationField: '3:3', formationPosition: 6 },
  { label: 'Idrissa Gueye', number: '5', formationField: '3:2', formationPosition: 7 },
  { label: 'Pape Gueye', number: '26', formationField: '3:1', formationPosition: 8 },
  { label: 'Ismaïla Sarr', number: '18', formationField: '4:3', formationPosition: 9 },
  { label: 'Nicolas Jackson', number: '11', formationField: '4:2', formationPosition: 10 },
  { label: 'Sadio Mané', number: '10', formationField: '4:1', formationPosition: 11 },
]

test('France 4-2-3-1 : défense droite → gauche (Saliba RCB à droite de Upamecano)', () => {
  const layout = computeLineupPitchLayout(FRANCE_HOME, '4-2-3-1')
  assert.ok(leftPct(layout, 2, 'Hernández') < leftPct(layout, 2, 'Upamecano'))
  assert.ok(leftPct(layout, 2, 'Upamecano') < leftPct(layout, 2, 'Saliba'))
  assert.ok(leftPct(layout, 2, 'Saliba') < leftPct(layout, 2, 'Koundé'))
})

test('Sénégal extérieur : latéraux et ailiers non inversés malgré cols SM miroir', () => {
  const layout = computeLineupPitchLayout(SENEGAL_AWAY, '4-2-3-1')
  assert.ok(leftPct(layout, 2, 'Diouf') < leftPct(layout, 2, 'Diatta'))
  assert.ok(leftPct(layout, 4, 'Mané') < leftPct(layout, 4, 'Sarr'))
})
