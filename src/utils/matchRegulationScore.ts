import type {
  SmFixture,
  SmFixtureCommentRow,
  SmFixtureEventRow,
  SmScoreRow,
} from '../api/sportMonks/types'
import { eventMinuteTotal } from './matchEventMinute'

export function smScoreRowBlob(s: SmScoreRow): string {
  return `${s.description ?? ''} ${s.type?.developer_name ?? ''} ${s.type?.name ?? ''}`.toUpperCase()
}

export function scoreRowDescription(s: SmScoreRow): string {
  const desc = String(s.description ?? '').toUpperCase().trim()
  if (desc) return desc
  return String(s.type?.developer_name ?? s.type?.name ?? '')
    .toUpperCase()
    .trim()
}

/** Ligne `PENALTIES` SportMonks — nombre de tirs au but réussis par équipe. */
export function isPenaltyShootoutScoreRow(s: SmScoreRow): boolean {
  const desc = scoreRowDescription(s)
  if (desc === 'PENALTIES' || desc === 'PENALTY_SHOOTOUT') return true
  const b = smScoreRowBlob(s)
  if (b.includes('PENALTY_SHOOTOUT')) return true
  return /\bPENALT/.test(b) && /\bSHOOT/.test(b)
}

export function isExtraTimeScoreRow(s: SmScoreRow): boolean {
  const desc = scoreRowDescription(s)
  if (desc === 'EXTRA_TIME' || desc === 'EXTRA_TIME_ONLY') return true
  const b = smScoreRowBlob(s)
  if (b.includes('EXTRA_TIME')) return true
  if (b.includes('AFTER_EXTRA') || desc === 'AET') return true
  return false
}

export function isFullTimeScoreRow(s: SmScoreRow): boolean {
  const desc = scoreRowDescription(s)
  if (desc === 'FT' || desc === 'FULL_TIME' || desc === 'FULLTIME') return true
  const b = smScoreRowBlob(s)
  return b.includes('FULL_TIME') || b.includes('FULLTIME')
}

function goalsFromScoreRows(rows: SmScoreRow[]): { home: number; away: number } | undefined {
  if (!rows.length) return undefined
  let home = 0
  let away = 0
  let saw = false
  for (const s of rows) {
    const gn = s.score?.goals == null ? NaN : Number(s.score.goals)
    if (!Number.isFinite(gn)) continue
    const part = String(s.score?.participant ?? '').toLowerCase()
    if (part === 'home') {
      home = Math.max(home, gn)
      saw = true
    }
    if (part === 'away') {
      away = Math.max(away, gn)
      saw = true
    }
  }
  return saw ? { home, away } : undefined
}

function currentGoalsFromScores(scores: SmScoreRow[]): { home: number; away: number } | undefined {
  return goalsFromScoreRows(scores.filter((s) => scoreRowDescription(s) === 'CURRENT'))
}

export function extractPenaltyShootoutFromScores(
  scores: SmScoreRow[] | undefined,
): { home: number; away: number } | null {
  if (!scores?.length) return null
  const g = goalsFromScoreRows(scores.filter(isPenaltyShootoutScoreRow))
  if (!g || (g.home === 0 && g.away === 0)) return null
  return g
}

function normTeamName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]/g, '')
}

function teamNameMatches(label: string, name: string): boolean {
  const a = normTeamName(label)
  const b = normTeamName(name)
  if (!a || !b) return false
  return a.includes(b) || b.includes(a)
}

function isPenaltyShootoutText(text: string): boolean {
  const lower = text.toLowerCase()
  return (
    lower.includes('penalt') ||
    lower.includes('shootout') ||
    lower.includes('tirs au but') ||
    lower.includes('tir au but')
  )
}

/** Parse les textes live SM (commentaires / timeline) — ex. « Maroc winning 3-2 on penalties ». */
export function extractPenaltyShootoutFromTexts(
  texts: string[],
  homeName?: string,
  awayName?: string,
): { home: number; away: number } | null {
  let best: { home: number; away: number } | null = null

  for (const text of texts) {
    if (!isPenaltyShootoutText(text)) continue

    const paren = text.match(
      /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'.-]{0,40}?)\s+(\d+)\s*\(\s*(\d+)\s*\)\s*,\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'.-]{0,40}?)\s+(\d+)\s*\(\s*(\d+)\s*\)/,
    )
    if (paren) {
      const [, t1, , s1, t2, , s2] = paren
      const shoot1 = Number(s1)
      const shoot2 = Number(s2)
      if (Number.isFinite(shoot1) && Number.isFinite(shoot2)) {
        if (homeName && teamNameMatches(t1, homeName)) best = { home: shoot1, away: shoot2 }
        else if (homeName && teamNameMatches(t2, homeName)) best = { home: shoot2, away: shoot1 }
        else best = { home: shoot1, away: shoot2 }
      }
    }

    const win = text.match(
      /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'.-]{0,40}?)\s+winning\s+(\d+)\s*[-–]\s*(\d+)\s+on\s+penalt/i,
    )
    if (win) {
      const [, winner, a, b] = win
      const wScore = Math.max(Number(a), Number(b))
      const lScore = Math.min(Number(a), Number(b))
      if (homeName && teamNameMatches(winner, homeName)) best = { home: wScore, away: lScore }
      else if (awayName && teamNameMatches(winner, awayName)) best = { home: lScore, away: wScore }
      else best = { home: lScore, away: wScore }
    }
  }

  return best
}

export function extractPenaltyShootoutFromComments(
  comments: SmFixtureCommentRow[] | undefined,
  homeName?: string,
  awayName?: string,
): { home: number; away: number } | null {
  if (!comments?.length) return null
  const texts = comments.map((c) => String(c.comment ?? '')).filter(Boolean)
  return extractPenaltyShootoutFromTexts(texts, homeName, awayName)
}

function textsHintExtraTime(texts: string[]): boolean {
  return texts.some((t) => {
    const l = t.toLowerCase()
    return (
      l.includes('extra time') ||
      l.includes('prolong') ||
      l.includes('after extra') ||
      l.includes('après prolong')
    )
  })
}

function isShootoutGoalEvent(ev: SmFixtureEventRow): boolean {
  const dev = String(ev.type?.developer_name ?? ev.type?.name ?? '').toUpperCase()
  if (dev.includes('MISSED') || dev.includes('SAVED')) return false
  return isSmPenaltyShootoutEvent(ev)
}

/** Repli : compter les buts TAB depuis les événements SM. */
export function extractPenaltyShootoutFromEvents(
  events: SmFixtureEventRow[] | undefined,
  homeId?: number | null,
  awayId?: number | null,
): { home: number; away: number } | null {
  if (!events?.length) return null
  let home = 0
  let away = 0
  for (const ev of events) {
    if (!isShootoutGoalEvent(ev)) continue
    const pid = ev.participant_id
    if (homeId != null && pid === homeId) home += 1
    else if (awayId != null && pid === awayId) away += 1
  }
  if (home === 0 && away === 0) return null
  return { home, away }
}

/**
 * Score temps réglementaire + prolongations (hors séance de tirs au but).
 * SportMonks : `CURRENT` = score final hors TAB ; `PENALTIES` = TAB uniquement.
 */
export function extractRegulationGoalsFromScores(
  scores: SmScoreRow[] | undefined,
): { home: number; away: number } | undefined {
  if (!scores?.length) return undefined

  const current = currentGoalsFromScores(scores)
  const extraTime = goalsFromScoreRows(scores.filter(isExtraTimeScoreRow))
  const penalties = extractPenaltyShootoutFromScores(scores)

  if (penalties) {
    if (current) return current
    if (extraTime) return extraTime
    const ft = goalsFromScoreRows(scores.filter(isFullTimeScoreRow))
    if (ft) return ft
    return current
  }

  if (current && (current.home !== 0 || current.away !== 0)) return current
  if (
    current &&
    scores.some((s) => scoreRowDescription(s) === 'CURRENT' && s.score?.goals != null)
  ) {
    return current
  }

  if (extraTime) return extraTime
  const ft = goalsFromScoreRows(scores.filter(isFullTimeScoreRow))
  if (ft) return ft

  return current
}

export function isSmPenaltyShootoutEvent(ev: SmFixtureEventRow): boolean {
  const dev = String(ev.type?.developer_name ?? ev.type?.name ?? '').toUpperCase()
  const periodDesc = String(ev.period?.description ?? '').toLowerCase()
  if (dev.includes('SHOOTOUT') || dev.includes('PENALTY_SHOOTOUT')) return true
  if (periodDesc.includes('penalty') && periodDesc.includes('shoot')) return true
  if (periodDesc.includes('penalties') || periodDesc.includes('tirs au but')) return true
  const total = eventMinuteTotal(ev)
  if (total > 120 && dev.includes('PENALTY')) return true
  if (total > 120 && dev.includes('GOAL') && periodDesc.includes('penalt')) return true
  return false
}

export function isSmExtraTimeEvent(ev: SmFixtureEventRow): boolean {
  if (isSmPenaltyShootoutEvent(ev)) return false
  const periodDesc = String(ev.period?.description ?? '').toLowerCase()
  if (
    periodDesc.includes('extra') ||
    periodDesc.includes('prolong') ||
    periodDesc.includes('overtime')
  ) {
    return !periodDesc.includes('penalt')
  }
  const countsFrom = typeof ev.period?.counts_from === 'number' ? ev.period.counts_from : 0
  const total = eventMinuteTotal(ev)
  return countsFrom >= 90 && total > 90 && total <= 120
}

export type MatchShootoutDisplay = {
  wentToExtraTime: boolean
  penalties: { home: number; away: number }
}

export function extractMatchShootoutDisplay(
  scores: SmScoreRow[] | undefined,
  events?: SmFixtureEventRow[] | undefined,
  opts?: {
    homeId?: number | null
    awayId?: number | null
    homeName?: string
    awayName?: string
    comments?: SmFixtureCommentRow[]
  },
): MatchShootoutDisplay | null {
  const penalties =
    extractPenaltyShootoutFromScores(scores) ??
    extractPenaltyShootoutFromEvents(events, opts?.homeId, opts?.awayId) ??
    extractPenaltyShootoutFromComments(opts?.comments, opts?.homeName, opts?.awayName)
  if (!penalties) return null
  const extraTime = goalsFromScoreRows(scores?.filter(isExtraTimeScoreRow) ?? [])
  const commentTexts = (opts?.comments ?? []).map((c) => String(c.comment ?? ''))
  const wentToExtraTime =
    Boolean(extraTime) ||
    Boolean(events?.some((ev) => isSmExtraTimeEvent(ev))) ||
    textsHintExtraTime(commentTexts)
  return {
    wentToExtraTime,
    penalties,
  }
}

export function extractMatchShootoutDisplayFromFixture(
  fixture: SmFixture | null | undefined,
): MatchShootoutDisplay | null {
  if (!fixture) return null
  const home = fixture.participants?.find((p) => p.meta?.location === 'home')
  const away = fixture.participants?.find((p) => p.meta?.location === 'away')
  return extractMatchShootoutDisplay(fixture.scores, fixture.events, {
    homeId: home?.id,
    awayId: away?.id,
    homeName: home?.name,
    awayName: away?.name,
    comments: fixture.comments,
  })
}

/** Repli timeline TalkFoot (commentaires SM déjà transformés en highlights). */
export function extractMatchShootoutFromHighlights(
  highlights: Array<{
    title?: string
    detail?: string
    minute?: number
    inExtraTime?: boolean
  }> | undefined,
  homeName?: string,
  awayName?: string,
): MatchShootoutDisplay | null {
  if (!highlights?.length) return null
  const texts = highlights.map((h) => `${h.title ?? ''} ${h.detail ?? ''}`.trim()).filter(Boolean)
  const penalties = extractPenaltyShootoutFromTexts(texts, homeName, awayName)
  if (!penalties) return null
  const wentToExtraTime =
    highlights.some((h) => h.inExtraTime) ||
    highlights.some((h) => {
      const m = h.minute ?? 0
      return m > 90 && m <= 120
    }) ||
    textsHintExtraTime(texts) ||
    highlights.some(
      (h) =>
        isPenaltyShootoutText(`${h.title ?? ''} ${h.detail ?? ''}`) && (h.minute ?? 0) > 105,
    )
  return { wentToExtraTime, penalties }
}
