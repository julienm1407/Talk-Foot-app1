import { useState } from 'react'
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

export function ShareStoryActions({ match, bet, kind, bestMessage, className, tone = 'dark' }: Props) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const displayName = user?.displayName?.trim() || 'Supporteur'
  const src = kind === 'prono' ? 'share_prono' : 'share_tribune'
  const url = tribuneShareUrl(match.id, src)

  const run = async (mode: 'share' | 'save') => {
    if (!bet && kind === 'prono') return
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
      const fileName = kind === 'prono' ? 'talk-foot-prono.png' : 'talk-foot-tribune.png'
      const text = `${headline} — Fais mieux que moi sur Talk Foot`
      if (mode === 'save') {
        await saveStoryImage(blob, fileName)
        setHint('Image enregistrée.')
      } else {
        const result = await nativeShareStory({
          blob,
          title: 'Talk Foot',
          text,
          url,
          fileName,
        })
        setHint(result === 'saved' ? 'Image enregistrée (partage natif indisponible).' : 'Partage ouvert.')
      }
    } catch {
      setHint('Impossible de générer la carte.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={cn('mt-2 flex flex-wrap items-center gap-2', className)}>
      <button
        type="button"
        disabled={busy || (kind === 'prono' && !bet)}
        onClick={() => void run('share')}
        className="rounded-full bg-tf-cta px-3 py-1.5 text-[11px] font-black text-white disabled:opacity-50"
      >
        {kind === 'prono' ? 'Partager mon prono' : 'Partager « J’étais en tribune »'}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => void run('save')}
        className={cn(
          'rounded-full border px-3 py-1.5 text-[11px] font-black',
          tone === 'light' ? 'border-slate-300 text-slate-800' : 'border-white/25 text-sky-100',
        )}
      >
        Enregistrer l’image
      </button>
      {hint ? (
        <p className={cn('w-full text-[11px] font-semibold', tone === 'light' ? 'text-emerald-800' : 'text-sky-200/90')}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}
