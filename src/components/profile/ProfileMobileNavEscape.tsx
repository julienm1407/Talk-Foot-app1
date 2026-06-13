import { cn } from '../../utils/cn'
import { hardNavigateTo } from '../../utils/hardNavigate'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

const LINKS = [
  { to: '/', label: 'Accueil', icon: '🏟️' },
  { to: '/match', label: 'Matchs', icon: '⚽' },
  { to: '/groups', label: 'Groupes', icon: '👥' },
] as const

/** Barre de secours dans la zone scrollable — contourne le vol de taps sur le chrome mobile. */
export function ProfileMobileNavEscape({ className }: { className?: string }) {
  return (
    <nav
      className={cn(
        'sticky top-0 z-20 -mx-1 mb-4 flex gap-1.5 overflow-x-auto rounded-2xl border border-sky-400/25 bg-sky-950/90 p-1.5 shadow-lg backdrop-blur-md lg:hidden',
        className,
      )}
      aria-label="Navigation rapide"
    >
      {LINKS.map(({ to, label, icon }) => (
        <button
          key={to}
          type="button"
          onClick={() => hardNavigateTo(to)}
          className={cn(
            TF_FOCUS_VISIBLE,
            'tf-nav-pill inline-flex min-h-tf-touch shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black text-white outline-none active:scale-[0.98]',
            'bg-white/10 hover:bg-white/15',
          )}
        >
          <span aria-hidden>{icon}</span>
          {label}
        </button>
      ))}
    </nav>
  )
}
