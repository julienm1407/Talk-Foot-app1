import { useState } from 'react'
import { cn } from '../../utils/cn'

const accentGradient: Record<string, string> = {
  violet: 'from-violet-400/70 to-violet-600/70',
  emerald: 'from-emerald-400/70 to-emerald-600/70',
  rose: 'from-rose-400/70 to-rose-600/70',
  amber: 'from-amber-300/70 to-amber-500/70',
}

/**
 * Avatar avec représentation humaine (illustration) pour une meilleure immersion.
 * Utilise DiceBear lorelei - style illustré, déterminé par le seed.
 * Fallback sur initiale si le chargement échoue.
 */
export function HumanAvatar({
  seed,
  accent = 'violet',
  alt = '',
  className,
}: {
  seed: string
  accent?: 'violet' | 'emerald' | 'rose' | 'amber'
  alt?: string
  className?: string
}) {
  const [errored, setErrored] = useState(false)
  const safeSeed = (seed.trim() || 'user') + `-${accent}`
  const url = `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(safeSeed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc`

  if (errored) {
    const initial = seed.trim().slice(0, 1).toUpperCase() || '?'
    const gradient = accentGradient[accent] ?? accentGradient.violet
    return (
      <div
        className={cn(
          'grid place-items-center rounded-2xl border border-white/20 bg-gradient-to-br shadow-[0_8px_30px_rgba(1,30,51,.12)] font-black text-white/90',
          gradient,
          className,
        )}
        aria-label={alt}
      >
        <span className="text-xl sm:text-2xl">{initial}</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-white/20 bg-white/5 shadow-[0_8px_30px_rgba(1,30,51,.12)]',
        className,
      )}
      aria-label={alt}
    >
      <img
        src={url}
        alt={alt || 'Avatar'}
        className="h-full w-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setErrored(true)}
      />
    </div>
  )
}
