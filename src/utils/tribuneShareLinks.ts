import type { Bet } from '../types/bet'
import type { Match } from '../types/match'
import { absolutePageUrl } from '../seo/basePath'
import { getBetPickTitle } from './betDisplay'
import { formatKickoffLabel } from './time'

export type TribuneShareSrc = 'share_prono' | 'share_tribune'

export function tribuneShareUrl(matchId: string, src: TribuneShareSrc): string {
  const base = absolutePageUrl(`/channel/${encodeURIComponent(matchId)}`)
  const join = base.includes('?') ? '&' : '?'
  return `${base}${join}src=${src}`
}

export function matchAfficheLabel(match: Match): string {
  const home = match.home.name?.trim() || match.home.shortName
  const away = match.away.name?.trim() || match.away.shortName
  return `${home} – ${away}`
}

export function matchWhenLabel(match: Match): string {
  return formatKickoffLabel(match.kickoffAt, { alwaysDate: true })
}

export function formatPronoShareLine(bet: Bet, match: Match): string {
  if (bet.market === 'exact_score') {
    const s = String(bet.selection)
    const ex = /^ex:(\d+):(\d+)$/.exec(s)
    if (ex) return `Mon prono : ${match.home.shortName} ${ex[1]}-${ex[2]}`
    if (/^\d\d$/.test(s)) return `Mon prono : ${match.home.shortName} ${s[0]}-${s[1]}`
  }
  if (bet.market === 'result_1x2' && bet.selection === 'home') {
    return `Mon prono : victoire ${match.home.shortName}`
  }
  if (bet.market === 'result_1x2' && bet.selection === 'away') {
    return `Mon prono : victoire ${match.away.shortName}`
  }
  if (bet.market === 'result_1x2' && bet.selection === 'draw') {
    return 'Mon prono : match nul'
  }
  return `Mon prono : ${getBetPickTitle(bet, match)}`
}

export function formatFinalScoreLine(match: Match): string {
  const h = match.score?.home ?? 0
  const a = match.score?.away ?? 0
  return `Score final : ${match.home.shortName} ${h}-${a} ${match.away.shortName}`
}

export function formatPronoResultLine(bet: Bet, match: Match): string {
  const pick = formatPronoShareLine(bet, match)
  if (bet.status === 'won') return `${pick} · Gagné`
  if (bet.status === 'lost') return `${pick} · Perdu`
  return pick
}
