import { cn } from '../utils/cn'

/** Texte principal — contraste garanti jour & nuit */
export const TF_TEXT_FG = 'text-tf-app-fg'
export const TF_TEXT_MUTED = 'text-tf-app-muted'
export const TF_TEXT_SUBTLE = 'text-tf-app-subtle'

/** Bloc titre / identité sur carte (évite verre trop transparent en nuit) */
export function tfIdentityGlass(L: boolean) {
  return cn(
    'inline-flex max-w-full flex-col rounded-2xl px-2.5 py-2 backdrop-blur-[1px] sm:px-3',
    L ? 'bg-white/90' : 'bg-[color:color-mix(in_srgb,var(--tf-c30-surface-soft)_96%,white)]',
  )
}

/** Pastille ou badge secondaire */
export function tfChipSurface(L: boolean, className?: string) {
  return cn(
    'rounded-full border',
    L
      ? 'border-tf-dark/12 bg-white text-tf-app-fg shadow-sm'
      : 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface-soft)] text-tf-app-fg',
    className,
  )
}

/** Bouton / lien discret sur fond carte */
export function tfGhostOnCard(L: boolean, className?: string) {
  return cn(
    'rounded-2xl border transition',
    L
      ? 'border-tf-dark/12 bg-white/95 text-tf-app-fg hover:border-tf-electric/35 hover:bg-white'
      : 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface-soft)] text-tf-app-fg hover:border-sky-300/45 hover:bg-[color:color-mix(in_srgb,var(--tf-c30-surface-soft)_88%,white)]',
    className,
  )
}

/** Carte interne (salon, sidebar) */
export function tfInsetCard(L: boolean, className?: string) {
  return cn(
    'rounded-2xl border',
    L
      ? 'border-tf-grey-pastel/50 bg-white/95 text-tf-app-fg'
      : 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface-soft)] text-tf-app-fg',
    className,
  )
}

/** En-tête zone chat / salon */
export function tfSalonHeader(L: boolean, className?: string) {
  return cn(
    'shrink-0 border-b',
    L
      ? 'border-tf-grey-pastel/50 bg-white/98 text-tf-app-fg'
      : 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface-soft)] text-tf-app-fg',
    className,
  )
}
