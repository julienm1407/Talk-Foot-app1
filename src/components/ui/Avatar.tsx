import { useState } from 'react'
import { cn } from '../../utils/cn'
import { dicebearAvatarUrl } from '../../utils/dicebearAvatar'

const accentMap: Record<string, string> = {
  violet: 'from-violet-400/70 to-violet-600/70',
  emerald: 'from-emerald-400/70 to-emerald-600/70',
  rose: 'from-rose-400/70 to-rose-600/70',
  amber: 'from-amber-300/70 to-amber-500/70',
}

function InitialFallback({
  seed,
  accent,
  className,
}: {
  seed: string
  accent: string
  className?: string
}) {
  const gradient = accentMap[accent] ?? accentMap.violet
  const initial = seed.trim().slice(0, 1).toUpperCase() || '⚽'
  return (
    <div
      className={cn(
        'grid size-full place-items-center rounded-[inherit] bg-gradient-to-br text-xs font-black text-white/90',
        gradient,
        className,
      )}
    >
      {initial}
    </div>
  )
}

/**
 * Avatar liste / messages : illustration DiceBear (léger, pas de lib lourde), repli initiale si l’image ne charge pas.
 */
export function Avatar({
  seed,
  accent = 'violet',
  className,
  alt = '',
}: {
  seed: string
  accent?: 'violet' | 'emerald' | 'rose' | 'amber'
  className?: string
  alt?: string
}) {
  const [failed, setFailed] = useState(false)
  const src = dicebearAvatarUrl(seed, 128)

  return (
    <div
      className={cn(
        'relative size-9 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_18px_50px_rgba(0,0,0,.35)]',
        className,
      )}
      aria-label={alt || undefined}
    >
      {failed ? (
        <InitialFallback seed={seed} accent={accent} />
      ) : (
        <img
          src={src}
          alt={alt}
          width={128}
          height={128}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="size-full object-cover object-center"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}
