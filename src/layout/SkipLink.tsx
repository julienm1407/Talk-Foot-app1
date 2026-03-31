import { cn } from '../utils/cn'

/** Lien d’évitement — premier focus tab, envoie vers #main-content */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className={cn(
        'fixed left-4 top-4 z-[100] -translate-y-[200%] rounded-tf-xl px-4 py-2.5',
        'min-h-[var(--tf-touch-target-min)] text-sm font-black text-white',
        'bg-gradient-to-b from-sky-500 to-blue-700 shadow-tf-elev-3',
        'outline-none transition-transform duration-200 ease-out',
        'focus:translate-y-0 focus-visible:translate-y-0',
        'focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sky-900',
      )}
    >
      Aller au contenu
    </a>
  )
}
