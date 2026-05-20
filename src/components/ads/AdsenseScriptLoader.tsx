import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getAdsenseClient } from '../../config/ads'
import { shouldLoadAdsenseScript } from '../../config/adsPolicy'

const SCRIPT_ATTR = 'data-tf-adsense-loader'

/**
 * Charge le script AdSense uniquement sur les pages à contenu éditorial (accueil, articles).
 * Évite les violations « annonces sans contenu d’éditeur » sur salon / login / navigation.
 */
export function AdsenseScriptLoader() {
  const { pathname } = useLocation()

  useEffect(() => {
    const client = getAdsenseClient()
    if (!client || !shouldLoadAdsenseScript(pathname)) return

    if (document.querySelector(`script[${SCRIPT_ATTR}]`)) return

    const script = document.createElement('script')
    script.async = true
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`
    script.crossOrigin = 'anonymous'
    script.setAttribute(SCRIPT_ATTR, '1')
    document.head.appendChild(script)
  }, [pathname])

  return null
}
