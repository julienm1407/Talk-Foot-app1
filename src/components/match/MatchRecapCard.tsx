import { useState } from 'react'
import { cn } from '../../utils/cn'
import { nativeShareStory } from '../../utils/shareStoryCard'
import { renderMatchRecapStory } from '../../utils/renderMatchRecapStory'
import { APP_ONELINK_URL } from '../../config/appStores'
import { formatScorersLine, type MatchRecapModel } from '../../utils/matchRecap'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

export function MatchRecapCard({
  recap,
  light = false,
}: {
  recap: MatchRecapModel
  light?: boolean
}) {
  const { match, scorers, bestBettorName, topMessages, correctPronos } = recap
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const h = match.score?.home ?? 0
  const a = match.score?.away ?? 0
  const scorersLine = formatScorersLine(scorers)

  const onShare = async () => {
    setBusy(true)
    setHint(null)
    try {
      const blob = await renderMatchRecapStory(recap)
      const vs = `${match.home.shortName}–${match.away.shortName}`
      const out = await nativeShareStory({
        blob,
        title: `Récap ${vs}`,
        text: `Récap ${vs} ${h}-${a} · Talk Foot`,
        url: APP_ONELINK_URL,
        fileName: `talkfoot-recap-${match.id}.png`,
      })
      if (out === 'unavailable') setHint('Partage indisponible sur cet appareil.')
    } catch {
      setHint('Impossible de générer l’image.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      id="recap"
      className={cn(
        'scroll-mt-20 rounded-2xl border p-3 sm:p-4',
        light ? 'border-slate-200 bg-white' : 'border-[#3a6690]/60 bg-[#0c2339]',
      )}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-200/80">Récap du match</p>
      <p className="mt-1 font-display text-xl font-black text-tf-app-fg">
        {match.home.shortName} {h}–{a} {match.away.shortName}
      </p>
      {scorersLine ? <p className="mt-1 text-xs font-semibold text-tf-app-muted">{scorersLine}</p> : null}
      {bestBettorName ? (
        <p className="mt-2 text-sm font-bold text-tf-app-fg">Meilleur pronostiqueur : {bestBettorName}</p>
      ) : null}
      {correctPronos > 0 ? (
        <p className="text-xs font-semibold text-tf-app-muted">{correctPronos} pronos justes</p>
      ) : null}
      {topMessages.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {topMessages.map((m) => (
            <li key={`${m.username}-${m.text}`} className="text-xs font-semibold text-tf-app-fg">
              <span className="text-sky-300">{m.username}</span>
              <span className="text-tf-app-muted"> · {m.likes} ♥ · </span>
              {m.text}
            </li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void onShare()}
        className={cn(
          TF_FOCUS_VISIBLE,
          'mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-tf-cta px-4 text-sm font-black text-white disabled:opacity-60',
        )}
      >
        {busy ? 'Préparation…' : 'Partager'}
      </button>
      {hint ? <p className="mt-2 text-[11px] font-semibold text-rose-300">{hint}</p> : null}
    </section>
  )
}
