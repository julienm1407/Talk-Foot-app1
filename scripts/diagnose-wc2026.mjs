#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
function loadToken() {
  for (const name of ['.env.local', '.env']) {
    const p = resolve(root, name)
    if (!existsSync(p)) continue
    const text = readFileSync(p, 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^(?:SPORTMONKS_TOKEN|VITE_SPORTMONKS_TOKEN)=(.*)$/)
      if (m?.[1]?.trim()) return m[1].trim()
    }
  }
  return process.env.SPORTMONKS_TOKEN || process.env.VITE_SPORTMONKS_TOKEN || ''
}

const token = loadToken()
if (!token) {
  console.error('Pas de token (SPORTMONKS_TOKEN dans .env.local)')
  process.exit(1)
}

const seasonId = 26618
const base = 'https://api.sportmonks.com/v3/football'

function countScheduleFixtures(data) {
  if (!Array.isArray(data)) return 0
  let n = 0
  for (const row of data) {
    if (!row || typeof row !== 'object') continue
    if (Array.isArray(row.rounds)) {
      for (const rnd of row.rounds) {
        if (Array.isArray(rnd?.fixtures)) n += rnd.fixtures.length
      }
    } else if (typeof row.id === 'number' && row.starting_at) n += 1
  }
  return n
}

async function probe(label, path, opts = {}) {
  const url = `${base}${path}`
  const res = await fetch(url, { headers: { Authorization: token } })
  const text = await res.text()
  let count = '?'
  try {
    const j = JSON.parse(text)
    if (opts.schedule) count = String(countScheduleFixtures(j.data))
    else if (Array.isArray(j.data)) count = String(j.data.length)
    else if (j.data && typeof j.data === 'object') count = 'object'
  } catch {
    /* */
  }
  console.log(`${label}: HTTP ${res.status} — ${opts.schedule ? 'fixtures dans schedule' : 'data items'}: ${count}`)
  if (res.status >= 400) console.log('  ', text.slice(0, 220))
  if (jMessage(text)) console.log('  message:', jMessage(text))
}

function jMessage(text) {
  try {
    const j = JSON.parse(text)
    return typeof j.message === 'string' ? j.message : null
  } catch {
    return null
  }
}

await probe('schedules/seasons', `/schedules/seasons/${seasonId}`, { schedule: true })
await probe('fixtures saison', `/fixtures?filters=fixtureSeasons:${seasonId}&per_page=10`)
await probe('between juin', `/fixtures/between/2026-06-01/2026-06-30?per_page=10`)
