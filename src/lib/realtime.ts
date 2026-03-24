/**
 * Couche temps réel (prévu) — WebSocket pour chat live, scores et activité groupes.
 * Brancher ici un client WS (ex. Socket.IO ou API native) quand le backend sera dispo.
 */
export type RealtimeScope = 'chat' | 'scores' | 'groups'

export function subscribeRealtime(_scope: RealtimeScope, _handler: (payload: unknown) => void) {
  return () => {
    /* noop — stub */
  }
}
