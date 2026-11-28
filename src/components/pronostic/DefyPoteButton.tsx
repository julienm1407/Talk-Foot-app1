import { useState } from 'react'
import type { Bet } from '../../types/bet'
import type { Match } from '../../types/match'
import { APP_ONELINK_URL } from '../../config/appStores'
import { formatPronoShareInvite, formatShareStoryPick, pronoSharePageUrl } from '../../utils/tribuneShareLinks'
import { encodeInlineShareId, randomShareId, type PronoSharePayload } from '../../utils/pronoSharePayload'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { matchWhenLabel } from '../../utils/tribuneShareLinks'

function formatDefyLine(bet: Bet, match: Match, url: string): string {
  const pick = formatShareStoryPick(bet, match)
  const vs = `${match.home.shortName} contre ${match.away.shortName}`
  if (bet.market === 'exact_score') {
    return `Je dis ${match.home.shortName} ${pick.hero.replace(' – ', '-')} contre ${match.away.shortName}. Toi tu dis quoi ? 👉 ${url}`
  }
  return `Je dis ${pick.hero} (${vs}). Toi tu dis quoi ? 👉 ${url}`
}

export function DefyPoteButton({
  bet,
  match,
  className,
}: {
  bet: Bet
  match: Match
  className?: string
}) {
  const { user } = useAuth()
  const [hint, setHint] = useState<string | null>(null)

  const onDefy = async () => {
    const pick = formatShareStoryPick(bet, match)
    const payload: PronoSharePayload = {
      v: 1,
      matchId: match.id,
      home: match.home.name,
      away: match.away.name,
      homeShort: match.home.shortName,
      awayShort: match.away.shortName,
      homeColor: match.home.colors.primary,
      awayColor: match.away.colors.primary,
      competition: match.competition.shortName,
      when: matchWhenLabel(match),
      displayName: user?.displayName?.trim() || 'Un pote',
      outcome: pick.hero,
      team: pick.team,
      state: 'open',
      sharerId: user?.id ?? 'anon',
      invite: '',
    }
    payload.invite = formatPronoShareInvite(bet, match, APP_ONELINK_URL)
    const id = encodeInlineShareId(payload) || randomShareId()
    const pageUrl = pronoSharePageUrl(id, { src: 'share_prono', from: payload.sharerId })
    const text = formatDefyLine(bet, match, pageUrl)
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Défie un pote — Talk Foot', text, url: pageUrl })
        return
      }
    } catch (err) {
      const name = err instanceof Error ? err.name : ''
      if (name === 'AbortError') return
    }
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`
    try {
      await navigator.clipboard.writeText(text)
      setHint('Lien copié. Tu peux aussi l’envoyer sur WhatsApp.')
    } catch {
      setHint(null)
    }
    window.open(wa, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void onDefy()}
        className={cn(
          TF_FOCUS_VISIBLE,
          'inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-sky-400/40 bg-sky-500/15 px-3 text-xs font-black text-sky-50',
        )}
      >
        Défie un pote
      </button>
      {hint ? <p className="mt-1 text-[10px] font-semibold text-sky-200/80">{hint}</p> : null}
    </div>
  )
}
