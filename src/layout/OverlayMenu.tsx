import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '../utils/cn'
import { LogoMark } from './LogoMark'

const items = [
  { to: '/', label: 'Accueil', icon: '🏟️', hint: 'Matchs + serveurs' },
  { to: '/calendar', label: 'Calendrier', icon: '🗓️', hint: 'Matchs à venir' },
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
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]"
        aria-label="Fermer le menu"
        onClick={onClose}
      />

      <div className="absolute left-3 top-[72px] w-[320px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/92 shadow-[0_24px_70px_rgba(11,27,58,.22)] backdrop-blur sm:left-6">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div className="leading-tight">
              <div className="text-sm font-black tracking-tight text-slate-900">
                Talk Foot
              </div>
              <div className="text-[11px] font-semibold text-slate-600">
                Navigation
              </div>
            </div>
          </div>
        </div>

        <nav className="border-t border-slate-200/80 px-2 py-2" aria-label="Menu">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group flex items-center justify-between gap-3 rounded-2xl px-3 py-3 outline-none transition',
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
                  'focus-visible:ring-2 focus-visible:ring-blue-600/20',
                )
              }
            >
              <div className="flex items-center gap-3">
                <span className="text-base leading-none" aria-hidden="true">
                  {item.icon}
                </span>
                <div>
                  <div className="text-sm font-black">{item.label}</div>
                  <div className="text-[11px] font-semibold text-slate-600">
                    {item.hint}
                  </div>
                </div>
              </div>
              <span className="text-sm text-slate-400 transition group-hover:text-slate-600">
                →
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200/80 px-4 py-3">
          <div className="text-xs font-semibold text-slate-600">
            Astuce: glisse horizontalement pour changer de page.
          </div>
        </div>
      </div>
    </div>
  )
}

