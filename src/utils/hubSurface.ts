import { cn } from './cn'
import type { Appearance } from '../contexts/AppearanceContext'

/** Carte « verre » hub TalkFoot — identique desktop & responsive. */
export function hubGlassPanel(appearance: Appearance) {
  const L = appearance === 'light'
  return cn(
    'rounded-2xl backdrop-blur-xl',
    L
      ? 'border border-tf-dark/10 bg-white/92 shadow-[0_8px_28px_rgba(1,30,51,0.08)]'
      : 'border border-white/[0.08] bg-white/[0.05] shadow-[0_12px_40px_rgba(0,0,0,0.35)]',
  )
}

/** Bloc encadré tendances (sous le hero), même traitement partout. */
export function hubTrendsShell(appearance: Appearance) {
  const L = appearance === 'light'
  return cn(
    'rounded-[22px] border p-5 backdrop-blur-md sm:p-6',
    L
      ? 'border-tf-dark/10 bg-white/90 shadow-sm'
      : 'border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
  )
}
