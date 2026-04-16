import { useEffect } from 'react'
import { getAdsenseClient } from '../../config/ads'

const MARKER = 'data-talkfoot-adsense'

/** Charge le script AdSense une fois si `VITE_ADSENSE_CLIENT` est défini. */
export function AdsenseScript() {
  useEffect(() => {
    const client = getAdsenseClient()
    if (!client) return
    if (document.querySelector(`script[${MARKER}]`)) return
    const script = document.createElement('script')
    script.async = true
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`
    script.crossOrigin = 'anonymous'
    script.setAttribute(MARKER, '1')
    document.head.appendChild(script)
  }, [])
  return null
}
