import { CDM_BETA_PARTICIPANT_CUTOFF_MS } from '../config/cdmBetaBadge'
import type { UserProfile } from '../types/profile'
import type { PronoBadge } from './pronoStatsFromBets'

export function isCdmBetaParticipantEligible(atMs = Date.now()): boolean {
  return Number.isFinite(CDM_BETA_PARTICIPANT_CUTOFF_MS) && atMs <= CDM_BETA_PARTICIPANT_CUTOFF_MS
}

/** Accorde le badge aux comptes créés pendant la beta CDM (fenêtre figée au déploiement). */
export function withCdmBetaParticipant(profile: UserProfile, atMs = Date.now()): UserProfile {
  if (profile.cdmBetaParticipant) return profile
  if (!isCdmBetaParticipantEligible(atMs)) return profile
  return { ...profile, cdmBetaParticipant: true }
}

export function buildCdmBetaBadge(light: boolean): PronoBadge {
  return {
    kind: 'beta',
    label: 'Beta CDM 2026',
    hint: 'Présent pendant la beta Coupe du Monde Talk Foot',
    className: light
      ? 'border-sky-300/80 bg-sky-50 text-sky-900'
      : 'border-sky-400/35 bg-sky-950/50 text-sky-100',
  }
}
