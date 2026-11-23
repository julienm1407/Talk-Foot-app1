import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Bet } from '../../types/bet'
import type { Match } from '../../types/match'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../utils/cn'
import {
  formatFinalScoreLine,
  formatPronoResultLine,
  formatPronoShareLine,
  matchAfficheLabel,
  matchWhenLabel,
  tribuneShareUrl,
} from '../../utils/tribuneShareLinks'
import { nativeShareStory, renderShareStoryPng, saveStoryImage } from '../../utils/shareStoryCard'

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
      const headline =
        kind === 'prono'
          ? formatPronoShareLine(bet!, match)
          : `J’étais en tribune pour ${match.home.shortName} – ${match.away.shortName}`
      const blob = await renderShareStoryPng({
        kind,
        matchTitle: matchAfficheLabel(match),
        whenLabel: matchWhenLabel(match),
        headline,
        subline:
          kind === 'tribune'
            ? [formatFinalScoreLine(match), bet ? formatPronoResultLine(bet, match) : '']
                .filter(Boolean)
                .join(' · ')
            : undefined,
        quote: kind === 'tribune' ? bestMessage : null,
        displayName,
        avatarUrl: user?.avatarUrl,
        shareUrl: url,
        cta: 'Fais mieux que moi sur Talk Foot',
      })
      if (preview?.objectUrl) URL.revokeObjectURL(preview.objectUrl)
      setPreview({
        objectUrl: URL.createObjectURL(blob),
        blob,
        fileName: kind === 'prono' ? 'talk-foot-prono.png' : 'talk-foot-tribune.png',
        text: `${headline} — Fais mieux que moi sur Talk Foot`,
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
      setHint('Ce navigateur n’a pas de feuille de partage. Enregistre l’image ou copie le lien.')
    }
  }

  const saveFromPreview = () => {
    if (!preview) return
    saveStoryImage(preview.blob, preview.fileName)
    setHint('Téléchargement lancé (dossier Téléchargements). Sinon appuie longtemps sur l’aperçu pour l’enregistrer.')
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
              className="fixed inset-0 z-[2147483600] flex items-end justify-center bg-black/70 p-3 sm:items-center"
              role="dialog"
              aria-modal="true"
              aria-label="Carte à partager"
              onClick={() => {
                URL.revokeObjectURL(preview.objectUrl)
                setPreview(null)
                setHint(null)
              }}
            >
              <div
                className="max-h-[92dvh] w-full max-w-sm overflow-y-auto rounded-2xl bg-[#061222] p-3 text-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-[10px] font-black uppercase tracking-wide text-sky-200/80">Aperçu story</p>
                <img
                  src={preview.objectUrl}
                  alt="Carte Talk Foot à partager"
                  className="mt-2 w-full rounded-xl"
                />
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void shareFromPreview()}
                    className="rounded-full bg-tf-cta px-3 py-2 text-xs font-black text-white"
                  >
                    Partager (Instagram, WhatsApp…)
                  </button>
                  <button
                    type="button"
                    onClick={saveFromPreview}
                    className="rounded-full border border-white/25 px-3 py-2 text-xs font-black"
                  >
                    Enregistrer l’image
                  </button>
                  <button
                    type="button"
                    onClick={() => void copyLink()}
                    className="rounded-full border border-white/15 px-3 py-2 text-xs font-black text-sky-100"
                  >
                    Copier le lien de la tribune
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(preview.objectUrl)
                      setPreview(null)
                      setHint(null)
                    }}
                    className="text-xs font-semibold text-sky-200/80"
                  >
                    Fermer
                  </button>
                </div>
                {hint ? <p className="mt-2 text-[11px] font-semibold text-sky-100">{hint}</p> : null}
                <p className="mt-2 text-[10px] font-semibold leading-snug text-sky-200/70">
                  Sur ordinateur, la feuille Instagram n’existe pas : enregistre l’image (Téléchargements) puis
                  importe-la dans l’app. Sur téléphone, le 2e tap « Partager » ouvre bien la feuille native.
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
