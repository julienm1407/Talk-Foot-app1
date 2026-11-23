import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Bet } from '../../types/bet'
import type { Match } from '../../types/match'
import { useAuth } from '../../contexts/AuthContext'
import { useUserBets } from '../../hooks/useUserBets'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { cn } from '../../utils/cn'
import { resolveTeamLogoUrl } from '../../utils/catalogLogos'
import {
  formatFinalScoreLine,
  formatPronoShareInvite,
  formatShareStoryPick,
  matchWhenLabel,
  pronoSharePageUrl,
  recentFormLine,
  tribuneShareUrl,
} from '../../utils/tribuneShareLinks'
import { nativeShareStory } from '../../utils/shareStoryCard'
import { renderPronoShareCards } from '../../utils/renderPronoShareCard'
import { fetchMatchPronoTally } from '../../lib/supabase/matchPronoTally'
import { publishPronoShare } from '../../lib/supabase/pronoShares'
import type { PronoSharePayload } from '../../utils/pronoSharePayload'
import { MIN_COMMUNITY_VOTES, randomShareId } from '../../utils/pronoSharePayload'

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

export function ShareStoryActions({ match, bet, kind, className, tone = 'dark' }: Props) {
  const { user } = useAuth()
  const [allBets] = useUserBets()
  const { myRank } = useLeaderboard()
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const displayName = user?.displayName?.trim() || 'Supporteur'
  const lost = kind === 'prono' && bet?.status === 'lost'

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
            hero: `J’étais là`,
            outcome: 'J’ÉTAIS LÀ',
            team: `${match.home.shortName}–${match.away.shortName}`,
          }
      const vote = await fetchMatchPronoTally(match.id)
      const form = recentFormLine(allBets)
      const state = kind === 'tribune' ? 'open' : bet?.status === 'won' ? 'won' : bet?.status === 'lost' ? 'lost' : 'open'
      const sharerId = user?.id ?? 'anon'
      const payload: PronoSharePayload = {
        v: 1,
        matchId: match.id,
        home: match.home.name,
        away: match.away.name,
        homeShort: match.home.shortName,
        awayShort: match.away.shortName,
        homeColor: match.home.colors.primary,
        awayColor: match.away.colors.primary,
        homeLogoUrl:
          resolveTeamLogoUrl(match.home.id, {
            apiLogoUrl: match.home.logoUrl,
            sportMonksTeamId: match.home.sportMonksTeamId,
          }) ?? undefined,
        awayLogoUrl:
          resolveTeamLogoUrl(match.away.id, {
            apiLogoUrl: match.away.logoUrl,
            sportMonksTeamId: match.away.sportMonksTeamId,
          }) ?? undefined,
        competition: match.competition.name,
        when: matchWhenLabel(match),
        displayName,
        outcome: pick.outcome,
        team: pick.team,
        odds: pick.oddsLabel,
        form,
        state,
        sharerId,
        vote: vote && vote.home + vote.draw + vote.away >= MIN_COMMUNITY_VOTES ? vote : undefined,
        wonScore: state === 'won' ? formatFinalScoreLine(match) : undefined,
        week:
          state === 'won'
            ? {
                rank: myRank,
                tokens: Math.max(0, Math.round((bet?.payout ?? 0) - (bet?.stake ?? 0))),
                pct:
                  vote && bet?.market === 'result_1x2'
                    ? Math.round(
                        (100 *
                          (bet.selection === 'home' ? vote.home : bet.selection === 'away' ? vote.away : vote.draw)) /
                          Math.max(1, vote.home + vote.draw + vote.away),
                      )
                    : 0,
              }
            : undefined,
        invite: '',
      }
      const reservedId = randomShareId()
      let shareUrl =
        kind === 'prono'
          ? pronoSharePageUrl(reservedId, { src: 'share_prono', from: sharerId })
          : tribuneShareUrl(match.id, 'share_tribune')
      const inviteDraft = bet
        ? formatPronoShareInvite(bet, match, shareUrl)
        : `J’étais en tribune ${match.home.shortName}–${match.away.shortName} 👉 ${shareUrl.replace(/^https?:\/\//, '')}`
      payload.invite = inviteDraft
      let { story: finalStory, og } = await renderPronoShareCards(payload, shareUrl)
      const published = await publishPronoShare({ id: reservedId, payload, story: finalStory, og })
      if (kind === 'prono' && published.id !== reservedId) {
        shareUrl = pronoSharePageUrl(published.id, { src: 'share_prono', from: sharerId })
        payload.invite = bet ? formatPronoShareInvite(bet, match, shareUrl) : inviteDraft
        const again = await renderPronoShareCards(payload, shareUrl)
        finalStory = again.story
      }
      if (preview?.objectUrl) URL.revokeObjectURL(preview.objectUrl)
      setPreview({
        objectUrl: URL.createObjectURL(finalStory),
        blob: finalStory,
        fileName: kind === 'prono' ? 'talk-foot-prono.png' : 'talk-foot-tribune.png',
        text: payload.invite,
        shareUrl,
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
    if (result === 'unavailable') {
      setHint('Choisis Instagram, Snapchat ou WhatsApp dans la feuille du téléphone.')
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
        className={cn(
          'rounded-full px-3 py-1.5 text-[11px] font-black text-white disabled:opacity-50',
          lost ? 'bg-slate-600' : 'bg-tf-cta',
        )}
      >
        {busy && !preview
          ? 'Préparation de la carte…'
          : kind === 'tribune'
            ? 'Partager « J’étais en tribune »'
            : lost
              ? 'Revanche ?'
              : 'Partager mon prono'}
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
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void shareFromPreview()}
                    className="rounded-full border border-white/20 px-3 py-2.5 text-xs font-black text-white"
                  >
                    Story Instagram
                  </button>
                  <button type="button" onClick={closePreview} className="py-1 text-xs font-semibold text-sky-200/80">
                    Fermer
                  </button>
                </div>
                {hint ? <p className="mt-2 text-[11px] font-semibold text-sky-100">{hint}</p> : null}
                <p className="mt-2 text-[10px] font-semibold leading-snug text-sky-200/70">
                  Dans la feuille, choisis Instagram (story) ou Snapchat. Le QR ouvre le lien court.
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
