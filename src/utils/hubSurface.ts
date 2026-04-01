import { cn } from './cn'
import type { Appearance } from '../contexts/AppearanceContext'

/** Carte « verre » hub TalkFoot — identique desktop & responsive. */
export function hubGlassPanel(appearance: Appearance) {
  const L = appearance === 'light'
  return cn(
    'rounded-tf-xl backdrop-blur-md',
    L
      ? 'border border-[color:var(--tf-c30-border)] bg-[color:var(--tf-card-bg-light)] shadow-tf-elev-2'
      : 'border border-[color:var(--tf-c30-border)] bg-[color:var(--tf-card-bg-dark)] shadow-tf-elev-glass-dark',
  )
}

/** Bloc encadré tendances (sous le hero), même traitement partout. */
export function hubTrendsShell(appearance: Appearance) {
  const L = appearance === 'light'
  return cn(
    'rounded-tf-xl border p-5 backdrop-blur-md sm:p-6',
    L
      ? 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-card-bg-light)] shadow-tf-elev-1'
      : 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-card-bg-dark)] shadow-tf-elev-glass-dark',
  )
}
