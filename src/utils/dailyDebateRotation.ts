import type { Debate } from '../data/debates'
import type { Match } from '../types/match'
import { hubTeamLabel } from './teamCardLabel'
import { toParisDayKey } from './dailyTokenBonus'

/** Hash déterministe (FNV-1a) — même entrée → même index pour la journée. */
function dailySeed(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Débat mis en avant — rotation parmi le classement activité, renouvelé chaque jour (Paris). */
export function pickDailyDebateOfTheDay(
  ranked: Debate[],
  dayKey = toParisDayKey(),
): Debate | null {
  if (!ranked.length) return null
  const idx = dailySeed(`debate-day:${dayKey}`) % ranked.length
  return ranked[idx] ?? null
}

function debateTokens(d: Debate): string {
  return `${d.title} ${d.excerpt}`.toLowerCase()
}

function sideKeys(team: Match['home']): string[] {
  return [team.name, team.shortName, team.id]
    .map((s) => s.replace(/\s+/g, ' ').trim().toLowerCase())
    .filter((s) => s.length >= 3)
}

export function debateIsAboutMatch(d: Debate, match: Match): boolean {
  const blob = debateTokens(d)
  return sideKeys(match.home).some((k) => blob.includes(k)) && sideKeys(match.away).some((k) => blob.includes(k))
}

export function featuredMatchNightDebate(match: Match): Debate {
  const home = hubTeamLabel(match.home)
  const away = hubTeamLabel(match.away)
  const title = `${home} peut-il battre ${away} ce soir ?`
  return {
    id: `d-motd-${match.id}`,
    title,
    excerpt: `Le choc du soir : ${home} – ${away}. Donne ton avis.`,
    accent: match.home.colors.primary || '#e11d48',
    messagesCount: 0,
    participantsCount: 0,
    previewMessages: [],
    featured: true,
  }
}

/** Gros match du soir : débat sur ce match, sinon rotation du jour. */
export function pickHomeDebateOfTheDay(
  ranked: Debate[],
  featuredMatch: Match | null | undefined,
  dayKey = toParisDayKey(),
): Debate | null {
  if (featuredMatch && (featuredMatch.status === 'upcoming' || featuredMatch.status === 'live')) {
    const about = ranked.filter((d) => debateIsAboutMatch(d, featuredMatch))
    if (about.length) {
      return [...about].sort(
        (a, b) =>
          (b.participantsCount ?? 0) - (a.participantsCount ?? 0) ||
          (b.messagesCount ?? 0) - (a.messagesCount ?? 0),
      )[0] ?? featuredMatchNightDebate(featuredMatch)
    }
    return featuredMatchNightDebate(featuredMatch)
  }
  return pickDailyDebateOfTheDay(ranked, dayKey)
}

/** Top débats affichés sur l’accueil — fenêtre glissante décalée chaque jour. */
export function pickDailyTrendingDebates(
  ranked: Debate[],
  debateOfTheDay: Debate | null,
  topN: number,
  dayKey = toParisDayKey(),
): Debate[] {
  const pool = debateOfTheDay ? ranked.filter((d) => d.id !== debateOfTheDay.id) : [...ranked]
  if (!pool.length) return []
  const start = dailySeed(`debate-trend:${dayKey}`) % pool.length
  const limit = Math.min(topN, pool.length)
  const out: Debate[] = []
  for (let i = 0; i < limit; i++) {
    out.push(pool[(start + i) % pool.length]!)
  }
  return out
}
