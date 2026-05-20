import { useEffect, useRef, useState } from 'react'
import { cn } from '../../utils/cn'

type AdsFormat = 'auto' | 'horizontal' | 'vertical' | 'fluid' | 'rectangle'

type Props = {
  client: string
  slot: string
  format?: AdsFormat
  className?: string
  style?: React.CSSProperties
}

function waitForAdsenseScript(maxMs = 8000): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  const w = window as unknown as { adsbygoogle?: unknown[] }
  if (Array.isArray(w.adsbygoogle)) return Promise.resolve(true)

  return new Promise((resolve) => {
    const start = Date.now()
    const tick = () => {
      if (Array.isArray((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle)) {
        resolve(true)
        return
      }
      if (Date.now() - start >= maxMs) {
        resolve(false)
        return
      }
      window.setTimeout(tick, 120)
    }
    tick()
  })
}

/** Unité display AdSense (ins.adsbygoogle + push). */
export function AdsenseDisplayUnit({ client, slot, format = 'auto', className, style }: Props) {
  const insRef = useRef<HTMLModElement>(null)
  const pushedRef = useRef(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    pushedRef.current = false

    void (async () => {
      const ok = await waitForAdsenseScript()
      if (cancelled || !ok || !insRef.current) return
      if (pushedRef.current) return
      try {
        const w = window as unknown as { adsbygoogle?: unknown[] }
        w.adsbygoogle = w.adsbygoogle || []
        w.adsbygoogle.push({})
        pushedRef.current = true
        setReady(true)
      } catch {
        /* bloqueur de pub, etc. */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [client, slot])

  return (
    <ins
      ref={insRef}
      className={cn('adsbygoogle', !ready && 'min-h-[90px]', className)}
      style={{ display: 'block', ...style }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={format === 'vertical' ? undefined : 'true'}
    />
  )
}
