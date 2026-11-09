import { describe, expect, it } from 'vitest'
import { reconcileExistingFriendship } from './friendshipReconcile'

describe('reconcileExistingFriendship', () => {
  const me = 'aaa'
  const other = 'bbb'

  it('pas de ligne → envoyer une demande', () => {
    expect(reconcileExistingFriendship(null, me)).toBe('none')
  })

  it('déjà accepté → amis des deux côtés', () => {
    expect(reconcileExistingFriendship({ status: 'accepted', requested_by: me }, me)).toBe(
      'already_friends',
    )
    expect(reconcileExistingFriendship({ status: 'accepted', requested_by: other }, me)).toBe(
      'already_friends',
    )
  })

  it('demande reçue → accepter au lieu de recréer', () => {
    expect(reconcileExistingFriendship({ status: 'pending', requested_by: other }, me)).toBe(
      'accept',
    )
  })

  it('demande déjà envoyée → reste en attente', () => {
    expect(reconcileExistingFriendship({ status: 'pending', requested_by: me }, me)).toBe(
      'already_pending',
    )
  })

  it('bloqué', () => {
    expect(reconcileExistingFriendship({ status: 'blocked', requested_by: other }, me)).toBe(
      'blocked',
    )
  })
})
