import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '../utils/cn'
import { LogoMark } from './LogoMark'

const items = [
  { to: '/', label: 'Accueil', icon: '🏟️', hint: 'Matchs & salons' },
  { to: '/calendar', label: 'Agenda', icon: '🗓️', hint: 'Matchs à venir' },
  { to: '/profile', label: 'Profil', icon: '👤', hint: 'Ton compte' },
]

export function OverlayMenu({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        className="absolute inset-0 bg-tf-night/35 backdrop-blur-[2px]"
        aria-label="Fermer le menu"
        onClick={onClose}
      />

      <div className="absolute left-3 top-[72px] w-[320px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[28px] border border-tf-grey-pastel/55 bg-white/95 shadow-tf-card backdrop-blur-md sm:left-6">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <LogoMark variant="compact" />
            <div className="leading-tight">
              <span className="sr-only">Talk Foot</span>
              <div className="text-[11px] font-semibold text-tf-grey">Navigation</div>
            </div>
          </div>
        </div>

        <nav className="border-t border-tf-grey-pastel/50 px-2 py-2" aria-label="Menu">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group flex items-center justify-between gap-3 rounded-2xl px-3 py-3 outline-none transition',
                  isActive
                    ? 'bg-tf-electric-soft text-tf-dark ring-1 ring-tf-electric/25'
                    : 'text-tf-dark/80 hover:bg-tf-ice/80 hover:text-tf-dark',
                  'focus-visible:ring-2 focus-visible:ring-tf-electric/35',
                )
              }
            >
              <div className="flex items-center gap-3">
                <span className="text-base leading-none" aria-hidden="true">
                  {item.icon}
                </span>
                <div>
                  <div className="text-sm font-black">{item.label}</div>
                  <div className="text-[11px] font-semibold text-tf-grey">
                    {item.hint}
                  </div>
                </div>
              </div>
              <span className="text-sm text-tf-grey/50 transition group-hover:text-tf-electric-deep">
                →
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-tf-grey-pastel/50 px-4 py-3">
          <div className="text-xs font-semibold text-tf-grey">
            Astuce: glisse horizontalement pour changer de page.
          </div>
        </div>
      </div>
    </div>
  )
}

