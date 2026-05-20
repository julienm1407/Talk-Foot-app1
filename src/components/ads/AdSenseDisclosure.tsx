import { cn } from '../../utils/cn'

/** Libellé obligatoire à proximité des annonces (transparence programme AdSense). */
export function AdSenseDisclosure({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        'text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500/90',
        className,
      )}
      aria-hidden
    >
      Annonce
    </p>
  )
}
