import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Bet } from '../../types/bet'
import type { Match } from '../../types/match'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { cn } from '../../utils/cn'
import { resolveTeamLogoUrl } from '../../utils/catalogLogos'
import { ProfileCharacterThumb } from '../profile/ProfileCharacterThumb'
import {
  formatFinalScoreLine,
  formatPronoResultLine,
  formatShareStoryPick,
  matchWhenLabel,
  tribuneShareUrl,
} from '../../utils/tribuneShareLinks'
import { nativeShareStory, renderShareStoryPng, snapshotAvatarNode } from '../../utils/shareStoryCard'

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
  const { profile } = useProfile()
  const avatarRef = useRef<HTMLDivElement | null>(null)
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
      await new Promise((r) => window.setTimeout(r, 80))
      const avatarUrl = await snapshotAvatarNode(avatarRef.current)
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
        avatarUrl,
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
    setHint(null)
    const result = await nativeShareStory({
      blob: preview.blob,
      title: 'Talk Foot',
      text: preview.text,
      url: preview.shareUrl,
      fileName: preview.fileName,
    })
    setBusy(false)
    if (result === 'shared') setHint(null)
    else if (result === 'aborted') setHint(null)
    else {
      setHint('Appuie longtemps sur l’image, puis « Partager » vers Instagram ou Snapchat.')
    }
  }

  const closePreview = () => {
    if (preview?.objectUrl) URL.revokeObjectURL(preview.objectUrl)
    setPreview(null)
    setHint(null)
  }

  return (
    <div className={cn('mt-2 flex flex-wrap items-center gap-2', className)}>
      <div
        ref={avatarRef}
        className="pointer-events-none absolute -left-[9999px] top-0 h-40 w-40 overflow-hidden"
        aria-hidden
      >
        <ProfileCharacterThumb profile={profile} size="lg" shellPx={160} crop="bust" imagePriority />
      </div>
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
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void shareFromPreview()}
                    className="rounded-full bg-tf-cta px-3 py-2.5 text-xs font-black text-white"
                  >
                    {busy ? 'Ouverture…' : 'Partager (Instagram, Snapchat, WhatsApp…)'}
                  </button>
                  <button type="button" onClick={closePreview} className="py-1 text-xs font-semibold text-sky-200/80">
                    Fermer
                  </button>
                </div>
                {hint ? <p className="mt-2 text-[11px] font-semibold text-sky-100">{hint}</p> : null}
                <p className="mt-2 text-[10px] font-semibold leading-snug text-sky-200/70">
                  Choisis Instagram ou Snapchat dans la feuille du téléphone. L’image part avec ton prono.
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
