import { useMemo } from 'react'
import { useSupporterGroups } from './useSupporterGroups'
import { useDebates } from '../contexts/DebatesContext'
import type { TrendingHashtag } from '../data/trendingHashtags'

/**
 * Hashtags dérivés des groupes cloud et de l’activité débats (plus de liste statique).
 */
export function useTrendingHashtags(max = 8): TrendingHashtag[] {
  const { groups } = useSupporterGroups()
  const { debates } = useDebates()

  return useMemo(() => {
    const heat = new Map<string, number>()
    for (const g of groups) {
      for (const raw of g.hashtags ?? []) {
        const tag = raw.trim().replace(/^#+/, '')
        if (!tag) continue
        const key = tag.toLowerCase()
        heat.set(key, (heat.get(key) ?? 0) + Math.max(1, g.members))
      }
    }
    for (const d of debates) {
      if (d.messagesCount > 0) {
        heat.set('debats', (heat.get('debats') ?? 0) + d.messagesCount)
      }
    }
    const sorted = [...heat.entries()].sort((a, b) => b[1] - a[1]).slice(0, max)
    if (!sorted.length) return []
    const maxHeat = sorted[0]![1] || 1
    return sorted.map(([tag, count]) => ({
      tag: tag.charAt(0).toUpperCase() + tag.slice(1),
      heat: Math.round(40 + (count / maxHeat) * 60),
    }))
  }, [groups, debates, max])
}
