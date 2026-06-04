import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '../utils/cn'

/** Logo officiel Talk Foot (PNG fond blanc, 500×500) — référence Google / favicon / JSON-LD. */
export const TALKFOOT_LOGO_URL = `${import.meta.env.BASE_URL}logo-talk-foot.png`
const LOGO_PATH = TALKFOOT_LOGO_URL

const ENCART_IMAGE =
  'size-full max-w-none scale-[1.5] object-contain object-center bg-white p-0.5'

export type LogoEncartSize = 'sm' | 'lg'

const encartShellSize: Record<LogoEncartSize, string> = {
  sm: 'h-10 w-[3.65rem] sm:h-11 sm:w-[4rem]',
  lg: 'h-14 w-[5.1rem] sm:h-16 sm:w-[5.75rem]',
}

function encartShell(isLight: boolean, size: LogoEncartSize) {
  return cn(
    'relative block shrink-0 overflow-hidden rounded-xl border-2 bg-white shadow-sm',
    encartShellSize[size],
    isLight ? 'border-tf-dark/20 ring-1 ring-tf-dark/[0.06]' : 'border-white/30 ring-1 ring-black/10',
  )
}

/** Encart logo officiel (format unique sur tout le site). */
export function LogoEncart({
  size = 'sm',
  isLight = false,
  className,
  decorative = true,
}: {
  size?: LogoEncartSize
  isLight?: boolean
  className?: string
  decorative?: boolean
}) {
  return (
    <span className={cn(encartShell(isLight, size), className)}>
      <img
        src={LOGO_PATH}
        alt={decorative ? '' : 'Talk Foot'}
        width={500}
        height={500}
        className={ENCART_IMAGE}
        draggable={false}
        {...(decorative ? { 'aria-hidden': true as const } : {})}
      />
    </span>
  )
}

/** Logo encart cliquable — même rendu que `LogoEncart`. */
export function LogoEncartLink({
  to,
  isLight = false,
  size = 'sm',
  className,
  onClick,
  'aria-label': ariaLabel = 'Talk Foot — Accueil',
}: {
  to: LinkProps['to']
  isLight?: boolean
  size?: LogoEncartSize
  className?: string
  onClick?: LinkProps['onClick']
  'aria-label'?: string
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(encartShell(isLight, size), 'transition hover:opacity-95', className)}
      aria-label={ariaLabel}
    >
      <img
        src={LOGO_PATH}
        alt=""
        width={500}
        height={500}
        className={ENCART_IMAGE}
        draggable={false}
        aria-hidden
      />
    </Link>
  )
}

/**
 * @deprecated Utiliser `LogoEncart` ou `LogoEncartLink` — conserve la compatibilité des imports.
 */
export function LogoMark({
  variant: _variant = 'compact',
  className,
  decorative = true,
}: {
  variant?: 'compact' | 'header' | 'hero' | 'encart' | 'encartSquare'
  className?: string
  decorative?: boolean
}) {
  return (
    <LogoEncart
      size={_variant === 'hero' ? 'lg' : 'sm'}
      className={className}
      decorative={decorative}
    />
  )
}
