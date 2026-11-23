import type { Bet } from '../types/bet'
import type { Match } from '../types/match'
import { absolutePageUrl } from '../seo/basePath'
import { formatBetOddsFr, getBetPickTitle, getBetPickedTeamLabel, marketShortLabel } from './betDisplay'
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

function scorerDisplayName(selection: string): string {
  if (!selection.startsWith('scor:')) return 'Buteur'
  const slug = selection.slice(selection.lastIndexOf(':') + 1)
  const parts = slug.split('-').filter(Boolean)
  if (!parts.length) return 'Buteur'
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
}

function exactScoreHero(selection: string): string | null {
  const s = String(selection)
  const ex = /^ex:(\d+):(\d+)$/.exec(s)
  if (ex) return `${ex[1]} – ${ex[2]}`
  if (/^\d\d$/.test(s)) return `${s[0]} – ${s[1]}`
  return null
}

export type ShareStoryPick = {
  marketLabel: string
  hero: string
  detail?: string
  oddsLabel?: string
}

/** Découpe le prono pour la carte story (marché / gros titre / détail). */
export function formatShareStoryPick(bet: Bet, match: Match): ShareStoryPick {
  const oddsLabel = bet.odds > 0 ? `Cote ${formatBetOddsFr(bet.odds)}` : undefined
  if (bet.market === 'anytime_scorer') {
    return {
      marketLabel: 'Buteur',
      hero: scorerDisplayName(String(bet.selection)),
      detail: getBetPickedTeamLabel(bet, match) ?? undefined,
      oddsLabel,
    }
  }
  const exact = exactScoreHero(String(bet.selection))
  if (bet.market === 'exact_score' && exact) {
    return {
      marketLabel: 'Score exact',
      hero: exact,
      detail: `${match.home.shortName} – ${match.away.shortName}`,
      oddsLabel,
    }
  }
  if (bet.market === 'result_1x2') {
    if (bet.selection === 'home') {
      return { marketLabel: 'Résultat', hero: `Victoire ${match.home.shortName}`, oddsLabel }
    }
    if (bet.selection === 'away') {
      return { marketLabel: 'Résultat', hero: `Victoire ${match.away.shortName}`, oddsLabel }
    }
    return { marketLabel: 'Résultat', hero: 'Match nul', oddsLabel }
  }
  return {
    marketLabel: marketShortLabel(bet.market),
    hero: getBetPickTitle(bet, match),
    oddsLabel,
  }
}
