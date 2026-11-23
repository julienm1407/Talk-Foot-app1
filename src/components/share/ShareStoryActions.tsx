import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Bet } from '../../types/bet'
import type { Match } from '../../types/match'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../utils/cn'
import { resolveTeamLogoUrl } from '../../utils/catalogLogos'
import {
  formatFinalScoreLine,
  formatPronoResultLine,
  formatShareStoryPick,
  matchWhenLabel,
  tribuneShareUrl,
} from '../../utils/tribuneShareLinks'
import {
  nativeShareAvailable,
  nativeShareStory,
  openStoryImageTab,
  renderShareStoryPng,
  saveStoryImage,
} from '../../utils/shareStoryCard'

type Props = {
  match: Match
  bet?: Bet | null
  kind: 'prono' | 'tribune'
  bestMessage?: string | null
  className?: string
  tone?: 'light' | 'dark'
}

type Preview = {
  objectUrl: string
  blob: Blob
  fileName: string
  text: string
  shareUrl: string
}

export function ShareStoryActions({ match, bet, kind, bestMessage, className, tone = 'dark' }: Props) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const displayName = user?.displayName?.trim() || 'Supporteur'
  const src = kind === 'prono' ? 'share_prono' : 'share_tribune'
  const url = tribuneShareUrl(match.id, src)
  const canNativeShare = nativeShareAvailable()

  useEffect(() => {
    return () => {
      if (preview?.objectUrl) URL.revokeObjectURL(preview.objectUrl)
    }
  }, [preview?.objectUrl])

  const openPreview = async () => {
    if (!bet && kind === 'prono') {
      setHint('Valide d’abord un prono.')
      return
    }
    setBusy(true)
    setHint(null)
    try {
      const pick = bet
        ? formatShareStoryPick(bet, match)
        : {
            marketLabel: 'Tribune',
            hero: `J’étais là pour ${match.home.shortName} – ${match.away.shortName}`,
            detail: formatFinalScoreLine(match),
          }
      const blob = await renderShareStoryPng({
        kind,
        homeName: match.home.name,
        awayName: match.away.name,
        homeShort: match.home.shortName,
        awayShort: match.away.shortName,
        homeColor: match.home.colors.primary,
        awayColor: match.away.colors.primary,
        homeLogoUrl: resolveTeamLogoUrl(match.home.id, {
          apiLogoUrl: match.home.logoUrl,
          sportMonksTeamId: match.home.sportMonksTeamId,
        }),
        awayLogoUrl: resolveTeamLogoUrl(match.away.id, {
          apiLogoUrl: match.away.logoUrl,
          sportMonksTeamId: match.away.sportMonksTeamId,
        }),
        competition: match.competition.name,
        whenLabel: matchWhenLabel(match),
        marketLabel: pick.marketLabel,
        hero: pick.hero,
        detail:
          kind === 'tribune'
            ? [formatFinalScoreLine(match), bet ? formatPronoResultLine(bet, match) : '']
                .filter(Boolean)
                .join(' · ')
            : pick.detail,
        oddsLabel: kind === 'prono' ? pick.oddsLabel : undefined,
        quote: kind === 'tribune' ? bestMessage : null,
        displayName,
        shareUrl: url,
        cta: 'Fais mieux que moi sur Talk Foot',
      })
      if (preview?.objectUrl) URL.revokeObjectURL(preview.objectUrl)
      setPreview({
        objectUrl: URL.createObjectURL(blob),
        blob,
        fileName: kind === 'prono' ? 'talk-foot-prono.png' : 'talk-foot-tribune.png',
        text: `${pick.marketLabel} : ${pick.hero} — Fais mieux que moi sur Talk Foot`,
        shareUrl: url,
      })
    } catch (err) {
      setHint(err instanceof Error ? `Impossible de générer la carte (${err.message}).` : 'Impossible de générer la carte.')
    } finally {
      setBusy(false)
    }
  }

  const shareFromPreview = async () => {
    if (!preview) return
    setBusy(true)
    const result = await nativeShareStory({
      blob: preview.blob,
      title: 'Talk Foot',
      text: preview.text,
      url: preview.shareUrl,
      fileName: preview.fileName,
    })
    setBusy(false)
    if (result === 'shared') setHint('Feuille de partage ouverte.')
    else if (result === 'aborted') setHint(null)
    else {
      setHint('Pas de feuille Instagram/WhatsApp ici. Enregistre l’image, puis importe-la dans l’app.')
    }
  }

  const saveFromPreview = async () => {
    if (!preview) return
    const result = await saveStoryImage(preview.blob, preview.fileName)
    if (result === 'saved') setHint('Image enregistrée. Si tu ne la vois pas, ouvre-la en grand puis clic droit → Enregistrer.')
    else if (result === 'cancelled') setHint(null)
    else setHint('Image ouverte dans un onglet : enregistre-la depuis là.')
  }

  const copyLink = async () => {
    if (!preview) return
    try {
      await navigator.clipboard.writeText(preview.shareUrl)
      setHint('Lien de la tribune copié.')
    } catch {
      setHint(preview.shareUrl)
    }
  }

  const closePreview = () => {
    if (preview?.objectUrl) URL.revokeObjectURL(preview.objectUrl)
    setPreview(null)
    setHint(null)
  }

  return (
    <div className={cn('mt-2 flex flex-wrap items-center gap-2', className)}>
      <button
        type="button"
        disabled={busy || (kind === 'prono' && !bet)}
        onClick={() => void openPreview()}
        className="rounded-full bg-tf-cta px-3 py-1.5 text-[11px] font-black text-white disabled:opacity-50"
      >
        {busy && !preview ? 'Préparation de la carte…' : kind === 'prono' ? 'Partager mon prono' : 'Partager « J’étais en tribune »'}
      </button>
      {hint && !preview ? (
        <p className={cn('w-full text-[11px] font-semibold', tone === 'light' ? 'text-emerald-800' : 'text-sky-200/90')}>
          {hint}
        </p>
      ) : null}
      {preview
        ? createPortal(
            <div
              className="fixed inset-0 z-[2147483600] flex items-end justify-center bg-black/75 p-3 sm:items-center"
              role="dialog"
              aria-modal="true"
              aria-label="Carte à partager"
              onClick={closePreview}
            >
              <div
                className="max-h-[94dvh] w-full max-w-sm overflow-y-auto rounded-2xl bg-[#071525] p-3 text-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-200/80">Aperçu story</p>
                <img
                  src={preview.objectUrl}
                  alt="Carte Talk Foot à partager"
                  className="mt-2 w-full rounded-xl bg-[#0b1b2f]"
                />
                <div className="mt-3 flex flex-col gap-2">
                  <a
                    href={preview.objectUrl}
                    download={preview.fileName}
                    className="rounded-full bg-tf-cta px-3 py-2 text-center text-xs font-black text-white"
                    onClick={() => setHint('Téléchargement lancé. Sinon « Ouvrir en grand » puis enregistre l’image.')}
                  >
                    Enregistrer l’image
                  </a>
                  <button
                    type="button"
                    onClick={() => void saveFromPreview()}
                    className="rounded-full border border-white/25 px-3 py-2 text-xs font-black"
                  >
                    Enregistrer sous…
                  </button>
                  {canNativeShare ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void shareFromPreview()}
                      className="rounded-full border border-white/25 px-3 py-2 text-xs font-black"
                    >
                      Partager (Instagram, WhatsApp…)
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      if (!openStoryImageTab(preview.objectUrl)) {
                        setHint('Autorise les pop-ups, ou appuie longtemps sur l’aperçu.')
                      }
                    }}
                    className="rounded-full border border-white/15 px-3 py-2 text-xs font-black text-sky-100"
                  >
                    Ouvrir l’image en grand
                  </button>
                  <button
                    type="button"
                    onClick={() => void copyLink()}
                    className="rounded-full border border-white/15 px-3 py-2 text-xs font-black text-sky-100"
                  >
                    Copier le lien de la tribune
                  </button>
                  <button type="button" onClick={closePreview} className="text-xs font-semibold text-sky-200/80">
                    Fermer
                  </button>
                </div>
                {hint ? <p className="mt-2 text-[11px] font-semibold text-sky-100">{hint}</p> : null}
                <p className="mt-2 text-[10px] font-semibold leading-snug text-sky-200/70">
                  {canNativeShare
                    ? 'Sur téléphone, « Partager » ouvre WhatsApp / Instagram. Sinon enregistre le PNG.'
                    : 'Sur ordinateur il n’y a pas de feuille Instagram : enregistre le PNG, puis importe-le dans l’app.'}
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
