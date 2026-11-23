import type { Bet } from '../types/bet'
import type { Match } from '../types/match'
import { absolutePageUrl } from '../seo/basePath'
import { formatBetOddsFr, getBetPickTitle, getBetPickedTeamLabel, marketShortLabel } from './betDisplay'
import { MATCH_DISPLAY_TIME_ZONE, formatKickoff } from './time'

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
  return formatShareCardWhen(match.kickoffAt)
}

/** Ex. MER. 25 NOV. · 21H00 */
export function formatShareCardWhen(iso: string): string {
  const d = new Date(iso)
  const day = new Intl.DateTimeFormat('fr-FR', {
    timeZone: MATCH_DISPLAY_TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
    .format(d)
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
  const time = formatKickoff(iso).replace(':', 'H').replace(' ', '')
  return `${day} · ${time}`
}

export function pronoSharePageUrl(shareId: string, opts?: { src?: TribuneShareSrc; from?: string }): string {
  const base = absolutePageUrl(`/p/${encodeURIComponent(shareId)}`)
  const q = new URLSearchParams()
  q.set('src', opts?.src ?? 'share_prono')
  if (opts?.from) q.set('from', opts.from)
  return `${base}?${q.toString()}`
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
  outcome: string
  team: string
  detail?: string
  oddsLabel?: string
}

/** Découpe le prono pour la carte story (marché / gros titre / détail). */
export function formatShareStoryPick(bet: Bet, match: Match): ShareStoryPick {
  const oddsLabel = bet.odds > 0 ? `Cote ${formatBetOddsFr(bet.odds)}` : undefined
  if (bet.market === 'anytime_scorer') {
    const hero = scorerDisplayName(String(bet.selection))
    return {
      marketLabel: 'Buteur',
      hero,
      outcome: 'BUTEUR',
      team: hero,
      detail: getBetPickedTeamLabel(bet, match) ?? undefined,
      oddsLabel,
    }
  }
  const exact = exactScoreHero(String(bet.selection))
  if (bet.market === 'exact_score' && exact) {
    return {
      marketLabel: 'Score exact',
      hero: exact,
      outcome: 'SCORE EXACT',
      team: exact.replace(' – ', '-'),
      detail: `${match.home.shortName} – ${match.away.shortName}`,
      oddsLabel,
    }
  }
  if (bet.market === 'result_1x2') {
    if (bet.selection === 'home') {
      return {
        marketLabel: 'Résultat',
        hero: `Victoire ${match.home.shortName}`,
        outcome: 'VICTOIRE',
        team: match.home.shortName,
        oddsLabel,
      }
    }
    if (bet.selection === 'away') {
      return {
        marketLabel: 'Résultat',
        hero: `Victoire ${match.away.shortName}`,
        outcome: 'VICTOIRE',
        team: match.away.shortName,
        oddsLabel,
      }
    }
    return { marketLabel: 'Résultat', hero: 'Match nul', outcome: 'MATCH NUL', team: '', oddsLabel }
  }
  return {
    marketLabel: marketShortLabel(bet.market),
    hero: getBetPickTitle(bet, match),
    outcome: marketShortLabel(bet.market).toUpperCase(),
    team: getBetPickTitle(bet, match),
    oddsLabel,
  }
}

export function formatPronoShareInvite(bet: Bet, match: Match, pageUrl: string): string {
  const short = pageUrl.replace(/^https?:\/\//, '')
  const vs = `${match.home.shortName} contre ${match.away.name}`
  if (bet.market === 'result_1x2' && bet.selection === 'home') {
    return `J'ai dit ${match.home.shortName} contre ${match.away.name} 🔥 Toi tu dis quoi ? 👉 ${short}`
  }
  if (bet.market === 'result_1x2' && bet.selection === 'away') {
    return `J'ai dit ${match.away.shortName} contre ${match.home.name} 🔥 Toi tu dis quoi ? 👉 ${short}`
  }
  if (bet.market === 'result_1x2' && bet.selection === 'draw') {
    return `J'ai dit match nul ${match.home.shortName}–${match.away.shortName} 🔥 Toi tu dis quoi ? 👉 ${short}`
  }
  const pick = formatShareStoryPick(bet, match)
  return `J'ai dit ${pick.hero} (${vs}) 🔥 Toi tu dis quoi ? 👉 ${short}`
}

export function recentFormLine(bets: Bet[]): string | undefined {
  const decided = bets
    .filter((b) => b.status === 'won' || b.status === 'lost')
    .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime())
    .slice(0, 12)
  if (decided.length < 5) return undefined
  const won = decided.filter((b) => b.status === 'won').length
  return `${won} pronos justes sur ses ${decided.length} derniers`
}
