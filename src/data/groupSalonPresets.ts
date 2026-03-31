import type { CSSProperties } from 'react'

/** Arrière-plans prédéfinis pour la zone chat des salons groupe (démo). */
export const GROUP_SALON_BG_PRESETS: Record<string, { label: string; style: CSSProperties }> = {
  night_stadium: {
    label: 'Stade de nuit',
    style: {
      background:
        'linear-gradient(165deg, #0c1929 0%, #1a2744 40%, #0a1628 72%, #050d18 100%)',
    },
  },
  turf_close: {
    label: 'Pelouse rapprochée',
    style: {
      background:
        'linear-gradient(180deg, #166534 0%, #15803d 35%, #14532d 70%, #052e16 100%)',
    },
  },
  ultras_smoke: {
    label: 'Fumigènes',
    style: {
      background:
        'linear-gradient(125deg, #7c2d12 0%, #ea580c 28%, #431407 55%, #0f172a 100%)',
    },
  },
  club_lounge: {
    label: 'Salon club',
    style: {
      background:
        'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e293b 100%)',
    },
  },
  floodlights: {
    label: 'Projecteurs',
    style: {
      background:
        'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(255,255,255,0.18), transparent 50%), linear-gradient(180deg, #0f172a, #020617)',
    },
  },
}

export const DEFAULT_GROUP_QUICK_EMOTES = ['⚽', '🔥', '👏', '😤', '💪', '❤️']
