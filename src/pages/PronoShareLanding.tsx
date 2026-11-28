import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { LogoEncart } from '../layout/LogoMark'
import { APP_ONELINK_URL, preferredStoreUrl } from '../config/appStores'
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
        {payload ? <GuestDefyForm payload={payload} channelTo={channelTo} /> : null}
        <a
          href={APP_ONELINK_URL}
          className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-tf-cta px-4 text-base font-black text-white"
        >
          Télécharger l’appli Talk Foot
        </a>
        <a
          href={stores.primary.href}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/20 px-4 text-sm font-black text-white"
        >
          {stores.primary.label}
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

function GuestDefyForm({
  payload,
  channelTo,
}: {
  payload: PronoSharePayload
  channelTo: string
}) {
  const [pseudo, setPseudo] = useState('')
  const [done, setDone] = useState<string | null>(null)

  const save = (side: 'home' | 'draw' | 'away') => {
    const name = pseudo.trim() || 'Invité'
    const label = side === 'home' ? payload.homeShort : side === 'away' ? payload.awayShort : 'Match nul'
    try {
      window.localStorage.setItem(
        `talkfoot.defy.${payload.matchId}`,
        JSON.stringify({
          matchId: payload.matchId,
          aName: payload.displayName,
          aPick: payload.outcome,
          bName: name,
          bPick: label,
          at: Date.now(),
        }),
      )
    } catch {
      /* ignore */
    }
    setDone(label)
  }

  if (done) {
    return (
      <p className="w-full rounded-2xl border border-emerald-400/30 bg-emerald-950/40 px-4 py-3 text-center text-sm font-bold text-emerald-100">
        C’est noté {pseudo.trim() || ''} : {done}. Télécharge l’appli pour le duel en jetons.
      </p>
    )
  }

  return (
    <div className="w-full rounded-2xl border border-white/15 bg-white/5 p-4">
      <p className="text-center text-sm font-black">Toi tu dis quoi ?</p>
      <p className="mt-1 text-center text-[11px] font-semibold text-sky-200/80">Un pseudo suffit — pas besoin de compte.</p>
      <input
        value={pseudo}
        onChange={(e) => setPseudo(e.target.value.slice(0, 20))}
        placeholder="Ton pseudo"
        className="mt-3 w-full rounded-xl border border-white/20 bg-[#071a32] px-3 py-2 text-sm font-bold text-white"
        maxLength={20}
      />
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button type="button" className="rounded-xl bg-white/10 py-2 text-xs font-black" onClick={() => save('home')}>
          {payload.homeShort}
        </button>
        <button type="button" className="rounded-xl bg-white/10 py-2 text-xs font-black" onClick={() => save('draw')}>
          Nul
        </button>
        <button type="button" className="rounded-xl bg-white/10 py-2 text-xs font-black" onClick={() => save('away')}>
          {payload.awayShort}
        </button>
      </div>
      <Link to={channelTo} className="mt-3 block text-center text-[11px] font-bold text-sky-200 underline">
        Ouvrir le match
      </Link>
    </div>
  )
}
