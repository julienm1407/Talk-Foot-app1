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

export function resolveScorerPositionTier(input: {
  formationPosition?: number
  positionLabel?: string | null
  positionRole?: ScorerPositionTier | null
  /** Banc sans poste connu → défense (évite une cote milieu ~9 par défaut). */
  isStarter?: boolean
}): ScorerPositionTier {
  if (input.positionRole) return input.positionRole
  const fromLabel = scorerTierFromPositionLabel(input.positionLabel)
  if (fromLabel) return fromLabel
  const fromForm = scorerTierFromFormationPosition(input.formationPosition)
  if (fromForm) return fromForm
  if (input.isStarter === false) return 'def'
  return 'mid'
}

export function isAnytimeScorerEligible(tier: ScorerPositionTier): boolean {
  return tier !== 'gk'
}
