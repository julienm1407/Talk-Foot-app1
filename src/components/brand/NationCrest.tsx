import { useState } from 'react'
import type { Nation } from '../../data/nations'
import { nationFlagUrl } from '../../utils/nationFlagUrl'
import { cn } from '../../utils/cn'

const FLAG_HEIGHT: Record<'sm' | 'md' | 'lg' | 'xl', number> = {
  sm: 28,
  md: 40,
  lg: 56,
  xl: 80,
}

/**
 * Pastille ronde avec le drapeau du pays (image) ou emoji en secours.
 */
export function NationCrest({
  nation,
  size = 'md',
  className,
  withRing = true,
}: {
  nation: Nation
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  withRing?: boolean
}) {
  const dims =
    size === 'sm'
      ? 'h-7 w-7'
      : size === 'md'
        ? 'h-10 w-10'
        : size === 'lg'
          ? 'h-14 w-14'
          : 'h-20 w-20'

  const flagSrc = nationFlagUrl(nation.iso, FLAG_HEIGHT[size])
  const [imgFailed, setImgFailed] = useState(false)
  const showFlagImg = Boolean(flagSrc) && !imgFailed

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm',
        dims,
        withRing ? 'ring-2 ring-white/80' : null,
        className,
      )}
      aria-label={`Drapeau ${nation.nameFr}`}
      title={nation.nameFr}
    >
      {showFlagImg ? (
        <img
          src={flagSrc!}
          alt=""
          width={FLAG_HEIGHT[size]}
          height={FLAG_HEIGHT[size]}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span
          aria-hidden
          className={cn(
            'flex h-full w-full items-center justify-center leading-none',
            size === 'sm' ? 'text-sm' : size === 'md' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-3xl',
          )}
          style={{
            background: `linear-gradient(135deg, ${nation.primary} 0%, ${nation.secondary} 100%)`,
          }}
        >
          {nation.flag}
        </span>
      )}
    </span>
  )
}
