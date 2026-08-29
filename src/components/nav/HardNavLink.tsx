import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { hardNavigateTo, isProfilePath } from '../../utils/hardNavigate'

type HardNavLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string
  children: ReactNode
  /** Force un rechargement complet même hors page profil. */
  forceHard?: boolean
}

/**
 * Lien interne fiable sur mobile (page profil : React Router rate souvent les taps).
 */
export function HardNavLink({
  to,
  children,
  className,
  forceHard = false,
  onClick,
  ...rest
}: HardNavLinkProps) {
  const { pathname } = useLocation()
  const href = to.startsWith('/') ? to : `/${to}`
  const useHard = forceHard || isProfilePath(pathname)

  return (
    <a
      {...rest}
      href={href}
      className={cn(className)}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented) return
        if (useHard) {
          e.preventDefault()
          hardNavigateTo(href)
        }
      }}
    >
      {children}
    </a>
  )
}
