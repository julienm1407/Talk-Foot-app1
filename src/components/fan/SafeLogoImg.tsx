import { useState } from 'react'
import { cn } from '../../utils/cn'

/** Affiche un logo distant ; disparaît si l’image ne charge pas (pas de placeholder coloré). */
export function SafeLogoImg({
  src,
  alt,
  className,
}: {
  src: string | null | undefined
  alt: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  if (!src?.trim() || failed) return null
  return (
    <img
      src={src}
      alt={alt}
      className={cn('object-contain', className)}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
