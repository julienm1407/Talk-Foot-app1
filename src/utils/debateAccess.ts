import type { Debate } from '../data/debates'
import { GLOBAL_DEBATES_GROUP_ID } from '../constants/debates'

/** Groupe hébergeant les messages du fil (tribune liée ou espace global). */
export function debateMessageGroupId(debate: Pick<Debate, 'groupId' | 'id'>): string {
  const linked = debate.groupId?.trim()
  return linked || GLOBAL_DEBATES_GROUP_ID
}

/** Page principale de participation au débat. */
export function debatePageHref(debateId: string): string {
  return `/debate/${encodeURIComponent(debateId)}`
}

/** Tous les débats sont ouverts : participation sans adhésion à une tribune. */
export function isDebateOpenToAll(_debate?: Pick<Debate, 'salonAccess'> | null): boolean {
  return true
}
