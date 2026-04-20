import { cn } from './cn'
import type { Appearance } from '../contexts/AppearanceContext'
import { TF_FOCUS_VISIBLE } from '../theme/designSystem'

/** Lien ou bouton navigation en « pilule » dans les encarts (remplace le texte souligné seul). */
export function hubPillLink(appearance: Appearance, size: 'xs' | 'sm' | 'md' = 'sm') {
  const L = appearance === 'light'
  const sz =
    size === 'xs'
      ? 'min-h-0 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] leading-tight'
      : size === 'sm'
        ? 'min-h-[1.75rem] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.11em]'
        : 'min-h-[2rem] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em]'
  return cn(
    'inline-flex max-w-full items-center justify-center rounded-full border transition active:scale-[0.98]',
    TF_FOCUS_VISIBLE,
    sz,
    L
      ? 'border-tf-dark/16 bg-white/92 text-tf-dark shadow-sm hover:border-tf-dark/26 hover:bg-white hover:shadow-md'
      : 'border-white/18 bg-white/[0.09] text-sky-100 hover:border-white/30 hover:bg-white/[0.14] hover:shadow-md hover:shadow-black/25',
  )
}

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
