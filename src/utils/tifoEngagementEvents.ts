export const TIFO_ENGAGEMENT_SYNC_EVENT = 'talkfoot:tifo-engagement-sync'

export type TifoEngagementSyncDetail = {
  groupId?: string
  matchId: string
}

export function requestTifoEngagementSync(groupId: string, matchId: string) {
  if (typeof window === 'undefined' || !groupId || !matchId) return
  window.dispatchEvent(
    new CustomEvent<TifoEngagementSyncDetail>(TIFO_ENGAGEMENT_SYNC_EVENT, {
      detail: { groupId, matchId },
    }),
  )
}

/** Sync bonus tifo pour tous les panneaux ouverts sur ce match (ex. après un pari). */
export function requestTifoEngagementSyncForMatch(matchId: string, groupId?: string) {
  if (typeof window === 'undefined' || !matchId) return
  window.dispatchEvent(
    new CustomEvent<TifoEngagementSyncDetail>(TIFO_ENGAGEMENT_SYNC_EVENT, {
      detail: { matchId, ...(groupId ? { groupId } : {}) },
    }),
  )
}

/** Sync bonus tifo pour le panneau tribune ouvert (match courant). */
export function requestTifoEngagementSyncForGroup(groupId: string) {
  if (typeof window === 'undefined' || !groupId) return
  window.dispatchEvent(
    new CustomEvent<TifoEngagementSyncDetail>(TIFO_ENGAGEMENT_SYNC_EVENT, {
      detail: { groupId, matchId: '*' },
    }),
  )
}
