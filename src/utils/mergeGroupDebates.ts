import type { Debate } from '../data/debates'

/** Débats d’un groupe : local non synchronisé + catalogue cloud (group_id). */
export function mergeDebatesForGroup(
  cloud: Debate[],
  local: Debate[],
  groupId: string,
): Debate[] {
  const fromCloud = cloud.filter((d) => d.groupId === groupId)
  const ids = new Set(fromCloud.map((d) => d.id))
  const extra = local.filter((d) => d.groupId === groupId && !ids.has(d.id))
  return [...extra, ...fromCloud].sort(
    (a, b) => (b.messagesCount ?? 0) - (a.messagesCount ?? 0) || a.title.localeCompare(b.title),
  )
}
