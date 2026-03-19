/**
 * Rennes 1-4 PSG — 8 mars 2025, 17h — données réelles du match
 * Source: Transfermarkt, ESPN, VIP-SG
 */

export type ReplayEvent = 
  | { type: 'goal'; minute: number; side: 'home' | 'away'; scorer: string }
  | { type: 'yellow'; minute: number; side: 'home' | 'away'; player: string }
  | { type: 'red'; minute: number; side: 'home' | 'away'; player: string }
  | { type: 'save'; minute: number }

export const RENNES_PSG_REPLAY: ReplayEvent[] = [
  { type: 'goal', minute: 27, side: 'away' as const, scorer: 'Barcola' },
  { type: 'goal', minute: 50, side: 'away' as const, scorer: 'Ramos' },
  { type: 'goal', minute: 53, side: 'home' as const, scorer: 'Brassier' },
  { type: 'yellow', minute: 40, side: 'home' as const, player: 'Samba' },
  { type: 'yellow', minute: 55, side: 'away' as const, player: 'Hernández' },
  { type: 'yellow', minute: 62, side: 'away' as const, player: 'Mayulu' },
  { type: 'yellow', minute: 68, side: 'home' as const, player: 'Rouault' },
  { type: 'yellow', minute: 74, side: 'away' as const, player: 'Hakimi' },
  { type: 'goal', minute: 91, side: 'away' as const, scorer: 'Dembélé' },
  { type: 'yellow', minute: 92, side: 'away' as const, player: 'Barcola' },
  { type: 'goal', minute: 94, side: 'away' as const, scorer: 'Dembélé' },
  { type: 'red', minute: 97, side: 'home' as const, player: 'Rouault (2e jaune)' },
].sort((a, b) => a.minute - b.minute) as ReplayEvent[]
