import { useEffect, useState } from 'react'
import { cn } from '../../utils/cn'

/** Affiche un logo distant ; disparaît si l’image ne charge pas (pas de placeholder coloré). */
export function SafeLogoImg({
  src,
  alt,
  className,
  onError,
}: {
  src: string | null | undefined
  alt: string
  className?: string
  onError?: () => void
}) {
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    setFailed(false)
  }, [src])
  if (!src?.trim() || failed) return null
  return (
    <img
      src={src}
      alt={alt}
      className={cn('object-contain', className)}
      loading="lazy"
      decoding="async"
      onError={() => {
        setFailed(true)
        onError?.()
      }}
    />
  )
}
