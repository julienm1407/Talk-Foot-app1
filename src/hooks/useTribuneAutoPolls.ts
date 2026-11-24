import { useEffect, useRef } from 'react'
import type { Highlight } from '../data/highlights'
import type { Match } from '../types/match'
import { cardColorFromHighlightText } from '../utils/liveFootballOdds'
import type { TribunePollOption } from '../lib/supabase/tribunePolls'
import { postOfficialTribune } from '../lib/supabase/tribunePolls'
import { isTalkFootMultiplexId } from '../utils/talkFootMatchOfTheDay'
import { translateSportMonksLiveTextToFr } from '../utils/translateSportMonksLiveEnToFr'
import {
  decisionPollKey,
  isPenaltyAwardText,
  isPenaltyMissedText,
  isPenaltyShootoutContext,
  penaltyIncidentKey,
} from '../utils/tribuneOfficialEvents'

function isRealGoalHighlight(h: Highlight): boolean {
  if (h.id.startsWith('sm-comment-')) return false
  const raw = `${h.title ?? ''} ${h.detail ?? ''} ${h.type ?? ''}`
  if (
    /\b(but it|goes to the (right|left)|goes wide|goes over|off target|saved by|blocked|missed)\b/i.test(
      raw,
    )
  ) {
    return false
  }
  if (h.type === 'But') return true
  return /\b(goal|scored|marque)\b/i.test(raw)
}

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
  const incidentsPrimed = useRef(false)
  const seenKeys = useRef(new Set<string>())

  useEffect(() => {
    primed.current = false
    incidentsPrimed.current = false
    seenKeys.current = new Set()
  }, [match?.id])

  useEffect(() => {
    if (!match?.id) return
    if (isTalkFootMultiplexId(match.id)) return
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

    if (minute <= 8 && homeScore + awayScore === 0) {
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
    if (isTalkFootMultiplexId(match.id)) return
    if (!incidentsPrimed.current) {
      if (highlights.length === 0) return
      incidentsPrimed.current = true
      for (const h of highlights) {
        const raw = `${h.title ?? ''} ${h.detail ?? ''} ${h.type ?? ''}`
        const min = typeof h.minute === 'number' ? h.minute : null
        if (isPenaltyAwardText(raw) && !isPenaltyShootoutContext(raw, min)) {
          seenKeys.current.add(decisionPollKey(match.id, 'pen', min))
        }
        if (cardColorFromHighlightText(raw) === 'red' || /rouge|red card/i.test(raw)) {
          seenKeys.current.add(decisionPollKey(match.id, 'red', min))
        }
      }
      return
    }
    for (const h of highlights) {
      const raw = `${h.title ?? ''} ${h.detail ?? ''} ${h.type ?? ''}`
      const min = typeof h.minute === 'number' ? h.minute : null
      if (isPenaltyShootoutContext(raw, min)) continue
      const red = cardColorFromHighlightText(raw) === 'red' || /rouge|red card/i.test(raw)
      const pen = isPenaltyAwardText(raw)
      if (!red && !pen) continue
      const key = decisionPollKey(match.id, red ? 'red' : 'pen', min)
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
        officialBody: `${red ? 'Carton rouge' : 'Penalty'} ${min ?? ''}’ — sondage : décision juste ?`,
        minute: min,
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
  const seenKeys = useRef(new Set<string>())
  useEffect(() => {
    primed.current = false
    seenKeys.current = new Set()
  }, [match?.id])

  useEffect(() => {
    if (!match?.id || status !== 'live') return
    if (isTalkFootMultiplexId(match.id)) return
    if (!primed.current) {
      if (highlights.length === 0) return
      primed.current = true
      for (const h of highlights) {
        seenKeys.current.add(h.id)
        const raw = `${h.title ?? ''} ${h.detail ?? ''} ${h.type ?? ''}`
        const min = typeof h.minute === 'number' ? h.minute : null
        if (isPenaltyMissedText(raw)) seenKeys.current.add(penaltyIncidentKey(match.id, min, 'miss'))
        else if (isPenaltyAwardText(raw)) seenKeys.current.add(penaltyIncidentKey(match.id, min, 'award'))
      }
      return
    }
    for (const h of highlights) {
      if (seenKeys.current.has(h.id)) continue
      seenKeys.current.add(h.id)
      const raw = `${h.title ?? ''} ${h.detail ?? ''} ${h.type ?? ''}`
      const min = typeof h.minute === 'number' ? h.minute : null
      if (isPenaltyShootoutContext(raw, min)) continue
      const team = h.side === 'home' ? homeName : h.side === 'away' ? awayName : ''
      const frDetail = translateSportMonksLiveTextToFr(String(h.detail || h.title || '').trim())
      if (isRealGoalHighlight(h)) {
        const scorer = h.scorerName?.trim()
        const key = `goal:${match.id}:${min}:${(scorer ?? '').toLowerCase()}`
        if (seenKeys.current.has(key)) continue
        seenKeys.current.add(key)
        void postOfficialTribune(
          match.id,
          `${min ?? '?'}’ BUT${team ? ` ${team}` : ''}${scorer ? ` — ${scorer}` : frDetail ? ` — ${frDetail}` : ''}`.trim(),
          min,
          key,
        )
      } else if (cardColorFromHighlightText(raw) === 'red' || /rouge|red card/i.test(raw)) {
        const key = `red:${match.id}:${min}`
        if (seenKeys.current.has(key)) continue
        seenKeys.current.add(key)
        void postOfficialTribune(match.id, `${min ?? '?'}’ Carton rouge${team ? ` ${team}` : ''}`, min, key)
      } else if (isPenaltyMissedText(raw)) {
        const key = penaltyIncidentKey(match.id, min, 'miss')
        if (seenKeys.current.has(key)) continue
        seenKeys.current.add(key)
        void postOfficialTribune(
          match.id,
          `${min ?? '?'}’ Penalty raté${team ? ` — ${team}` : ''}`.trim(),
          min,
          key,
        )
      } else if (isPenaltyAwardText(raw)) {
        const key = penaltyIncidentKey(match.id, min, 'award')
        if (seenKeys.current.has(key)) continue
        seenKeys.current.add(key)
        void postOfficialTribune(match.id, `${min ?? '?'}’ Penalty${team ? ` ${team}` : ''}`, min, key)
      } else if (/changement|substitution|remplacé|replaced/i.test(raw)) {
        const key = `sub:${match.id}:${min}:${frDetail.slice(0, 40).toLowerCase()}`
        if (seenKeys.current.has(key)) continue
        seenKeys.current.add(key)
        void postOfficialTribune(
          match.id,
          `${min ?? '?'}’ Changement${frDetail ? ` — ${frDetail}` : ''}`,
          min,
          key,
        )
      }
    }
  }, [highlights, match, status, homeName, awayName])
}
