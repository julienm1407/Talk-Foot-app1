import { cn } from './cn'
import type { Appearance } from '../contexts/AppearanceContext'

/** Carte « verre » hub TalkFoot — identique desktop & responsive. */
export function hubGlassPanel(appearance: Appearance) {
  const L = appearance === 'light'
  return cn(
    'rounded-tf-xl backdrop-blur-md',
    L
      ? 'border border-tf-dark/12 bg-tf-white shadow-tf-elev-2'
      : 'border border-tf-grey-pastel/25 bg-[color:var(--tf-card-bg-dark)] shadow-tf-elev-glass-dark',
  )
}

/** Bloc encadré tendances (sous le hero), même traitement partout. */
export function hubTrendsShell(appearance: Appearance) {
  const L = appearance === 'light'
  return cn(
    'rounded-tf-xl border p-5 backdrop-blur-md sm:p-6',
    L
      ? 'border-tf-dark/12 bg-tf-white shadow-tf-elev-1'
      : 'border-tf-grey-pastel/20 bg-[color:var(--tf-card-bg-dark)] shadow-tf-elev-glass-dark',
  )
}
