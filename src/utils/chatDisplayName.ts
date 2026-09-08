import { pickHumanDisplayName } from './displayNameFromAuth'

export function safeChatDisplayName(
  name: string | null | undefined,
  fallback = 'Supporteur',
): string {
  return pickHumanDisplayName(typeof name === 'string' ? name : null, fallback)
}

export function safeChatAvatarSeed(
  name: string | null | undefined,
  fallback = 'you',
): string {
  return safeChatDisplayName(name, fallback).slice(0, 12).replace(/\s+/g, '-') || fallback
}

/** Nom affiché dans le fil : évite d’écraser un vrai pseudo par le placeholder générique. */
export function resolveChatDisplayLabel(
  authorDisplayName?: string | null,
  userUsername?: string | null,
  fallback = 'Supporteur',
): string {
  return pickHumanDisplayName(authorDisplayName, userUsername, fallback)
}
