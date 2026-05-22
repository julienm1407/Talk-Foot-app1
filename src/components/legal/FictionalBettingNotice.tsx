import { Link } from 'react-router-dom'
import { useAppearance } from '../../contexts/AppearanceContext'
import { cn } from '../../utils/cn'

/** Rappel visible — paris à jetons fictifs (conformité AdSense / pas de jeu d'argent réel). */
export function FictionalBettingNotice({ className }: { className?: string }) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  return (
    <p
      className={cn(
        'rounded-2xl border px-4 py-3 text-xs font-semibold leading-relaxed',
        L
          ? 'border-amber-200/90 bg-amber-50/90 text-amber-950'
          : 'border-amber-400/30 bg-amber-950/40 text-amber-50/95',
        className,
      )}
      role="note"
    >
      <strong className="font-black">Jeu social sans argent réel.</strong> Les paris sur Talk Foot utilisent des
      jetons virtuels sans valeur monétaire : aucun dépôt, gain ou retrait en euros. Ce n&apos;est pas un site de
      paris sportifs réglementé.{' '}
      <Link to="/terms" className="font-bold text-tf-cta underline-offset-2 hover:underline">
        En savoir plus
      </Link>
      .
    </p>
  )
}
