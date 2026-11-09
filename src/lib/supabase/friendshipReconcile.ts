export type FriendshipStatusLite = 'pending' | 'accepted' | 'blocked'

export type ExistingFriendshipLite = {
  status: FriendshipStatusLite | string
  requested_by: string
}

export type FriendshipReconcileAction =
  | 'none'
  | 'already_friends'
  | 'accept'
  | 'already_pending'
  | 'blocked'

/** Une seule ligne par paire : si l’autre a déjà demandé / accepté, on aligne les deux comptes. */
export function reconcileExistingFriendship(
  existing: ExistingFriendshipLite | null | undefined,
  myId: string,
): FriendshipReconcileAction {
  if (!existing || !myId) return 'none'
  if (existing.status === 'blocked') return 'blocked'
  if (existing.status === 'accepted') return 'already_friends'
  if (existing.status === 'pending') {
    return existing.requested_by !== myId ? 'accept' : 'already_pending'
  }
  return 'none'
}
