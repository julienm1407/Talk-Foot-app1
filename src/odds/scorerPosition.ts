export type ScorerPositionTier = 'gk' | 'def' | 'mid' | 'fwd'

/** Poste SM (`formation_position`) : 1 = gardien, 2–5 défense, 6–8 milieu, 9–11 attaque. */
export function scorerTierFromFormationPosition(formationPosition?: number): ScorerPositionTier | null {
  if (formationPosition == null || !Number.isFinite(formationPosition)) return null
  const p = Math.round(formationPosition)
  if (p === 1) return 'gk'
  if (p >= 2 && p <= 5) return 'def'
  if (p >= 6 && p <= 8) return 'mid'
  if (p >= 9 && p <= 11) return 'fwd'
  return null
}

export function scorerTierFromPositionLabel(label?: string | null): ScorerPositionTier | null {
  if (!label) return null
  const s = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  if (/goal|gardien|keeper|\bgk\b|portier/.test(s)) return 'gk'
  if (/striker|forward|attaquant|ailier|winger|\bst\b|\bcf\b|\blw\b|\brw\b|attack/.test(s)) return 'fwd'
  if (/mid|milieu|\bam\b|\bcm\b|\bdm\b/.test(s)) return 'mid'
  if (/defen|arriere|back|centre.?back|\bcb\b|\blb\b|\brb\b|lateral/.test(s)) return 'def'
  return null
}

function normPlayerKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/** SM n’envoie pas `lineups.player.position` (include 400) — repli nom pour stars / postes connus. */
const FWD_NAME_HINTS = [
  'dembele',
  'doue',
  'douwe',
  'barcola',
  'mbappe',
  'mbappé',
  'ferran',
  'haaland',
  'lewandowski',
  'kane',
  'vinicius',
  'rodrygo',
  'yamal',
  'raphinha',
  'salah',
  'saka',
  'son heung',
  'osihmen',
  'osimhen',
  'gyokeres',
  'isak',
  'watkins',
  'havertz',
  'nkunku',
  'kolo muani',
  'gonzalez',
]
const MID_NAME_HINTS = [
  'vitinha',
  'neves',
  'pedri',
  'gavi',
  'rodri',
  'valverde',
  'bellingham',
  'modric',
  'de bruyne',
  'odegaard',
  'rice',
  'wirtz',
  'musiala',
  'kimmich',
  'tchouameni',
  'fabian ruiz',
  'zaire-emery',
  'zaire emery',
]
const DEF_NAME_HINTS = [
  'nuno mendes',
  'hakimi',
  'marquinhos',
  'kounde',
  'cubarsi',
  'araujo',
  'balde',
  'digne',
  'hernandez',
  'upamecano',
  'saliba',
  'gabriel magalhaes',
  'van dijk',
  'walker',
]
const GK_NAME_HINTS = [
  'chevalier',
  'donnarumma',
  'ter stegen',
  'courtois',
  'allison',
  'alisson',
  'ederson',
  'maignan',
  'szczesny',
  'raya',
  'mamardashvili',
]

export function scorerTierFromPlayerName(name?: string | null): ScorerPositionTier | null {
  if (!name) return null
  const s = normPlayerKey(name)
  if (!s) return null
  if (GK_NAME_HINTS.some((h) => s.includes(h))) return 'gk'
  if (FWD_NAME_HINTS.some((h) => s.includes(h.trim()))) return 'fwd'
  if (MID_NAME_HINTS.some((h) => s.includes(h))) return 'mid'
  if (DEF_NAME_HINTS.some((h) => s.includes(h))) return 'def'
  return null
}

export function scorerTierFromExpectedGoals(expectedGoals?: number): ScorerPositionTier | null {
  if (expectedGoals == null || !Number.isFinite(expectedGoals)) return null
  if (expectedGoals >= 0.28) return 'fwd'
  if (expectedGoals >= 0.1) return 'mid'
  return null
}

export function resolveScorerPositionTier(input: {
  formationPosition?: number
  positionLabel?: string | null
  positionRole?: ScorerPositionTier | null
  playerName?: string | null
  expectedGoals?: number
  /** Banc sans poste : milieu neutre, jamais défenseur @32. */
  isStarter?: boolean
}): ScorerPositionTier {
  if (input.positionRole) return input.positionRole
  const fromLabel = scorerTierFromPositionLabel(input.positionLabel)
  if (fromLabel) return fromLabel
  const fromForm = scorerTierFromFormationPosition(input.formationPosition)
  if (fromForm) return fromForm
  const fromName = scorerTierFromPlayerName(input.playerName)
  if (fromName) return fromName
  const fromXg = scorerTierFromExpectedGoals(input.expectedGoals)
  if (fromXg) return fromXg
  return 'mid'
}

export function isAnytimeScorerEligible(tier: ScorerPositionTier): boolean {
  return tier !== 'gk'
}
