import { useEffect, useRef } from 'react'
import { cn } from '../../utils/cn'

type AdsFormat = 'auto' | 'horizontal' | 'vertical' | 'fluid' | 'rectangle'

type Props = {
  client: string
  slot: string
  format?: AdsFormat
  className?: string
  style?: React.CSSProperties
}

/** Unité display AdSense (ins.adsbygoogle + push). */
export function AdsenseDisplayUnit({ client, slot, format = 'auto', className, style }: Props) {
  const pushedRef = useRef(false)

  useEffect(() => {
    if (pushedRef.current) return
    pushedRef.current = true
    const raf = window.requestAnimationFrame(() => {
      try {
        const w = window as unknown as { adsbygoogle?: unknown[] }
        w.adsbygoogle = w.adsbygoogle || []
        w.adsbygoogle.push({})
      } catch {
        /* bloqueur de pub, script pas encore prêt, etc. */
      }
    })
    return () => {
      window.cancelAnimationFrame(raf)
      pushedRef.current = false
    }
  }, [client, slot])

  return (
    <ins
      className={cn('adsbygoogle', className)}
      style={{ display: 'block', ...style }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={format === 'vertical' ? undefined : 'true'}
    />
  )
}
