import type { NewsItem } from './news'

/** Actus 100 % club quand le filtre strict laisse peu de lignes (mock) */
export function syntheticClubNewsItems(
  clubId: string,
  shortName: string,
  name: string,
  leagueId: string,
): NewsItem[] {
  const leagueIds = [leagueId]
  const clubIds = [clubId]
  const base = shortName || name

  const lines: Omit<NewsItem, 'id'>[] = [
    {
      tag: 'Breaking',
      minutesAgo: 2,
      title: `${base} : la semaine du club sur Talk Foot`,
      excerpt: `Salons, live et réactions : tout tourne autour de ${name} tant que le mode supporter est activé sur ton profil.`,
      leagueIds,
      clubIds,
    },
    {
      tag: 'Analyse',
      minutesAgo: 14,
      title: `Tactique & effectif — focus ${shortName}`,
      excerpt: `Les débats des supporters de ${name} dominent les fils : compos, pressing, finition.`,
      leagueIds,
      clubIds,
    },
    {
      tag: 'Rumeurs',
      minutesAgo: 33,
      title: `Mercato : les rumeurs qui agitent ${shortName}`,
      excerpt: `Piste après piste, le kop virtuel réagit en direct — ambiance 100 % ${base}.`,
      leagueIds,
      clubIds,
    },
    {
      tag: 'Débrief',
      minutesAgo: 51,
      title: `Après-match : la tribune ${base}`,
      excerpt: `Notes, homme du match et polémiques : retour chaud côté supporters de ${name}.`,
      leagueIds,
      clubIds,
    },
  ]

  return lines.map((row, i) => ({
    ...row,
    id: `synth-supporter-${clubId}-${i}`,
  }))
}

export function mergeWithSyntheticIfSparse(
  filtered: NewsItem[],
  minCount: number,
  clubId: string,
  shortName: string,
  name: string,
  leagueId: string,
): NewsItem[] {
  if (filtered.length >= minCount) return filtered
  const synth = syntheticClubNewsItems(clubId, shortName, name, leagueId)
  const seen = new Set(filtered.map((x) => x.id))
  const extra = synth.filter((s) => !seen.has(s.id))
  return [...filtered, ...extra].sort((a, b) => a.minutesAgo - b.minutesAgo)
}
