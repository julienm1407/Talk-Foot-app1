import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { LogoEncart } from '../layout/LogoMark'
import { preferredStoreUrl } from '../config/appStores'
import { bumpPronoShareClick, fetchPronoShare, rememberShareAttribution } from '../lib/supabase/pronoShares'
import type { PronoSharePayload } from '../utils/pronoSharePayload'
import { SITE_NAME } from '../seo/siteCopy'
import { absolutePageUrl } from '../seo/basePath'
import { cn } from '../utils/cn'

export function PronoShareLandingPage() {
  const { shareId = '' } = useParams()
  const [params] = useSearchParams()
  const [payload, setPayload] = useState<PronoSharePayload | null>(null)
  const [missing, setMissing] = useState(false)
  const stores = preferredStoreUrl()
  const native = Capacitor.isNativePlatform()

  useEffect(() => {
    rememberShareAttribution(params.get('src'), params.get('from'), shareId)
    void bumpPronoShareClick(shareId)
    let cancelled = false
    void fetchPronoShare(shareId).then((row) => {
      if (cancelled) return
      if (!row) setMissing(true)
      else setPayload(row)
    })
    return () => {
      cancelled = true
    }
  }, [shareId, params])

  useEffect(() => {
    if (!payload) return
    const title = `${payload.displayName} a dit ${payload.outcome} ${payload.team} — ${SITE_NAME}`
    document.title = title
    const og = payload.ogImageUrl || payload.storyImageUrl
    const url = absolutePageUrl(`/p/${shareId}`)
    const set = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }
    set('property', 'og:title', title)
    set('property', 'og:description', payload.invite || 'Fais ton prono sur Talk Foot.')
    set('property', 'og:url', url)
    if (og) {
      set('property', 'og:image', og)
      set('property', 'og:image:width', '1200')
      set('property', 'og:image:height', '630')
      set('name', 'twitter:image', og)
    }
    set('name', 'twitter:card', 'summary_large_image')
  }, [payload, shareId])

  const channelTo = payload
    ? `/channel/${encodeURIComponent(payload.matchId)}?src=share_prono&from=${encodeURIComponent(payload.sharerId)}`
    : '/match'

  useEffect(() => {
    if (!native || !payload) return
    window.location.replace(channelTo)
  }, [native, payload, channelTo])

  return (
    <div className="min-h-dvh bg-[#071a32] px-4 py-8 text-white">
      <div className="mx-auto flex max-w-md flex-col items-center gap-5">
        <LogoEncart size="lg" isLight={false} />
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-200/80">Talk Foot · prono partagé</p>
        {missing ? (
          <p className="text-center text-sm font-semibold text-sky-100">
            Ce lien a expiré. Installe l’app et fais tes propres pronos.
          </p>
        ) : payload ? (
          <>
            <h1 className="text-center font-display text-3xl font-black leading-tight">
              {payload.displayName} a dit
              <span className="mt-1 block text-5xl tracking-tight">{payload.outcome}</span>
              {payload.team ? <span className="block text-[#ff3b3b]">{payload.team}</span> : null}
            </h1>
            <p className="text-center text-sm font-semibold text-sky-200/80">
              {payload.home} – {payload.away}
              <br />
              {payload.competition} · {payload.when}
            </p>
            {payload.storyImageUrl ? (
              <img src={payload.storyImageUrl} alt="" className="w-full max-w-xs rounded-2xl shadow-2xl" />
            ) : null}
          </>
        ) : (
          <p className="text-sm font-semibold text-sky-200">Chargement du prono…</p>
        )}
        <a
          href={stores.primary.href}
          className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-tf-cta px-4 text-base font-black text-white"
        >
          {stores.primary.label}
        </a>
        <a
          href={stores.secondary.href}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/20 px-4 text-sm font-black text-white"
        >
          {stores.secondary.label}
        </a>
        <Link
          to={channelTo}
          className={cn('text-sm font-bold text-sky-200 underline-offset-2 hover:underline')}
        >
          Faire mon prono sur le site
        </Link>
      </div>
    </div>
  )
}
