import type { Message } from '../types/chat'

const base = Date.now() - 5 * 60_000

/** Messages seed Rennes–PSG (replay) avec salons tribunes pour le fil groupe. */
const replayRennesPsg: Message[] = [
  {
    id: 'msg-rp-1',
    matchId: 'm-api-1213970',
    userId: 'u-2',
    text: 'Roazhon qui pousse — on sent la ferveur même devant l’écran.',
    createdAt: base + 8_000,
    tribune: 'virage',
    supporterGroupId: 'g-roazhon-kop',
  },
  {
    id: 'msg-rp-2',
    matchId: 'm-api-1213970',
    userId: 'u-1',
    text: 'Paris en place haute, faut tenir les premières minutes.',
    createdAt: base + 22_000,
    tribune: 'analyse',
    supporterGroupId: 'g-ultras-nuit',
  },
  {
    id: 'msg-rp-3',
    matchId: 'm-api-1213970',
    userId: 'u-3',
    text: 'Neutre ici : le milieu rennais va être testé sur les transitions.',
    createdAt: base + 41_000,
    tribune: 'analyse',
    supporterGroupId: 'g-l1-neutral',
  },
  {
    id: 'msg-rp-4',
    matchId: 'm-api-1213970',
    userId: 'u-4',
    text: 'ALLEZ RENNES — corner à venir, ça sent le danger.',
    createdAt: base + 55_000,
    tribune: 'virage',
    supporterGroupId: 'g-roazhon-kop',
  },
  {
    id: 'msg-rp-5',
    matchId: 'm-api-1213970',
    userId: 'u-5',
    text: 'Dembélé chaud ce soir, le couloir droit va fumer.',
    createdAt: base + 71_000,
    tribune: 'virage',
    supporterGroupId: 'g-ultras-nuit',
  },
]

export const initialMessages: Message[] = [
  ...replayRennesPsg,
  {
    id: 'msg-1',
    matchId: 'm-rma-fcb',
    userId: 'u-2',
    text: 'Pressing de malade… ça sent le but.',
    createdAt: base + 15_000,
    tribune: 'virage',
  },
  {
    id: 'msg-2',
    matchId: 'm-rma-fcb',
    userId: 'u-1',
    text: 'Le stade est en feu, on entend tout même à la TV.',
    createdAt: base + 35_000,
    tribune: 'virage',
  },
  {
    id: 'msg-3',
    matchId: 'm-rma-fcb',
    userId: 'u-3',
    text: 'Carton? Non mais sérieux…',
    createdAt: base + 58_000,
    tribune: 'chill',
  },
  {
    id: 'msg-4',
    matchId: 'm-rma-fcb',
    userId: 'u-4',
    text: 'On a perdu le milieu là… faut calmer.',
    createdAt: base + 77_000,
    tribune: 'analyse',
  },
  {
    id: 'msg-5',
    matchId: 'm-psg-om',
    userId: 'u-5',
    text: 'Avant-match: qui marque en premier?',
    createdAt: base + 95_000,
    tribune: 'analyse',
  },
  {
    id: 'msg-d1',
    matchId: 'm-demo-live',
    userId: 'u-2',
    text: 'Le Classique, ça chauffe déjà.',
    createdAt: base + 10_000,
    tribune: 'virage',
  },
  {
    id: 'msg-d2',
    matchId: 'm-demo-live',
    userId: 'u-1',
    text: 'PSG mène 1-0 mais l’OM pousse bien.',
    createdAt: base + 120_000,
    tribune: 'analyse',
  },
  {
    id: 'msg-d3',
    matchId: 'm-demo-live',
    userId: 'u-4',
    text: 'Quel but de #9 à la 23e, quelle frappe.',
    createdAt: base + 150_000,
    tribune: 'virage',
  },
]

