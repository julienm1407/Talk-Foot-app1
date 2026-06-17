import type { Bet, BetMarket, BetStatus } from '../types/bet'
import type { Match } from '../types/match'

export type BetFilterTab = 'all' | 'open' | 'won' | 'lost'

export function formatBetOddsFr(odds: number): string {
  if (!Number.isFinite(odds) || odds <= 0) return '—'
  return odds.toFixed(2).replace('.', ',')
}

export function formatBetPotentialGain(stake: number, odds: number): number {
  return Math.round(stake * odds * 10) / 10
}

function playerNameFromScorerSlug(slug: string): string {
  const parts = slug.split('-').filter(Boolean)
  if (!parts.length) return 'Buteur'
  const last = parts[parts.length - 1] ?? ''
  if (!last) return 'Buteur'
  return last.charAt(0).toUpperCase() + last.slice(1)
}

/** Nom affiché du club (nom complet, pas le sigle type ATA). */
function teamDisplayName(team: Match['home'] | undefined, fallback: string): string {
  if (!team) return fallback
  const full = team.name?.trim()
  if (full) return full
  return team.shortName?.trim() || fallback
}

export function getBetPickTitle(bet: Bet, match: Match | null): string {
  const homeShort = match?.home.shortName ?? bet.matchLabel?.homeShort ?? 'Domicile'
  const awayShort = match?.away.shortName ?? bet.matchLabel?.awayShort ?? 'Extérieur'
  const sel = bet.selection

  if (bet.market === 'anytime_scorer' && typeof sel === 'string' && sel.startsWith('scor:')) {
    const slug = sel.slice(sel.lastIndexOf(':') + 1)
    return `${playerNameFromScorerSlug(slug)} Buteur`
  }
  if (bet.market === 'result_1x2') {
    if (sel === 'home') return teamNameFromBetContext(bet, match, 'home')
    if (sel === 'away') return teamNameFromBetContext(bet, match, 'away')
    if (sel === 'draw') return 'Match nul'
  }
  if (bet.market === 'over25') {
    return sel === 'over' ? '+2,5 buts · Over' : '+2,5 buts · Under'
  }
  if (bet.market === 'exact_score') {
    const s = String(sel)
    const ex = /^ex:(\d+):(\d+)$/.exec(s)
    if (ex) return `Score exact ${ex[1]}-${ex[2]}`
    const score =
      s.length === 2 && /^\d\d$/.test(s) ? `${s[0]}-${s[1]}` : s.replace(/(\d)(\d)/, '$1-$2')
    return `Score exact ${score}`
  }
  if (bet.market === 'next_goal') {
    if (sel === 'home') return `Prochain but · ${homeShort}`
    if (sel === 'away') return `Prochain but · ${awayShort}`
    return 'Prochain but'
  }
  if (bet.market === 'first_goal') {
    if (sel === 'home') return `1er but · ${homeShort}`
    if (sel === 'away') return `1er but · ${awayShort}`
    return '1er but'
  }
  return marketShortLabel(bet.market)
}

export function marketShortLabel(m: BetMarket): string {
  if (m === 'next_goal') return 'Prochain but'
  if (m === 'first_goal') return '1er but'
  if (m === 'result_1x2') return '1N2'
  if (m === 'over25') return '+2,5 buts'
  if (m === 'exact_score') return 'Score exact'
  if (m === 'anytime_scorer') return 'Buteur'
  return m
}

export function getBetStatusMeta(status: BetStatus): {
  label: string
  tone: 'open' | 'won' | 'lost' | 'cancelled'
} {
  if (status === 'open') return { label: 'En cours', tone: 'open' }
  if (status === 'won') return { label: 'Gagné', tone: 'won' }
  if (status === 'lost') return { label: 'Perdu', tone: 'lost' }
  return { label: 'Annulé', tone: 'cancelled' }
}

export function filterBetsByTab(bets: Bet[], tab: BetFilterTab): Bet[] {
  if (tab === 'all') return bets
  if (tab === 'open') return bets.filter((b) => b.status === 'open')
  if (tab === 'won') return bets.filter((b) => b.status === 'won')
  return bets.filter((b) => b.status === 'lost')
}

export function sortBetsForSlipList(bets: Bet[]): Bet[] {
  return [...bets].sort((a, b) => {
    const openA = a.status === 'open' ? 0 : 1
    const openB = b.status === 'open' ? 0 : 1
    if (openA !== openB) return openA - openB
    return +new Date(b.placedAt) - +new Date(a.placedAt)
  })
}

export function formatBetPlacedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const h = `${d.getHours()}`.padStart(2, '0')
  const m = `${d.getMinutes()}`.padStart(2, '0')
  const day = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${h}h${m} · ${day}`
}

export function matchScoreLine(match: Match | null): {
  home: string
  away: string
  live: boolean
  minute?: number
} {
  if (!match) {
    return { home: '—', away: '—', live: false }
  }
  const h = match.score?.home ?? 0
  const a = match.score?.away ?? 0
  return {
    home: String(h),
    away: String(a),
    live: match.status === 'live',
    minute: match.minute,
  }
}

export function betMatchesFilter(b: Bet, tab: BetFilterTab): boolean {
  return filterBetsByTab([b], tab).length > 0
}

/** Libellé secondaire (marché) si le titre principal ne le contient pas déjà. */
export function getBetMarketHint(bet: Bet): string | null {
  if (bet.market === 'anytime_scorer') return null
  return marketShortLabel(bet.market)
}

/** Titre de section en tête de ticket (ex. « Résultat », « Buteur »). */
export function getBetMarketSectionLabel(bet: Bet): string {
  if (bet.market === 'result_1x2') return 'Résultat'
  return marketShortLabel(bet.market)
}

/** Ligne match sous le choix parié (ex. « FRA · BRA »). */
export function getBetMatchFixtureLabel(match: Match | null, bet?: Bet): string {
  if (match) {
    const home = match.home.shortName?.trim() || match.home.name?.trim() || 'Domicile'
    const away = match.away.shortName?.trim() || match.away.name?.trim() || 'Extérieur'
    return `${home} · ${away}`
  }
  const label = bet?.matchLabel
  if (label) {
    return `${label.homeShort} · ${label.awayShort}`
  }
  return '…'
}

/** Équipe du joueur / camp parié (buteur, 1N2 domicile/extérieur). */
export function getBetPickedTeamLabel(bet: Bet, match: Match | null): string | null {
  const side = getBetPickedSide(bet)
  if (!side || side === 'draw') return null
  return teamNameFromBetContext(bet, match, side)
}

function teamNameFromBetContext(
  bet: Bet,
  match: Match | null,
  side: 'home' | 'away',
): string {
  if (match) {
    return side === 'home'
      ? teamDisplayName(match.home, 'Domicile')
      : teamDisplayName(match.away, 'Extérieur')
  }
  const label = bet.matchLabel
  if (label) {
    return side === 'home'
      ? label.homeName?.trim() || label.homeShort
      : label.awayName?.trim() || label.awayShort
  }
  return side === 'home' ? 'Domicile' : 'Extérieur'
}

/** Équipe / choix sur lequel le pari a été placé (affiché sous « Résultat »). */
export function getBetPickedOutcomeLabel(bet: Bet, match: Match | null): string {
  const sel = bet.selection

  if (bet.market === 'result_1x2') {
    if (sel === 'home') return teamNameFromBetContext(bet, match, 'home')
    if (sel === 'away') return teamNameFromBetContext(bet, match, 'away')
    if (sel === 'draw') return 'Match nul'
  }
  if (bet.market === 'next_goal' || bet.market === 'first_goal') {
    if (sel === 'home') return teamNameFromBetContext(bet, match, 'home')
    if (sel === 'away') return teamNameFromBetContext(bet, match, 'away')
  }
  if (bet.market === 'anytime_scorer' && typeof sel === 'string' && sel.startsWith('scor:')) {
    const slug = sel.slice(sel.lastIndexOf(':') + 1)
    return playerNameFromScorerSlug(slug)
  }
  if (bet.market === 'over25') {
    return sel === 'over' ? 'Plus de 2,5 buts' : 'Moins de 2,5 buts'
  }
  if (bet.market === 'exact_score') {
    const s = String(sel)
    const ex = /^ex:(\d+):(\d+)$/.exec(s)
    if (ex) return `Score ${ex[1]}-${ex[2]}`
    const score =
      s.length === 2 && /^\d\d$/.test(s) ? `${s[0]}-${s[1]}` : s.replace(/(\d)(\d)/, '$1-$2')
    return `Score ${score}`
  }
  return getBetPickTitle(bet, match)
}

export function getBetFinalVerdict(bet: Bet): {
  label: string
  tone: 'won' | 'lost'
} | null {
  if (bet.status === 'won') return { label: 'Gagné', tone: 'won' }
  if (bet.status === 'lost') return { label: 'Perdu', tone: 'lost' }
  return null
}

/** Côté équipe parié (1N2 / prochain but) pour surligner le score. */
export function getBetPickedSide(bet: Bet): 'home' | 'away' | 'draw' | null {
  const sel = bet.selection
  if (sel === 'home' || sel === 'away' || sel === 'draw') return sel
  if (typeof sel === 'string' && sel.startsWith('scor:')) {
    const side = sel.split(':')[1]
    if (side === 'home' || side === 'away') return side
  }
  return null
}
