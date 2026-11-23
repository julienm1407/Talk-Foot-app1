import { useEffect, useRef } from 'react'
import type { Highlight } from '../data/highlights'
import type { Match } from '../types/match'
import { cardColorFromHighlightText } from '../utils/liveFootballOdds'
import type { TribunePollOption } from '../lib/supabase/tribunePolls'
import { postOfficialTribune } from '../lib/supabase/tribunePolls'

type EnsurePoll = (input: {
  question: string
  options: TribunePollOption[]
  kind: string
  triggerKey: string
  officialBody?: string
  minute?: number | null
}) => Promise<void>

function playerOptions(labels: string[], prefix: string, max = 8): TribunePollOption[] {
  return labels
    .filter(Boolean)
    .slice(0, max)
    .map((label, i) => ({ id: `${prefix}-${i}`, label }))
}

export function useTribuneAutoPolls({
  match,
  status,
  minute,
  homeScore,
  awayScore,
  highlights,
  homeStarters,
  awayStarters,
  ensurePoll,
}: {
  match: Match | null
  status: string
  minute: number
  homeScore: number
  awayScore: number
  highlights: Highlight[]
  homeStarters: string[]
  awayStarters: string[]
  ensurePoll: EnsurePoll
}) {
  const primed = useRef(false)
  const seenKeys = useRef(new Set<string>())

  useEffect(() => {
    primed.current = false
    seenKeys.current = new Set()
  }, [match?.id])

  useEffect(() => {
    if (!match?.id) return
    if (status !== 'live') return
    if (!primed.current) {
      primed.current = true
      return
    }

    const fire = (key: string, payload: Parameters<EnsurePoll>[0]) => {
      if (seenKeys.current.has(key)) return
      seenKeys.current.add(key)
      void ensurePoll(payload)
    }

    if (minute <= 8) {
      fire(`kickoff:${match.id}`, {
        kind: 'kickoff_first_goal',
        triggerKey: `kickoff:${match.id}`,
        question: 'Qui marque en premier ?',
        options: [
          { id: 'home', label: match.home.shortName },
          { id: 'away', label: match.away.shortName },
          { id: 'none', label: 'Personne' },
        ],
        officialBody: `Coup d’envoi ! Sondage : qui marque en premier ?`,
        minute: 1,
      })
    }

    if (minute >= 45 && minute < 50) {
      const losing = homeScore === awayScore ? null : homeScore < awayScore ? 'home' : 'away'
      const pool = losing === 'away' ? awayStarters : losing === 'home' ? homeStarters : [...homeStarters, ...awayStarters]
      const opts = playerOptions(pool, 'off', 6)
      if (opts.length >= 2) {
        fire(`ht:${match.id}`, {
          kind: 'ht_off',
          triggerKey: `ht:${match.id}`,
          question: 'Qui doit sortir ?',
          options: opts,
          officialBody: 'Mi-temps — vous la sentez comment cette 2e mi-temps ? Sondage : qui doit sortir ?',
          minute: 45,
        })
      }
    }

    if (minute >= 80) {
      const opts = playerOptions([...homeStarters, ...awayStarters], 'motm', 8)
      if (opts.length >= 2) {
        fire(`motm:${match.id}`, {
          kind: 'motm',
          triggerKey: `motm:${match.id}`,
          question: 'Homme du match ?',
          options: opts,
          officialBody: '80e minute — sondage : homme du match ?',
          minute: 80,
        })
      }
    }
  }, [
    match,
    status,
    minute,
    homeScore,
    awayScore,
    homeStarters,
    awayStarters,
    ensurePoll,
  ])

  useEffect(() => {
    if (!match?.id || status !== 'live') return
    for (const h of highlights) {
      const raw = `${h.title ?? ''} ${h.detail ?? ''} ${h.type ?? ''}`
      const red = cardColorFromHighlightText(raw) === 'red' || /rouge|red card/i.test(raw)
      const pen = /penalty|pénalty|penalti|peno/i.test(raw)
      if (!red && !pen) continue
      const key = `dec:${match.id}:${h.id}`
      if (seenKeys.current.has(key)) continue
      seenKeys.current.add(key)
      void ensurePoll({
        kind: 'decision',
        triggerKey: key,
        question: 'Décision juste ?',
        options: [
          { id: 'yes', label: 'Oui' },
          { id: 'no', label: 'Non' },
        ],
        officialBody: `${red ? 'Carton rouge' : 'Penalty'} ${h.minute ?? ''}’ — sondage : décision juste ?`,
        minute: typeof h.minute === 'number' ? h.minute : null,
      })
    }
  }, [highlights, match, status, ensurePoll])
}

export function useTribuneOfficialMatchPosts({
  match,
  status,
  highlights,
  homeName,
  awayName,
}: {
  match: Match | null
  status: string
  highlights: Highlight[]
  homeName: string
  awayName: string
}) {
  const primed = useRef(false)
  useEffect(() => {
    primed.current = false
  }, [match?.id])

  useEffect(() => {
    if (!match?.id || status !== 'live') return
    if (!primed.current) {
      primed.current = true
      return
    }
    for (const h of highlights) {
      const raw = `${h.title ?? ''} ${h.detail ?? ''} ${h.type ?? ''}`
      const min = typeof h.minute === 'number' ? h.minute : null
      const team = h.side === 'home' ? homeName : h.side === 'away' ? awayName : ''
      if (h.type === 'But' || /but|goal/i.test(raw)) {
        void postOfficialTribune(
          match.id,
          `${min ?? '?'}’ BUT${team ? ` ${team}` : ''}${h.scorerName ? ` — ${h.scorerName}` : ''}`.trim(),
          min,
          `goal:${h.id}`,
        )
      } else if (cardColorFromHighlightText(raw) === 'red' || /rouge|red card/i.test(raw)) {
        void postOfficialTribune(match.id, `${min ?? '?'}’ Carton rouge${team ? ` ${team}` : ''}`, min, `red:${h.id}`)
      } else if (/penalty|pénalty|penalti/i.test(raw)) {
        void postOfficialTribune(match.id, `${min ?? '?'}’ Penalty${team ? ` ${team}` : ''}`, min, `pen:${h.id}`)
      } else if (/changement|substitution|remplacé|replaced/i.test(raw)) {
        void postOfficialTribune(match.id, `${min ?? '?'}’ Changement${h.detail ? ` — ${h.detail}` : ''}`, min, `sub:${h.id}`)
      }
    }
  }, [highlights, match, status, homeName, awayName])
}
